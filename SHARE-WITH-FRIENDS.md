# Share LK Studio with friends (anywhere in the world)

Your friend is **not on your Wi‑Fi**. They need a **public internet link** or an **APK** that points to your **online server**.

Local IP (`192.168.x.x`) and `npm run dev:anywhere` tunnel only work while **your PC is on** — not good for sending to a friend.

---

## What you need (one time)

1. **Free hosting** for the app (Vercel + free database)
2. Either share a **link** in WhatsApp, or send an **APK file**

---

## Step 1 — Put the app on the internet (Vercel + Neon)

### 1a. Database (Neon — free)

1. Go to [https://neon.tech](https://neon.tech) → sign up → **New project**
2. Copy the **PostgreSQL connection string** (starts with `postgresql://`)

### 1b. Use PostgreSQL in the project

Open `prisma/schema.prisma` and change:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

(Switch back to `sqlite` later for local-only work if you want.)

### 1c. Push database & seed (on your PC)

```powershell
cd C:\Users\saima\Projects\lk-studio

# Paste Neon URL into .env for this command only, or set in .env:
# DATABASE_URL="postgresql://...."

npx prisma db push
npm run db:seed
```

### 1d. Deploy on Vercel (free)

1. Push your project to **GitHub** (if not already)
2. Go to [https://vercel.com](https://vercel.com) → **Add New Project** → import `lk-studio`
3. **Environment variables** (Vercel project → Settings → Environment Variables):

| Name | Value |
|------|--------|
| `DATABASE_URL` | Your Neon `postgresql://...` URL |
| `JWT_SECRET` | Long random text (e.g. 32+ characters) |
| `LOGIN_OTP_DEMO` | `true` (so login works without WhatsApp for testing) |

4. Click **Deploy**
5. Copy your live URL, e.g. `https://lk-studio-xxxx.vercel.app`

Test in browser: open that URL → Customer login → `9123456789` / `demo123`

---

## Step 2 — Share with your friend

### Option A — Link only (easiest, no APK)

Send on WhatsApp:

```text
Open this link in Chrome:
https://YOUR-APP.vercel.app/login/customer

Login:
Mobile: 9123456789
Password: demo123
```

They can use the website like an app: Chrome menu → **Add to Home screen**.

### Option B — Android APK (feels like an installed app)

1. Set your **live** URL in `.env.capacitor`:

```env
CAPACITOR_SERVER_URL=https://YOUR-APP.vercel.app
```

2. Build the APK:

```powershell
npm run build:apk:share
```

3. Send the file **`LK-Studio-debug.apk`** (WhatsApp / Google Drive)
4. Friend: enable **Install unknown apps** → open APK → install → open **LK Studio**

Friend can login from **any country / any Wi‑Fi / mobile data** — no IP setup.

---

## Friend creates their own account

After you deploy, they can use **Register** on the customer login page with their own mobile number, or you create accounts in the app as shop owner.

Demo accounts (from seed):

| Role | Mobile | Password |
|------|--------|----------|
| Customer | 9123456789 | demo123 |
| Shop | 9876543210 | demo123 |

---

## Summary

| Method | Friend needs | Your PC |
|--------|----------------|---------|
| `192.168.x.x:3000` | Same Wi‑Fi | On |
| `npm run tunnel` | Tunnel URL | On |
| **Vercel URL** | Only the link | Off |
| **APK + Vercel URL** | Install APK once | Off |

For sharing with a friend who is far away → use **Vercel URL** or **APK + Vercel URL**.

---

## Need help?

- Blank APK screen → wrong URL in `.env.capacitor` (must be `https://` live site, not `192.168...`)
- Login fails on live site → run `npm run db:seed` against production `DATABASE_URL`
- Build APK errors → install Android Studio (see MOBILE-APK.md)
