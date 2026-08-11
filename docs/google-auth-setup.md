# Google OAuth — produkcinės konfigūracijos checklist'as

> Kodo pusėje OAuth srautas veikia per PKCE: prisijungimo puslapis (`app.kusteam.app/auth/login`)
> įrašo `code-verifier` slapuką **tam pačiam hostui**, o `/auth/callback` jį perskaito keisdamas
> kodą į sesiją. Jei Supabase grąžina kodą į KITĄ hostą (pvz., `www.kusteam.app`), slapuko ten
> nėra ir prisijungimas lūžta su „code verifier" klaida (login puslapyje — `pkce_mismatch`).
> Todėl redirect allow-list'e privalo būti VISI domenai, iš kurių jungiamasi.

## 1. Supabase Dashboard → Authentication → URL Configuration

- **Site URL**: `https://app.kusteam.app`
- **Redirect URLs** (visi keturi):
  - `https://kusteam.app/**`
  - `https://www.kusteam.app/**`
  - `https://app.kusteam.app/**`
  - `https://play.kusteam.app/**`

Lokalus `supabase/config.toml` jau turi tuos pačius įrašus — hosted projektą galima
sinchronizuoti su `supabase config push`, arba suvesti ranka Dashboard'e.

## 2. Supabase Dashboard → Authentication → Providers → Google

- **Enabled**: on
- **Client ID / Client Secret**: iš Google Cloud Console (žr. žemiau)

## 3. Google Cloud Console → APIs & Services → Credentials

OAuth 2.0 Client (Web application):

- **Authorized JavaScript origins**:
  - `https://app.kusteam.app`
  - `https://www.kusteam.app`
  - `https://kusteam.app`
- **Authorized redirect URIs** (Supabase callback, ne mūsų!):
  - `https://<PROJECT_REF>.supabase.co/auth/v1/callback`

## 4. Patikra po pakeitimų

1. Inkognito lange atidaryti `https://app.kusteam.app/auth/login`
2. „Prisijungti su Google" → pasirinkti paskyrą
3. Naršyklė turi grįžti į `https://app.kusteam.app/auth/callback?code=…` (host NEsikeičia!)
4. Sėkmės atveju — `/dashboard` (arba `/onboarding` naujam vartotojui)

Jei 3 žingsnyje host'as pasikeičia į `www.` — redirect allow-list vis dar neapima
`app.kusteam.app` (žr. 1 punktą).

## Dažniausios klaidos

| Simptomas | Priežastis | Taisymas |
|---|---|---|
| Po Google login grįžta į login su `pkce_mismatch` | Kodas grąžintas į kitą hostą nei pradėtas login | 1 punktas — papildyti Redirect URLs |
| `redirect_uri_mismatch` Google puslapyje | Google Console trūksta Supabase callback URI | 3 punktas |
| „Database error saving new user" | `handle_new_user` trigeris lūžta (migracijos nepritaikytos) | `supabase db push` / patikrinti migracijas |
| Veikia lokaliai, neveikia prod | Dashboard konfigūracija nesutampa su `config.toml` | `supabase config push` |
