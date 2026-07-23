# AGENTS.md

LK Studio — a Next.js 15 / React 19 (TypeScript) multi-shop tailor platform. The web app and its API routes are one service (Next.js). Prisma talks to PostgreSQL. Supabase (SMS OTP), Cloudflare R2 / S3 (file storage), and Razorpay (billing) are all optional with local fallbacks. Capacitor/Android scripts (`cap:*`, `build:apk*`, `mobile:*`) are Windows-only and irrelevant on Linux.

## Cursor Cloud specific instructions

### Database (must be started each session)
- PostgreSQL is installed natively in the VM (Docker is **not** available here, so `docker compose up` from `docker-compose.yml` will not work — the native install replaces it with identical credentials).
- It is **not** auto-started on boot. Start it before running the app or any `prisma`/`db:*` command:
  - `sudo pg_ctlcluster 16 main start`  (check with `pg_lsclusters`)
- Role/DB match the repo's `docker-compose.yml`: user `lkstudio`, password `lkstudio`, db `lkstudio`.
- Connection string: `postgresql://lkstudio:lkstudio@localhost:5432/lkstudio?schema=public`.

### Env files (gitignored, already created)
- `.env` and `.env.local` exist locally and hold `DATABASE_URL` + `JWT_SECRET`. Prisma CLI reads `.env`; Next.js reads `.env.local` (and `.env`). If either is missing, recreate it with the connection string above plus a `JWT_SECRET`, or `prisma`/Next will fail with "Environment variable not found: DATABASE_URL".
- Local dev sets `NEXT_PUBLIC_SHOW_DEMO_LOGIN`, `NEXT_PUBLIC_SHOW_DEMO_OTP`, `LOGIN_OTP_DEMO`, `ALLOW_DEMO_FEATURES` so login works without an SMS/OTP provider.

### Schema + seed
- Apply schema: `npm run db:push` (`prisma db push`). Seed demo data: `npm run db:seed` (admin via `npm run db:seed-admin`).
- If the DB ever comes up empty, re-run both. These need Postgres running and `DATABASE_URL` set.

### Run / build / lint
- Dev server: `npm run dev` → http://localhost:3000 (see `package.json` scripts for other variants). Production build is `npm run build`.
- `npm run lint` (`next lint`) is **not usable non-interactively**: the repo ships `eslint`/`eslint-config-next` but has **no ESLint config file**, so the command drops into an interactive setup prompt. Treat lint as unconfigured rather than failing.

### Auth / demo accounts
- Login is **mobile + password + role** (no email). The `/api/auth/login` payload uses field name `phone` (not `mobile`) and requires a `deviceId` of length ≥ 16.
- Demo accounts (bypass OTP): Shop `9876543210`, Shop2 `9988776655`, Customer `9123456789` — all password `demo123`. Admin `9000000001` / `lkstudio123`.
