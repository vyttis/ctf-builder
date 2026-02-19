# CTF Builder — STEAM LT Klaipėda

## Projektas
CTF Builder SaaS — platforma mokytojams kurti CTF žaidimus klasei.
Dvi aplinkos: teacher (app.*) ir player (play.*).

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
- Next.js 14 App Router, TypeScript strict
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
