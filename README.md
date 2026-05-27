# CTF Builder

STEAM LT Klaipėda — SaaS platforma mokytojams kurti CTF (Capture The Flag) žaidimus klasei.

## Architektūra

- **Next.js 14 App Router** (TypeScript strict)
- **Supabase** (Postgres, Auth, Realtime, Storage)
- **Tailwind + shadcn/ui** (New York, CSS variables)
- **Anthropic Claude** AI generavimui (pamokų planai, užduotys)
- **Dvi aplinkos**: teacher (`app.*`) ir player (`play.*`)

## Lokalus paleidimas

```bash
npm install
cp .env.local.example .env.local   # užpildyti reikšmes
supabase start                      # lokali Postgres + auth
supabase db reset                   # pritaikyti migracijas
supabase gen types typescript --local > types/database.ts
npm run dev
```

Atviras `http://app.localhost:3000` (mokytojas), `http://play.localhost:3000/<code>` (žaidėjas).

## Skriptai

- `npm run dev` — dev server
- `npm run build` / `npm start` — production
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type check

## Svarbiausi principai

1. Atsakymų tikrinimas server-side (`/api/submissions`) — niekada plain text kliente.
2. Player aplinka be auth — sesija per `session_token` localStorage.
3. Player rašymo operacijos eina per service_role API route'us; anon INSERT lockdown DB sluoksnyje.
4. AI tik **siūlo** — mokytojas visada patvirtina teisingą atsakymą.
5. `answer_hash` niekada negrąžinamas į frontend — `SAFE_CHALLENGE_COLUMNS` whitelist.

## Aplankų struktūra

- `app/` — Next.js App Router puslapiai ir `/api/*` routes
- `app/(teacher)/` — autentifikuota teacher aplinka
- `app/play/[gameCode]/` — žaidėjo flow (be auth)
- `lib/ai/` — Claude prompts, schemas, helper'iai
- `lib/supabase/` — trijų klientų pattern: `server.ts`, `client.ts`, `admin.ts`
- `lib/auth/roles.ts` — RBAC: `teacher` / `admin` / `super_admin`
- `lib/game/` — answer hashing, session, achievements, scoring
- `supabase/migrations/` — DB schema (`00001` … `00018`)
- `components/` — domain'ų pakaitinamai sugrupuoti (`teacher/`, `player/`, `admin/`, `landing/`, `ui/`)

## Spalvų paletė (Tailwind)

Naudoti **tik** šiuos tokens (`steam-*` arba theme: `primary`, `secondary`, `accent`, `highlight`, `muted`):

- žalia `#00D296` (primary)
- rožinė `#FA2864` (CTA / accent)
- geltona `#FAC846` (highlight)
- mėlyna `#008CB4` (secondary)
- tamsi `#00323C` (dark)

## Saugumas

- RLS visose lentelėse, anon INSERT izoliuotas (00018).
- bcrypt 10 rounds answer hashing.
- `SECURITY DEFINER` funkcijos EXECUTE apribotos `service_role` (00018).
- Documents storage bucket'as su user-folder RLS.

## Kalba

- UI: VISA lietuvių kalba su teisingomis raidėmis (ąčęėįšųūž).
- Kodas, komentarai, kintamųjų vardai, git žinutės: anglų.
