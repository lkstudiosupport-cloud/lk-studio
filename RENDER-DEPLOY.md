# Deploy LK Studio on Render

## 1. PostgreSQL

You can use **either**:

- **Render Postgres** â€” create a database in Render and use its Internal/External URL, or  
- **Supabase Postgres** â€” often simpler for local + production sharing one project. See **[SUPABASE.md](./SUPABASE.md)** for passwords, direct vs pooler URLs, and `prisma db push`.

### Render Postgres

Use the **External Database URL** from Render Dashboard (ends with `.singapore-postgres.render.com`).

- **Web Service on Render:** you may use Internal URL if linked to the same Postgres in Render.
- **Your PC (`prisma db push`):** use **External URL** only.

### Supabase Postgres

| Where | `DATABASE_URL` |
|-------|----------------|
| **Local PC** | Direct: `db.<project-ref>.supabase.co:5432` |
| **Render Web Service** | **Session pooler**: `*.pooler.supabase.com:5432` (from Supabase â†’ Connect) |

Render often **cannot** reach `db.<ref>.supabase.co:5432` (IPv6 / network). Use the **Session pooler** (port **5432** on the pooler host), not the direct host.

If you must use **Transaction pooler** (port `6543`), append exactly:  
`?pgbouncer=true&connection_limit=1` â€” otherwise login fails with `prepared statement "s1" already exists`.

Get exact strings from Supabase Dashboard â†’ **Connect**. Project ref for this repo: `stbyjzngeegpycuxiubo`.

**Never commit** `DATABASE_URL` to git. Set it in Render â†’ Environment and in local `.env.local` only.

If a password was shared in chat, **reset it** in Render Postgres â†’ Credentials or Supabase â†’ Settings â†’ Database.

---

## 2. Local database setup (once)

```powershell
cd C:\Users\saima\Projects\lk-studio
```

Create `.env.local` (not committed). Examples:

**Render Postgres:**

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.singapore-postgres.render.com/lkstudio_db"
JWT_SECRET="generate-a-long-random-string"
```

**Supabase (direct connection for schema push):**

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.stbyjzngeegpycuxiubo.supabase.co:5432/postgres"
JWT_SECRET="generate-a-long-random-string"
```

Then:

```powershell
npx prisma generate
npx prisma db push
```

Optional demo data (staging only):

```powershell
$env:ALLOW_DEMO_SEED="true"
npm run db:seed
```

---

## 3. Render Web Service

**New â†’ Web Service** â†’ connect GitHub repo.

| Setting | Value |
|---------|--------|
| **Build Command** | `npm install && npm run build` |
| **Pre-Deploy / Release Command** (optional) | `npm run db:deploy` — run when `prisma/schema.prisma` changed; skip on routine deploys |
| **Start Command** | `npx next start -H 0.0.0.0 -p $PORT` |
| **Health Check Path** | `/` (default) |

**Why not `db push` in the build command?** The old recipe ran `prisma generate` up to **three times** (`postinstall` + explicit + inside `npm run build`) and hit the database during **every** deploy. That often exceeds Render’s free-tier build limit (~15 minutes) or stalls when `DATABASE_URL` uses a host Render cannot reach during build (e.g. Supabase **direct** `db.<ref>.supabase.co`). `postinstall` already runs `prisma generate`; `npm run build` is `next build` only.

**Recommended build env (Dashboard → Environment):**

| Key | Value |
|-----|--------|
| `NEXT_TELEMETRY_DISABLED` | `1` |
| `NODE_VERSION` | `20` (or `22`) — set under **Environment** or `.node-version` in repo |

### Environment variables

| Key | Required | Notes |
|-----|----------|--------|
| `DATABASE_URL` | Yes | Render Postgres URL **or** Supabase **transaction pooler** (port 6543, `?pgbouncer=true`) â€” see [SUPABASE.md](./SUPABASE.md) |
| `JWT_SECRET` | Yes | Long random string |
| `NODE_ENV` | Yes | `production` |
| `SKIP_DEMO_SEED` | Yes | `true` |
| `NEXT_PUBLIC_SUPABASE_URL` | If using Supabase clients | From Supabase â†’ API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | If using Supabase clients | Publishable key only |
| `S3_BUCKET` | Yes* | For order/design photos on Render |
| `S3_ACCESS_KEY_ID` | Yes* | |
| `S3_SECRET_ACCESS_KEY` | Yes* | |
| `S3_REGION` | Yes* | e.g. `ap-south-1` |
| `S3_PUBLIC_URL` | Recommended | Public base URL for images |
| `RAZORPAY_*` | If live payments | |
| `WHATSAPP_*` | If OTP on production | |

\* Without S3, file uploads fail in production (ephemeral disk).

**Do not set** `LOGIN_OTP_DEMO=true` in production.

---

## 4. After deploy

1. Open `https://your-service.onrender.com`
2. Register shop/customer or seed with `ALLOW_DEMO_SEED` once on staging
3. APK: `CAPACITOR_SERVER_URL=https://your-service.onrender.com` â†’ `npm run build:apk:share`

---

## 5. Play Store

See `SHARE-WITH-FRIENDS.md` and `PLAY-STORE-CHECKLIST.md` (if present). Use HTTPS Render URL in Capacitor.
---

## 6. Deploy timeouts (build vs start)

| Symptom in Render logs | Phase | Likely cause |
|------------------------|-------|----------------|
| Stuck on `prisma db push` or `Can't reach database` | **Build** | `DATABASE_URL` wrong for Render, or `db push` in **Build Command** |
| Stuck on `npm install` / `prisma generate` | **Build** | Cold cache + large deps; duplicate `prisma generate` |
| `Creating an optimized production build` for many minutes | **Build** | Slow CPU on free tier; usually finishes in &lt;5 min after CSS/TS fixes |
| Build succeeds; “Timed out” / never **Live** | **Start / health** | App not listening on `$PORT`, crash on boot, or health check never returns 200 |

**Start phase:** `npm run db:seed` is **not** run automatically. `SKIP_DEMO_SEED=true` only affects manual `npm run db:seed`. Missing it does **not** hang startup.

**After changing schema:** run `npm run db:deploy` once (Release Command or Render Shell), not on every build.

