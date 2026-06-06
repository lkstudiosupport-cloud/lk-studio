# Supabase (LK Studio)

Project ref: `stbyjzngeegpycuxiubo`  
Dashboard: [https://supabase.com/dashboard/project/stbyjzngeegpycuxiubo](https://supabase.com/dashboard/project/stbyjzngeegpycuxiubo)

LK Studio uses **Prisma** against Postgres (`prisma/schema.prisma` → `provider = "postgresql"`). Supabase Auth / Realtime clients use the publishable key and project URL (see below).

**Never commit real database passwords or service-role keys.** Use `.env.local` locally and Render environment variables in production.

---

## 1. Database password

1. Open **Supabase Dashboard** → your project.
2. **Project Settings** (gear) → **Database**.
3. Use **Database password** (set or reset if you do not have it).
4. Put the password only in `.env.local` or Render env vars — not in git.

Connection strings in the dashboard (**Connect** / **Connection string**) already include the correct host; copy from there if your region or pooler hostname differs from the examples in `.env.example`.

---

## 2. `DATABASE_URL` — direct vs poolers (Prisma)

| Mode | Port | Typical use | Prisma notes |
|------|------|-------------|--------------|
| **Direct** | `5432` on `db.<ref>.supabase.co` | Local dev, `prisma db push`, migrations | Full Postgres features; one persistent connection is fine on your PC. |
| **Session pooler** | `5432` on `*.pooler.supabase.com` | Apps that need **prepared statements** / some session features | Use only if Supabase docs for your driver recommend it; not the default for Prisma on serverless. |
| **Transaction pooler** | `6543` on `*.pooler.supabase.com` | **Render**, Vercel, other serverless | Append `?pgbouncer=true` (and usually `&connection_limit=1` for Prisma). Required for Prisma + PgBouncer transaction mode. |

### Local development (recommended)

Direct connection (placeholder password):

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.stbyjzngeegpycuxiubo.supabase.co:5432/postgres"
```

Copy `.env.example` → `.env.local`, replace `[YOUR-PASSWORD]`, then:

```powershell
cd C:\Users\saima\Projects\lk-studio
npx prisma generate
npx prisma db push
```

Optional demo seed (staging only):

```powershell
$env:ALLOW_DEMO_SEED="true"
npm run db:seed
```

### Render production (recommended)

Render often **cannot** connect to `db.<ref>.supabase.co` directly. Use **Session pooler** (port **5432** on the pooler host) from Supabase → **Connect**:

```env
DATABASE_URL="postgresql://postgres.stbyjzngeegpycuxiubo:[YOUR-PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

Copy the exact host from your dashboard (region may differ).

**Alternative:** Transaction pooler (port **6543**) — must include Prisma flags or login fails:

```env
DATABASE_URL="postgresql://postgres.stbyjzngeegpycuxiubo:[YOUR-PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

- Set this in **Render → Web Service → Environment** (not in git).
- Keep **direct** URL on your PC for `prisma db push`.

See also [RENDER-DEPLOY.md](./RENDER-DEPLOY.md).

---

## 3. API URL and publishable key (SSR / browser)

**Project Settings → API**:

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL, e.g. `https://stbyjzngeegpycuxiubo.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Publishable** key (or legacy anon key during migration) |

Add the real values to **`.env.local` only** (project URL and publishable key from Dashboard → API). Helpers live under `src/utils/supabase/` (`client.ts`, `server.ts`, `middleware.ts`); `src/middleware.ts` calls `updateSession` to refresh Supabase Auth cookies on each matched request.

- **Do not** expose `service_role` or secret keys via `NEXT_PUBLIC_*`.
- LK Studio’s main app auth today uses JWT + Prisma (`lk_session` in `src/lib/auth.ts`); Supabase middleware and clients run in parallel and do not replace shop/customer login until you wire routes to Supabase Auth.

Packages already in the repo: `@supabase/supabase-js`, `@supabase/ssr`.

**Render:** set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the Web Service environment (see [RENDER-DEPLOY.md](./RENDER-DEPLOY.md)).

---

## 4. Checklist

- [ ] Database password set in Dashboard → Database
- [ ] `.env.local` with `DATABASE_URL` (direct for local push)
- [ ] `npx prisma db push` after schema changes
- [ ] Render `DATABASE_URL` = transaction pooler + `?pgbouncer=true`
- [ ] `NEXT_PUBLIC_SUPABASE_*` set if using `src/utils/supabase/` clients
- [ ] No passwords in git; rotate password if it was ever shared in chat
