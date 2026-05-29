# Audit'o talking points — 1 pager

> Trijų klausimų, kuriuos turbūt užduos Švietimo ministerijos atstovai, atsakymai.
> Skirtas vartotojui (KU STEAM komandai). Atsakyti mintinai, nešnekant kaip iš lentelės.

---

## 1. „Kodėl CTF žaidimas, o ne tradicinis testas?"

**Atsakymas (30 s):**

Tradicinis testas matuoja žinias. CTF žaidimas ugdo **procesinius gebėjimus** — problemų skaidymą, komandinį bendradarbiavimą, hipotezių tikrinimą.

Mokinys ne tik pateikia atsakymą — naudoja užuominas, eksperimentuoja, klysta ir taisosi. STEAM dalykuose (programavimas, robotika, gamtos mokslai) toks iteracinis mąstymas yra esminis.

**Konkretus pavyzdys:** 7 kl. Matematika + Fizika „Greičio ir pagreičio" integruota pamoka — mokiniai apskaičiuoja greitį (matematika), aiškinasi kelio kreivę (fizika), formuluoja hipotezę apie pagreičio kryptį (Bloom sintezės lygis).

**Jei klaus „kuo skiriasi nuo Kahoot?":**

> Kahoot greitai matuoja faktines žinias. CTF Builder kuria struktūrizuotą pamokos eigą: įvadas → veiklos → diskusija → refleksija. Mokytojas valdo srautą, ne taimerį. Pridėtinė vertė — pedagoginė refleksija po pamokos su klasės rezultatų suvestine.

---

## 2. „Kaip Lietuvos BUP integruota?"

**Atsakymas (30 s):**

Visi AI sugeneruoti pamokos planai išreikštai susieti su Lietuvos bendrosiomis ugdymo programomis. Kiekvienai veiklai nurodoma:

- **Konkretus BUP skyrius** — `curriculum_link` lauke (pvz., „BUP, Matematika 7 kl., 2.3 skyrius — funkcijų ir santykių taikymas")
- **Viena iš 6 BUP bendrųjų kompetencijų** — komunikavimo, pažinimo, kultūrinė, kūrybiškumo, pilietiškumo, socialinė-emocinė ir sveikos gyvensenos
- **Bloom'o taksonomijos lygis** — pritaikytas pagal klasės etapą (1-4 kl. daugiausia žinios/supratimas/taikymas; 9-12 kl. apima ir sintezę/vertinimą)
- **VLKK terminija** — be anglicizmų, su teisingomis raidėmis (ąčęėįšųūž)

**Demonstracija:** atidaryti demo lesson plan'ą, parodyti:
1. „Ugdomos kompetencijos" kortelę top-level
2. Per-stage Bloom lygį (badge'as)
3. Per-stage kompetencijų badges
4. `curriculum_link` apačioje

**Jei klaus „kas tikrina, ar AI iš tiesų atitinka BUP?":**

> Mokytojas. Sistema pasiūlo, mokytojas patvirtina arba redaguoja. AI niekada nepublikuoja turinio be akivaizdaus mokytojo veiksmo. Tai esminis pedagoginis sluoksnis — DI yra asistentas, ne autorius.

---

## 3. „Kaip mokinių duomenys saugomi (GDPR)?"

**Atsakymas (30 s):**

Mokiniai **neturi paskyrų**. Prisijungia per **32 simbolių sesijos žetonus** localStorage'e su 24 val. TTL. Asmens duomenys neprašomi — tik komandos vardas (gali būti pseudonimas, pvz., „Audito komanda").

Mokytojas mato tik savo klasės duomenis per **Row Level Security** politikas. Service role'as izoliuotas Supabase service_role JWT — niekada nepasiekiamas browser'iui.

Atsakymai saugomi **anonimiškai prie komandos**, ne individo. Refleksijos — su komanda, be vardų.

**Demonstracija:** parodyti `supabase/migrations/00014_tighten_rls_add_indexes.sql` ir `00018_audit_hardening.sql` kaip evidence:
- RLS izoliacija tarp mokytojų
- `submissions` INSERT — tik per service_role
- `documents` storage bucket — privatus, per user-folder RLS

**Jei klaus „kur fiziškai saugomi duomenys?":**

> Šiuo metu Supabase EU regione (Vakarų Europa). Jei mokyklai aktualu griežtesnis data residency — galima migruoti į Supabase self-hosted Lietuvoje (AWS Frankfurt arba Vilniaus duomenų centras).

**Jei klaus „kaip vykdomas „teisė būti pamirštam"?":**

> Mokytojas gali ištrinti komandos sesiją per Supabase Dashboard'ą. Per kitą sprintą (post-audit) pridėsime soft-delete + audit log mechanizmą — visi trynimai bus loginami, paliekant mokyklai aiškų auditinį pėdsaką.

---

## Papildomi klausimai — short answers

**„Kiek mokyklų naudojasi?"**
> Šiuo metu prieiga atvira KU STEAM metodinio centro partnerių tinklui. Numatoma plečiama palaipsniui pagal mokyklų pasirengimą.

**„Kiek kainuoja mokyklai?"**
> Šiuo metu — nemokama partnerių mokykloms. Modelis vystomas su KU STEAM centro komanda.

**„Kas vadovauja projektui?"**
> Klaipėdos universiteto STEAM metodinis centras. Kontaktai: steam@ku.lt, +370 (46) 398 978.

**„Ar veiks tinklo trūkumo zonose?"**
> Sistemai reikia interneto. Mokinio sesija įkeliama vieną kartą; trumpalaikiams tinklo trūkumams atsparu (atsakymai cache'inami client-side iki sėkmingo POST'o).

**„Kas yra atsakomybė už AI sugeneruoto turinio kokybę?"**
> Mokytojas. AI yra padėjėjas — visada teikia pasiūlymą, kurį mokytojas patvirtina ar redaguoja. Pedagoginė atsakomybė lieka pas profesionalą.

---

## Pavojingi klausimai — vengti

❌ „Kiek vartotojų?" → nesakyti konkrečių skaičių (kol nesusitarsime su KU komanda)
❌ „Kada bus prieinama visoms LT mokykloms?" → „Plečiama palaipsniui"
❌ „Kas jūsų konkurentai?" → vengti palyginimų; sakyti „dirbame kitokia kryptimi nei testų įrankiai"
❌ „Kiek kainuoja AI?" → vengti tikslių skaičių; „kaštai surinkti pagal LT mokyklų realybę"
