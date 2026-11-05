# KU STEAM CLASSROOM (repozitorija `kusteam-classroom`)

## Projektas
KU STEAM AI LAB interaktyvių pamokų platforma: vedėjai kuria ir veda komandines veiklas, dalyviai prisijungia su kodu.
Oficialus adresas `pamokos.kusteam.app`: vedėjui `/vedejui`, dalyviui `/prisijungti` ir `/play/<kodas>`.
Seni `app.*` ir `play.*` adresai turi toliau veikti (žr. `lib/hosts.ts`).
Ekosistemos architektūra ir atsakomybės: `vyttis/kusteam-ai-lab` → `docs/ECOSYSTEM.md`.
Sąsajoje vaidmenys: „vedėjas“ ir „dalyvis“ (ne „mokytojas/mokinys“); veiksmai „Vesti veiklą“, „Prisijungti prie veiklos“.

## Kalba
- VISA user-facing UI turi būti LIETUVIŲ kalba su teisingais rašmenimis (ąčęėįšųūž)
- Kodas, komentarai, kintamųjų vardai, git žinutės — angliškai
- Dizainas: ultra modernus, mobile-first

## Spalvų paletė
- Primary (žalia): #00D296
- CTA/Accent (rožinė): #FA2864
- Highlight (geltona): #FAC846
- Secondary (mėlyna): #008CB4
- Dark (tamsi melsvai žalia): #00323C
- Background: balta (#FFFFFF), muted (#F8FAFB)

## Tech Stack
- Next.js 16 App Router (`proxy.ts`, ne `middleware.ts`), React 19, TypeScript strict
- Tailwind CSS + shadcn/ui (New York, CSS variables)
- Supabase (Postgres, Auth, Realtime)
- npm kaip package manager

## Svarbiausi principai
1. Atsakymų tikrinimas per Postgres funkciją `check_answer()` — niekada plain text kliente
2. Player aplinka be autentifikacijos — sesija per localStorage session_token
3. Leaderboard realtime per Supabase channel subscriptions
4. AI tik siūlo — mokytojas VISADA patvirtina teisingą atsakymą

## Failų konvencijos
- Server components: naudoti `@/lib/supabase/server.ts`
- Client components: naudoti `@/lib/supabase/client.ts`
- Player API routes: naudoti `@/lib/supabase/admin.ts` (service role)
- API routes: visada validuoti input su zod
- Types: iš `@/types/database.ts` (generated) ir `@/types/game.ts`
- Failų vardai: kebab-case, komponentai: PascalCase

## Duomenų bazė
- Žaidimai identifikuojami per `game_code` (6 simbolių nanoid), ne UUID
- Komandos neturi auth — tik `session_token` localStorage
- `answer_hash` laukas niekada negrąžinamas frontend

## Komandos
```bash
npm run dev          # dev server
supabase start       # lokali DB
supabase db reset    # pritaikyti migracijas
supabase gen types typescript --local > types/database.ts
```
