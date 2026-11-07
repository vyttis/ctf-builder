# Suplanuoti darbai

## Paliktų vykti veiklų užbaigimas

Savininko sprendimas (2026-11-07): po pamokos palikta vykti veikla baigiama
automatiškai.

- Kada: kas naktį 02:00 UTC (04:00 Vilniaus laiku žiemą, 05:00 vasarą),
  Vercel Cron (`vercel.json`). Kartą per dieną, todėl tinka ir Hobby planui.
- Kas baigiama: vykstanti arba pristabdyta (`active`, `paused`) veikla, kuri prasidėjo prieš
  6 val. ir kurioje 2 val. nebuvo atsakymų, naujų komandų ar vedėjo veiksmų
  (pauzė, tęsimas, pratęsimas). Taisyklė ir ribos: `lib/game/stale.ts`.
- Kaip: `GET /api/cron/finish-stale-activities` keičia būseną į `finished`
  taip pat, kaip administratoriaus „Baigti“ (rezultatai lieka, pauzės laikas
  įskaitomas). Kiekvienas užbaigimas įrašomas į `admin_audit_log` kaip
  `game_auto_finish` be `actor_id`.
- Apsauga: Vercel siunčia `Authorization: Bearer $CRON_SECRET`. Be
  `CRON_SECRET` aplinkos kintamojo maršrutas grąžina 503 ir nieko nedaro.

### Sąranka (vieną kartą)

1. Vercel → ctf-builder → Settings → Environment Variables: `CRON_SECRET`,
   reikšmė atsitiktinė (pvz. `openssl rand -hex 32`), tipas Sensitive,
   aplinka Production. Reikšmės niekur nekopijuoti.
2. Perdiegti produkciją (Redeploy), kad kintamasis įsigaliotų.
3. Settings → Cron Jobs turi rodyti `/api/cron/finish-stale-activities`.
   Ten pat mygtukas „Run“ paleidžia darbą rankiniu būdu.

Rezultatas matomas Vercel žurnale: įvykis `auto_finish_done` su `checked`,
`finished` ir `failed` skaičiais. Jei darbas nespėjo per 45 s
(`stopped: "time_budget"`), likusios veiklos laukia kitos nakties. Jei
nepavyko perskaityti sąrašo (`stopped: "list_failed"`), atsakymas 500 ir
Vercel pažymi paleidimą kaip nepavykusį.
