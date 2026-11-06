# Migracijų istorija ir perėjimas prie Supabase CLI

## Dabartinė būklė

Migracijos produkcijoje buvo taikomos **rankiniu būdu per Supabase SQL Editor**,
ne per `supabase db push`. Todėl CLI istorijos lentelė yra tuščia:

```sql
SELECT count(*) FROM supabase_migrations.schema_migrations;  -- 0
```

Iki 2026-11-05 produkcijoje trūko `00021` (`challenges.needs_answer`), nors
`00022`–`00024` buvo pritaikytos. Tai laužė veiklos puslapį ir užduočių kūrimą.
2026-11-05 `00021` pritaikyta (prieš tai `public.challenges` nukopijuota į
`backup_20261105.challenges`), taip pat pritaikyta `00025` (Security Advisor
pataisos). Lentelės `templates` produkcijoje nėra, nors `00001` ją kuria: ji buvo
pašalinta ranka. Taip pat sutaisytos dviejų 2026-03-03 komandų taškų sumos, kurių
`increment_team_score` tuo metu neatnaujino (senos reikšmės
`backup_20261105.team_totals`). Dabar visi `00001`–`00025` pakeitimai yra DB, tik CLI apie tai
„nežino". Praktinės pasekmės:

- `supabase db push` bandytų taikyti **visą** `00001…` seką iš naujo → lūžtų ties
  `already exists`. **Nenaudokite `db push`, kol neatliktas žemiau aprašytas
  `migration repair`.**
- Naujos migracijos taikomos taip pat rankiniu būdu (žr. PR aprašymus, kur
  pateikiamas paruoštas SQL, apgaubtas `BEGIN; … COMMIT;`).

## Žinoma problema: dubliuotas `00007` prefiksas

Du failai dalinasi ta pačia versija:

| Failas | Ką daro | Priklausomybės |
|---|---|---|
| `00007_bcrypt_answer_hash.sql` | `pgcrypto` + `check_answer` perrašymas (grynas idempotentiškas DDL) | Nei nuo ko, nei kas nuo jo |
| `00007_di_verification_columns.sql` | prideda `generated_by_di`, `verification_*` stulpelius į `challenges` | **Turi būti prieš `00018`** (jis deda CHECK ant `verification_confidence`) |

CLI `schema_migrations.version` yra unikalus raktas → dvi `00007` versijos
sukeltų konfliktą. Kol taikoma rankiniu būdu, tai nekelia jokių problemų.

## Runbook: perėjimas prie CLI valdomų migracijų

Atlikti **vieną kartą**, kai norima pereiti nuo rankinio prie `supabase db push`.

### 1. Išspręsti `00007` dublį (repo pakeitimas)

`00007_bcrypt_answer_hash.sql` yra idempotentiškas DDL be jokios eiliškumo
priklausomybės (tik `create extension if not exists` ir `create or replace
function`), todėl saugu jam suteikti naują, unikalią versiją gale sekos:

```bash
git mv supabase/migrations/00007_bcrypt_answer_hash.sql \
       supabase/migrations/00026_bcrypt_answer_hash.sql
```

`00007_di_verification_columns.sql` lieka `00007` (jis privalo būti prieš
`00018`). Po pervadinimo atnaujinti dvi istorines nuorodas komentaruose, kad
neliktų dviprasmybės:

- `00018_audit_hardening.sql` — „Pre-bcrypt migration 00007…" → be numerio.
- `00013_challenge_paths.sql` — „pattern from 00005/00007" → „from 00005".

### 2. Pažymėti visas esamas migracijas kaip pritaikytas

Kadangi schema jau DB, pasakome CLI to nekartoti (versijos = failų prefiksai,
be `_` ir aprašymo). Po 1 žingsnio galutinis sąrašas:

```bash
for v in 00001 00002 00003 00004 00005 00006 00007 00008 00009 00010 \
         00011 00012 00013 00014 00015 00016 00017 00018 00019 00020 \
         00021 00022 00023 00024 00025 00026 \
         20261106120000 20261106130000 20261106140000; do
  supabase migration repair --status applied "$v"
done
```

> `00007` čia = `00007_di_verification_columns` (vienintelis likęs `00007`).
> `00026` = pervadintas bcrypt. `20261106120000` = atsakymų ir rolių
> spragos, `20261106130000` = uždara registracija, `20261106140000` = neaktyvios paskyros be teisių; visos pritaikytos ranka 2026-11-06 (žr. žemiau). `00023`/`00024` = šio darbo migracijos
> (`team_started_at`, `hint_reveals`) — pažymimos kaip pritaikytos tik jei jos
> jau suvestos ranka produkcijoje (žr. PR deploy žingsnį).

### 3. Patikra

```bash
supabase migration list   # remote ir local stulpeliai turi sutapti
supabase db push          # turi rodyti „Remote database is up to date"
```

## 2026-11-06: atsakymų, rolių ir statistikos spragos

Failas `supabase/migrations/20261106120000_close_answer_and_role_gaps.sql`
(pavadintas pagal CLI konvenciją, todėl nesikerta su runbook'e numatytu
`00026`). Grąžinimas: `supabase/rollback/20261106120000_close_answer_and_role_gaps.sql`.
Abu failai tikrinami `npm run test:db` (visos migracijos tuščioje Postgres 16,
saugumo patikros, grąžinimas ir pakartotinis pritaikymas) ir CI darbe „Database".

Taikymas produkcijoje: SQL Editor, visas failas (jame yra `BEGIN; … COMMIT;`).
Duomenys nekeičiami, keičiami tik leidimai, viena politika ir trys funkcijos.
Prieš ir po taikymo paleisti šią patikrą:

