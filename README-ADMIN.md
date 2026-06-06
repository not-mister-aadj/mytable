# MyTable Admin, database en Stripe

## STOP 0 — Accounts

1. Maak een [Supabase](https://supabase.com) project (EU-regio).
2. Maak een [Stripe](https://dashboard.stripe.com) account (test mode is genoeg om te starten).
3. Kopieer `.env.example` naar `.env.local` en vul in (zie onder).

## Database

**Localhost** gebruikt **MyTable-dev** (apart Supabase-project). Productie blijft op Vercel.

| Bestand | Doel |
|---------|------|
| `.env.local` | MyTable-dev credentials (localhost) |
| `.env.production.local` | Productie `DATABASE_URL` — alleen voor sync, nooit committen |

### Eerste keer dev setup

1. Maak **MyTable-dev** in Supabase (EU).
2. Plak dev URL/keys in `.env.local` (zie `.env.example`).
3. Kopieer `.env.production.local.example` → `.env.production.local` en vul prod `DATABASE_URL` in.
4. In **MyTable-dev** → Authentication → Redirect URLs: `http://localhost:3001/api/auth/callback`
5. In **MyTable-dev** → Storage: bucket **`media`** (public), zoals prod.
6. Run:

```bash
npm run db:setup-dev
```

Dit maakt het schema aan op dev en kopieert alle data van productie.

### Dagelijks lokaal

```bash
npm run dev
```

Bij elke start: **productie → dev sync** (zodat je met echte data werkt). Snel starten zonder sync:

```bash
DEV_SYNC_ON_START=false npm run dev
# of
npm run dev:no-sync
```

Handmatig opnieuw syncen:

```bash
npm run db:sync-dev
```

**Let op:** wijzigingen in localhost gaan naar **MyTable-dev**, niet naar productie. `push-vercel-env.ps1` pusht geen database-keys meer naar Vercel.

---

## Database (migraties)

```bash
# Migratie (kies één)
npm run db:push
# of voer drizzle/0000_initial.sql uit in Supabase SQL Editor

npm run db:seed
```

Zet daarna in `.env.local`:

```
USE_DB_EVENTS=true
NEXT_PUBLIC_USE_DB_EVENTS=true
```

## Venues & experience types

**Venues** (Dashboard → Venues): restaurants/locaties met naam, stad, foto, beschrijving.

**Types** (Dashboard → Types → **Wijnproeverij**): vast per type (geldt voor **elke** wijnproeverij):

- **Venues** — restaurants/locaties  
- **Paginatekst** — over de ervaring, gallery, FAQ, standaard sfeer-tags  
- **Kaart / route** — optioneel (meestal leeg bij wijnproeverij; auto-kaart rond venues in event-stad)

Bij een nieuwe tafel: alleen datum, stad, prijs, hero, tagline, girls only. Rest komt van het type.

Op de eventpagina: venues gefilterd op **event-stad** waar mogelijk.

## Media library (Supabase Storage)

1. Supabase → **Storage** → New bucket **`media`** → **Public**.
2. Upload via admin editor → **Kies uit library**.

## Admin (Google)

1. **Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com)):
   - Project → APIs & Services → Credentials → **Create OAuth client ID**
   - Type: **Web application**
   - Authorized redirect URIs: kopieer uit Supabase (stap 2), bijv.  
     `https://bwxpzxyzsaecjeqrazxz.supabase.co/auth/v1/callback`
2. **Supabase → Authentication → Providers → Google**: aan, plak Client ID + Client Secret.
3. **Authentication → URL configuration** (eenmalig — hoef je niet te wisselen):
   - **Site URL**: `https://dashboard.mytable.club` (productie, laten staan)
   - **Redirect URLs** (beide toevoegen):
     - `http://localhost:3001/api/auth/callback`
     - `https://dashboard.mytable.club/api/auth/callback`
   - De app kiest automatisch de juiste callback op basis van waar je inlogt (localhost vs dashboard).
4. `.env.local` (lokaal):
   - `NEXT_PUBLIC_SITE_URL=http://localhost:3001`
   - `LOCAL_DEV_ORIGIN=http://localhost:3001`
   - `ADMIN_EMAILS=jouw@gmail.com`
   - Productie-URLs (`NEXT_PUBLIC_ADMIN_URL`, …) mogen in `.env.local` staan; lokaal negeert de app die voor auth.
5. **Vercel** (productie): `NEXT_PUBLIC_SITE_URL=https://mytable.club`, `NEXT_PUBLIC_ADMIN_URL=https://dashboard.mytable.club`
6. Lokaal: [http://localhost:3001/admin/login](http://localhost:3001/admin/login) — productie: **https://dashboard.mytable.club/login**

Alleen e-mails in `ADMIN_EMAILS` komen in `/admin`; andere Google-accounts krijgen “geen toegang”.

## Stripe (lokaal)

1. `STRIPE_SECRET_KEY=sk_test_...` in `.env.local`.
2. Stripe CLI: `stripe listen --forward-to localhost:3001/api/webhooks/stripe`
3. Plak `whsec_...` in `STRIPE_WEBHOOK_SECRET`.
4. Test een boeking op een gepubliceerde tafel.

## Productie (Vercel)

- Alle env vars uit `.env.example` (live Stripe keys + webhook URL `https://jouwdomein.nl/api/webhooks/stripe`).
- Supabase Auth redirect: `https://jouwdomein.nl/api/auth/callback`.

## Scripts

| Commando | Doel |
|----------|------|
| `npm run db:push` | Schema naar Supabase |
| `npm run db:seed` | Catalog → events tabel |
| `npm run dev` | Sync prod→dev, dan site op poort 3001 |
| `npm run dev:no-sync` | Site op poort 3001 zonder sync |
| `npm run db:setup-dev` | Schema + eerste prod→dev sync |
| `npm run db:sync-dev` | Productiedata naar MyTable-dev kopiëren |
| `npx vercel login` | Eenmalig, voor env-sync |
| `.\scripts\push-vercel-env.ps1` | `.env.local` → Vercel (production + preview) |

## Vercel environment variables

Handmatig in **Project → Settings → Environment Variables**, of via script hierboven.

Verplicht (productie): `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `USE_DB_EVENTS`, `NEXT_PUBLIC_USE_DB_EVENTS`, `ADMIN_EMAILS`, `NEXT_PUBLIC_SITE_URL=https://mytable.club`, `NEXT_PUBLIC_ADMIN_URL=https://dashboard.mytable.club`, `ADMIN_HOST=dashboard.mytable.club`.

Optioneel later: `STRIPE_*`, `RESEND_API_KEY`, `EMAIL_FROM`.
