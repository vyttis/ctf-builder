# Vedėjų paskyros ir laiškai

## Kaip žmogus gauna vedėjo paskyrą

Viešos registracijos nėra. Paskyrą gauna tik super administratoriaus
patvirtintas mokytojas. Prašymą galima pateikti tik pro vienas iš „durų“:

| Durys | Kur | Kaip tikrinama |
| --- | --- | --- |
| Veiklos pabaiga | Dalyvio pabaigos ekranas, kai veikloje įjungta „Priimti vedėjo paskyros prašymus“ | Komandos `session_token` toje veikloje |
| Veiklos QR | Klasės ekranas: mygtukas „Rodyti prašymo QR“, po pabaigos rodomas pats | HMAC parašas iš veiklos ID (`lib/access/tokens.ts`) |
| Slapta nuoroda | Administravimas → Paskyrų prašymai → Prašymo nuorodos | Atsitiktinis žetonas `request_links`, galiojimas, atšaukimas, riba |

Veikla priima prašymus, kol vyksta, yra pristabdyta arba 48 val. po pabaigos.
Be teisingo žetono `/prasymas/...` puslapiai grąžina 404.

Patvirtinus prašymą (`/admin/prasymai`):

- naujas el. paštas: Supabase išsiunčia kvietimą, paskyra iškart `active`,
  pirmą kartą prisijungęs mokytojas užpildo profilį (`/onboarding`);
- jau esama paskyra (pvz., bandė jungtis per Google ir laukė): paskyra
  aktyvuojama, platforma išsiunčia laišką „Paskyra patvirtinta“.

Neaktyvios paskyros (`pending`, `blocked`) mato `/laukia`, vedėjo API grąžina
403, o duomenų bazė neleidžia joms rašyti veiklų, užduočių, pranešimų,
pamokų planų ir bibliotekos įrašų (griežtinančios RLS politikos).

Prisijungimo forma kodo nebesiunčia nežinomiems el. paštams
(`shouldCreateUser: false`). Kad ir Google nesukurtų naujų paskyrų, Supabase
nustatymuose išjungti „Allow new users to sign up“ (Authentication → Sign
In / Providers). Kvietimai veikia ir išjungus.

## Laiškai

Dizainas: Claude Design drobė „KU STEAM pamokų laiškai“. Kode jis
perkeltas į lenteles su įterptais stiliais, Arial šriftą ir PNG logotipą
(`public/email/steam-logo.png`), nes pašto programos nerodo flexbox,
internetinių šriftų ir SVG.

| Laiškas | Kam | Siunčia |
| --- | --- | --- |
| Prisijungimo kodas | Vedėjui | Supabase Auth (šablonas `supabase/templates/magic-link.html`) |
| Kvietimas: paskyra patvirtinta | Mokytojui | Supabase Auth (`supabase/templates/invite.html`) |
| Prašymas gautas | Mokytojui | Platforma (`lib/email/templates.ts`) |
| Naujas prašymas | Super administratoriams | Platforma |
| Paskyra patvirtinta (jau buvo paskyra) | Mokytojui | Platforma |
| Prašymas atmestas | Mokytojui | Platforma |
| DI biudžetas 80 % ir 100 % (kiekvienas kartą per mėnesį; jei vienas kvietimas peržengia abi ribas, siunčiamas tik 100 %) | Super administratoriams | Platforma |

Siuntimas: Resend, domenas `kusteam.app` (ES regionas), siuntėjas
`noreply@kusteam.app`, atsakymai į `steam@ku.lt`. Platformos laiškai
siunčiami po atsakymo (`after()`), todėl niekada nestabdo veiksmo; be
`RESEND_API_KEY` jie praleidžiami ir užrašomi į žurnalą (tik tema, be
adreso).

### Sąranka (vieną kartą)

1. Resend: paskyra, domenas `kusteam.app`, regionas EU (Ireland).
2. DNS įrašai, kuriuos rodo Resend (DKIM `resend._domainkey`, `send`
   subdomeno MX ir SPF), Vercel DNS.
3. API raktas (Sending access). Jo niekur nekopijuoti į kodą ar pokalbius:
   - Vercel → ctf-builder → Environment Variables: `RESEND_API_KEY`
     (Production, Preview);
   - Supabase → Authentication → Emails → SMTP Settings: host
     `smtp.resend.com`, port `465`, username `resend`, password = raktas,
     sender `noreply@kusteam.app`, vardas „KU STEAM DI Lab“.
4. Supabase → Authentication → Emails → Templates: „Invite user“ ir „Magic
   link or OTP“ turinys iš `supabase/templates/` (temos nurodytos failų
   pradžioje).
