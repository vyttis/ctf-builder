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
pašalinta ranka. Dabar visi `00001`–`00025` pakeitimai yra DB, tik CLI apie tai
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
         00021 00022 00023 00024 00025 00026; do
  supabase migration repair --status applied "$v"
done
```

> `00007` čia = `00007_di_verification_columns` (vienintelis likęs `00007`).
> `00026` = pervadintas bcrypt. `00023`/`00024` = šio darbo migracijos
> (`team_started_at`, `hint_reveals`) — pažymimos kaip pritaikytos tik jei jos
> jau suvestos ranka produkcijoje (žr. PR deploy žingsnį).

### 3. Patikra

```bash
supabase migration list   # remote ir local stulpeliai turi sutapti
supabase db push          # turi rodyti „Remote database is up to date"
```

## Konvencija toliau

Naujas migracijas kurti tik per CLI, kad versijos būtų unikalios ir
chronologiškos:

```bash
supabase migration new <trumpas_aprasymas>   # sukuria <timestamp>_<aprasymas>.sql
```

Kol schema_migrations tuščia (t. y. kol neatliktas šis runbook'as), naujas
migracijas ir toliau taikyti rankiniu būdu per SQL Editor, viena transakcija.
