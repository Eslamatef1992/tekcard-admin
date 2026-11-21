# tekcard-admin

React (Vite) admin dashboard for **Teknulugy NFC smart cards** — `https://admin.teknulugycard.com`.
Talks to the API in the **tekcard-api** repo (`https://back.teknulugycard.com`).

## What you can do
- Create a card: name, job title, company, phone, email, bio
- Upload a banner and a photo/logo
- Add social media / contact buttons (Instagram, TikTok, Snapchat, X, WhatsApp, LinkedIn, Website, Location…) and reorder them
- The link is generated from the name — e.g. `https://eslam.teknulugycard.com` — with a live "available / taken" check
- Live phone preview while editing
- **Copy link** to write on the NFC card, and **Download QR** for printing
- Enable / disable a card, see opens and clicks

## Local development
```bash
npm install
npm run dev        # http://localhost:5173  (uses VITE_API_URL from .env.development -> http://localhost:4000)
```

## Server (82.29.178.28) — first time
```bash
cd /var/www
git clone https://github.com/Eslamatef1992/tekcard-admin.git
cd tekcard-admin
cp .env.example .env     # VITE_API_URL=https://back.teknulugycard.com
./deploy.sh
```
Requires Node 22 at `/opt/node22` (see the tekcard-api README). Nginx serves `/var/www/tekcard-admin/dist` for `admin.teknulugycard.com` — the config is in the **tekcard-api** repo at `deploy/nginx-teknulugycard.conf`.

## Updating (every push)
```bash
cd /var/www/tekcard-admin && ./deploy.sh
```

First login uses `ADMIN_EMAIL` / `ADMIN_PASSWORD` from the API's `.env`. Change the password in **Settings** afterwards.
