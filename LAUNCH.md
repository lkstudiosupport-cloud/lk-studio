# Launch LK Studio — server + Google Play

## 1. Server (Render) — already deployed

Production: **https://lk-studio-1.onrender.com**

After each code change:

```powershell
git push origin main
```

Render auto-deploys from `main`. Optional schema update after `prisma/schema.prisma` changes:

```powershell
npm run db:deploy
```

Verify:

```powershell
npm run launch:check
```

Or open: https://lk-studio-1.onrender.com/api/health → `{"ok":true,...}`

### Render environment (production)

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `SKIP_DEMO_SEED` | `true` |
| `DATABASE_URL` | Supabase pooler or Render Postgres |
| `JWT_SECRET` | Long random string |
| `S3_*` / R2 | Configured for photo uploads |
| `NEXT_PUBLIC_SITE_URL` | `https://lk-studio-1.onrender.com` |

Do **not** set `LOGIN_OTP_DEMO`, `NEXT_PUBLIC_SHOW_DEMO_LOGIN`, or `ALLOW_DEMO_FEATURES` in production.

Full details: [RENDER-DEPLOY.md](./RENDER-DEPLOY.md)

---

## 2. Play Store app (one-time setup)

### A. Point the APK/AAB at production

```powershell
copy .env.capacitor.example .env.capacitor
notepad .env.capacitor
```

Set:

```env
CAPACITOR_SERVER_URL=https://lk-studio-1.onrender.com
```

### B. Android project (first time)

```powershell
npm install
npx cap add android
```

### C. Release signing (first time only)

```powershell
keytool -genkeypair -v -storetype PKCS12 -keystore lk-studio-release.keystore -alias lkstudio -keyalg RSA -keysize 2048 -validity 10000
copy keystore.properties.example android\keystore.properties
notepad android\keystore.properties
```

**Back up** `lk-studio-release.keystore` and passwords securely.

### D. Build signed AAB for Play Console

```powershell
npm run launch:check
npm run build:aab:release
```

Upload **`LK-Studio-release.aab`** to [Google Play Console](https://play.google.com/console).

For testing before Play approval:

```powershell
npm run build:apk:share
```

Install **`LK-Studio-debug.apk`** on a phone (uses same production server).

---

## 3. Play Console listing

Use assets in [`play-store/`](./play-store/) and checklist in [PLAY-STORE-CHECKLIST.md](./PLAY-STORE-CHECKLIST.md).

| Item | Value |
|------|--------|
| App name | LK Studio |
| Package | `com.lkstudio.app` |
| Privacy policy | https://lk-studio-1.onrender.com/privacy |
| Terms | https://lk-studio-1.onrender.com/terms |
| Contact | lkstudio.support@gmail.com |

---

## 4. Test before submitting

On a **release or share APK** connected to production:

- [ ] Customer register / login (OTP or password)
- [ ] Shop login, new order, share order
- [ ] Photo upload (design, order, price quote)
- [ ] Shop → Orders → **Price quotes** → send quote
- [ ] Customer sees quote under **Price quotes**
- [ ] Bill share / print
- [ ] Profile → **Delete my account**

---

## 5. Version updates (after first Play release)

1. Bump `versionCode` and `versionName` in `scripts/patch-android-release.ps1` (or edit `android/app/build.gradle`).
2. `git push origin main` (server updates automatically).
3. `npm run build:aab:release` and upload new AAB to Play Console.