```sql
select
  has_column_privilege('authenticated','public.submissions','answer','SELECT') as auth_answer,
  has_column_privilege('authenticated','public.challenges','answer_hash','SELECT') as auth_hash,
  has_column_privilege('authenticated','public.profiles','role','UPDATE') as auth_role,
  has_function_privilege('anon','public.get_game_reflections(uuid)','EXECUTE') as anon_reflections,
  has_function_privilege('anon','public.get_game_stats(uuid)','EXECUTE') as anon_stats,
  has_function_privilege('anon','public.get_platform_stats()','EXECUTE') as anon_platform;
```

Prieš taikymą (2026-11-06): visi `true`. Po taikymo visi turi būti `false`.

Pritaikyta produkcijoje 2026-11-06 apie 12:58 (prieš tai atsarginė kopija
`backup_20261106` ir PR #48, kuris pakeitė `challenges(count)` į
`challenges(id)`). Po taikymo: visi šeši `false`; `authenticated` mato
`challenges.title`, gali keisti `profiles.full_name`, vykdyti
`get_game_stats`; atvira užduočių politika tik `anon`. Eigos patikra su
veikla PN3BJ5: kūrimas, užduotys, pradžia, prisijungimas, atsakymai, klasės
ekranas (realtime), analitika, administravimo statistika, pabaiga.

Svarbu toliau: naujiems `challenges` ir `submissions` stulpeliams `SELECT`
reikia suteikti atskirai abiem rolėms (`anon` ir `authenticated`), kitaip
puslapiai jų nematys. `teams`, `challenges` ir `submissions` lentelėms
naudotojo sesija negali naudoti `(count)` ar `(*)` įterpimų (PostgREST
atsako „permission denied“); tai tikrina `tests/column-grants.test.ts`.

## 2026-11-06: uždara registracija ir DI apskaita

Failas `supabase/migrations/20261106130000_access_requests_and_ai_usage.sql`,
grąžinimas `supabase/rollback/20261106130000_access_requests_and_ai_usage.sql`.
Tik prideda: `profiles` stulpelius (`status`, vardas, pavardė, mokyklos
kodas, savivaldybė, dalykai, klasės, sutikimas, patvirtinimas, DI limitas),
lenteles `request_links`, `access_requests`, `admin_audit_log`, `ai_usage`,
`platform_settings` (tik serveriui), griežtinančias politikas (rašyti
veiklas, užduotis, pranešimus, pamokų planus, bibliotekos įrašus ir failus
saugykloje gali tik `status = 'active'` paskyros), `games.finished_at` su
trigeriu ir nuorodų limito trigerį (`KS410`). Esamos paskyros gauna `active`, naujos
`pending`.

Patikra po taikymo:

```sql
select
  (select count(*) from public.profiles where status <> 'active') as not_active,
  (select count(*) from public.platform_settings) as settings_rows,
  has_table_privilege('authenticated','public.access_requests','SELECT') as auth_requests,
  has_column_privilege('authenticated','public.profiles','status','UPDATE') as auth_status,
  (select count(*) from pg_policies where policyname like 'Only active accounts%') as active_policies,
  (select count(*) from pg_trigger where tgname in ('games_finished_at', 'access_requests_link_open')) as triggers,
  (select count(*) from public.games where status = 'finished' and finished_at is null) as finished_without_time;
```

Tikimasi: `not_active` 0, `settings_rows` 1, abu leidimai `false`,
`active_policies` 18 (15 lentelėms, 3 `storage.objects`), `triggers` 2,
`finished_without_time` 0.

Pritaikyta produkcijoje 2026-11-06 apie 13:35 (patvirtino Vytis, prieš tai
atsarginė kopija `backup_20261106.profiles_before_0613`). Po taikymo patikra:
`not_active` 0, `settings_rows` 1, abu leidimai `false`, `active_policies` 18,
`triggers` 2, `finished_without_time` 0, `profiles.status` numatytasis
`pending`.

## 2026-11-06: neaktyvios paskyros be administratoriaus teisių

Failas `supabase/migrations/20261106140000_inactive_accounts_lose_privileges.sql`,
grąžinimas `supabase/rollback/20261106140000_inactive_accounts_lose_privileges.sql`.
`get_my_role()` grąžina `teacher`, jei paskyra ne `active`; pamokų planų ir
refleksijų administratorių politikos naudoja `get_my_role()`; neaktyvi
paskyra negali keisti `profiles`. Duomenys nekeičiami.

Patikra po taikymo:

```sql
select
  pg_get_functiondef('public.get_my_role()'::regprocedure) like '%status = ''active''%' as role_checks_status,
  (select count(*) from pg_policies where policyname = 'Only active accounts update profiles') as profile_policy,
  (select count(*) from pg_policies where tablename in ('lesson_plans', 'reflections')
     and policyname like 'Admins%' and qual like '%get_my_role%') as admin_policies;
```

Tikimasi: `role_checks_status` `true`, `profile_policy` 1, `admin_policies` 4.

## Konvencija toliau

Naujas migracijas kurti tik per CLI, kad versijos būtų unikalios ir
chronologiškos:

```bash
supabase migration new <trumpas_aprasymas>   # sukuria <timestamp>_<aprasymas>.sql
```

Kol schema_migrations tuščia (t. y. kol neatliktas šis runbook'as), naujas
migracijas ir toliau taikyti rankiniu būdu per SQL Editor, viena transakcija.
