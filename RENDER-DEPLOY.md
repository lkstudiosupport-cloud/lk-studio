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
| `S3_ACCESS_KEY_ID` | Yes* | IAM user with `s3:PutObject` on the bucket |
| `S3_SECRET_ACCESS_KEY` | Yes* | |
| `S3_REGION` | Yes* | e.g. `ap-south-1` |
| `S3_PUBLIC_URL` | Recommended | Public base URL for images (bucket website or CloudFront) |
| `S3_ENDPOINT` | Optional | Cloudflare R2 or other S3-compatible endpoint |
| `NEXT_PUBLIC_SITE_URL` | Recommended | e.g. `https://lk-studio-1.onrender.com` (privacy/terms links) |
| `RAZORPAY_KEY_ID` | If live autopay | Test `rzp_test_...` from dashboard |
| `RAZORPAY_KEY_SECRET` | If live autopay | Server-only; from same API key pair |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | If live autopay | Same Key Id as `RAZORPAY_KEY_ID` |
| `RAZORPAY_WEBHOOK_SECRET` | If webhooks | Razorpay webhook signing secret |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Database / storage | Supabase API keys |
| `MSG91_AUTH_KEY` | **Production OTP** | Server-only; verifies widget `access-token` |
| `NEXT_PUBLIC_MSG91_WIDGET_ID` | **MSG91 Widget** | From MSG91 OTP widget settings |
| `NEXT_PUBLIC_MSG91_WIDGET_TOKEN` | **MSG91 Widget** | Widget auth token (not authkey) |
| `MSG91_TEMPLATE_ID` | Optional | Server Flow SMS if not using widget |
| `MSG91_OTP_VARIABLE` | Optional | Template variable name (default `OTP`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server-only; never expose in client |

\* Without S3, file uploads fail in production (ephemeral disk). The API returns a clear error: *File storage not configured…*

### MSG91 OTP (production)

**Recommended — OTP Widget**

1. MSG91 Dashboard → **OTP** → create **Widget** → copy **Widget ID** and **Auth Token**
2. MSG91 → **API** → copy **Authkey** (server only)
3. On Render:
   - `NEXT_PUBLIC_MSG91_WIDGET_ID` = widget ID
   - `NEXT_PUBLIC_MSG91_WIDGET_TOKEN` = widget token
   - `MSG91_AUTH_KEY` = authkey
4. Redeploy. Login/register sends OTP via MSG91 widget; your server calls `verifyAccessToken` with the JWT.

**Alternative — server Flow API** (no widget): set `MSG91_AUTH_KEY` + `MSG91_TEMPLATE_ID` instead of widget public vars.

You can disable Supabase Phone provider — it is not used for OTP.


### Razorpay (test mode for staging)

Use **Test mode** in [Razorpay Dashboard](https://dashboard.razorpay.com/) → **Account & Settings** → **API Keys**. Copy **Key Id** and **Key Secret** (secret is shown once when generated or regenerated).

| Key | Required | Notes |
|-----|----------|--------|
| `RAZORPAY_KEY_ID` | Yes (live autopay) | Test: `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Yes (live autopay) | **Never** commit; set only in Render Environment or local `.env` / `.env.local` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Recommended | Same **Key Id** as `RAZORPAY_KEY_ID` for client checkout |
| `RAZORPAY_WEBHOOK_SECRET` | Recommended | Dashboard → **Webhooks** → endpoint `https://<your-service>/api/subscription/webhook` |
| `RAZORPAY_PLAN_ID_SHOP` | Optional | Omit to auto-create shop plan on first subscription |
| `RAZORPAY_PLAN_ID_CUSTOMER` | Optional | Omit to auto-create customer plan on first subscription |

**Local dev:** copy `.env.example` to `.env.local` (or use `.env`), set `RAZORPAY_KEY_ID`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET` from the dashboard. Autopay stays in demo mode until **both** Key Id and Key Secret are set (`isRazorpayConfigured()` in `src/lib/razorpay-config.ts`).

**Render:** add the same values under Environment, redeploy, and register the webhook URL in Razorpay to your Render service URL.

### S3 setup (AWS example)

1. Create an S3 bucket (e.g. `lk-studio-uploads`) in `ap-south-1`.
2. Enable **Block Public Access** off only if using public object URLs, or serve via CloudFront.
3. Bucket policy: allow public `GetObject` on `uploads/*` if using direct S3 URLs, **or** use `S3_PUBLIC_URL` pointing to a CDN.
4. IAM → Users → create access key with policy limited to `s3:PutObject`, `s3:GetObject` on that bucket.
5. In Render → Environment, set `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, and `S3_PUBLIC_URL` (e.g. `https://lk-studio-uploads.s3.ap-south-1.amazonaws.com`).
6. Redeploy. Test profile photo or order image upload in the app.

**Do not set** `LOGIN_OTP_DEMO=true`, `NEXT_PUBLIC_SHOW_DEMO_LOGIN=true`, or `ALLOW_DEMO_FEATURES=true` in production.

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
