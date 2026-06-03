# MyTable Admin, database en Stripe

## STOP 0 — Accounts

1. Maak een [Supabase](https://supabase.com) project (EU-regio).
2. Maak een [Stripe](https://dashboard.stripe.com) account (test mode is genoeg om te starten).
3. Kopieer `.env.example` naar `.env.local` en vul in (zie onder).

## Database

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

## Admin (Google)

1. **Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com)):
   - Project → APIs & Services → Credentials → **Create OAuth client ID**
   - Type: **Web application**
   - Authorized redirect URIs: kopieer uit Supabase (stap 2), bijv.  
     `https://bwxpzxysaecjeqrazxz.supabase.co/auth/v1/callback`
2. **Supabase → Authentication → Providers → Google**: aan, plak Client ID + Client Secret.
3. **Authentication → URL configuration**:
   - Site URL (lokaal): `http://localhost:3001`
   - Redirect URLs (beide toevoegen):
     - `http://localhost:3001/api/auth/callback`
     - `https://dashboard.mytable.club/api/auth/callback`
4. `.env.local`:
   - `ADMIN_EMAILS=jouw@gmail.com`
   - Productie: `NEXT_PUBLIC_ADMIN_URL=https://dashboard.mytable.club`, `ADMIN_HOST=dashboard.mytable.club`
   - Publieke site: `NEXT_PUBLIC_SITE_URL=https://mytable.club` (of je marketing-domein)
5. **Vercel**: domein `dashboard.mytable.club` aan hetzelfde project koppelen (DNS CNAME).
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
| `npm run dev` | Site op poort 3001 |
