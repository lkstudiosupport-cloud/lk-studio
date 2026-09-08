# Google Play Store checklist — LK Studio + Tailoring Partner

Two **separate** Play Store apps, one shared Render backend (`https://lk-studio-1.onrender.com`).

| App | Package | Start URL | Build |
|-----|---------|-----------|--------|
| **LK Studio** (shop + customer) | `com.lkstudio.app` | site home | `npm run build:apk` / `build:aab:release` |
| **LK Tailoring Partner** (workers) | `com.lkstudio.tailoringpartner` | `/work-partner` | `npm run build:apk:work-partner` |

Shops post jobs in LK Studio; workers see/apply in Tailoring Partner — same DB, live updates. Do **not** put Tailoring Partner entry on the Studio home screen (Play Store listings stay separate).

## App binary — LK Studio

- [ ] Bump `versionCode` in `scripts/android-version.properties` (must be higher than any upload already in Play Console)
- [ ] Build a **signed release AAB** (not debug APK): `npm run build:aab:release`
- [ ] Release build uses **R8** (code shrinking + obfuscation) — applied automatically by `scripts/patch-android-release.ps1`
- [ ] Keystore created and backed up securely (see `keystore.properties.example`)
- [ ] `CAPACITOR_SERVER_URL` points to production HTTPS (e.g. `https://lk-studio-1.onrender.com`)
- [ ] Test login, photo upload, orders, and account deletion on a release build

## App binary — LK Tailoring Partner

- [ ] First time: `npm run cap:sync:work-partner` (creates `android-work-partner/`)
- [ ] Debug APK: `npm run build:apk:work-partner` → `LK-Tailoring-Partner-debug.apk`
- [ ] Separate Play Console listing / keystore recommended (different package id)
- [ ] Opens landing at `/work-partner` (Register + View jobs) on the same production URL
- [ ] Test: shop posts request in Studio → appears in Tailoring Partner → accept / WhatsApp / call

## Play Console — Store listing (Studio)

Assets and copy live in [`play-store/`](./play-store/). See [`play-store/ASSETS.md`](./play-store/ASSETS.md).

- [ ] App name: **LK Studio**
- [ ] Short description (80 chars max): `play-store/short-description-en.txt`
- [ ] Full description: `play-store/full-description-en.txt`
- [ ] App icon 512×512 PNG: `play-store/icon-512.png`
- [ ] Feature graphic 1024×500
- [ ] Phone screenshots (min 1080×1920, 2–8 images)
- [ ] Category: Business (or Lifestyle)
- [ ] Contact email: **lkstudio.support@gmail.com**

## Play Console — Store listing (Tailoring Partner)

- [ ] App name: **LK Tailoring Partner**
- [ ] Package: `com.lkstudio.tailoringpartner`
- [ ] Describe worker job feed / apply to shop requests (not shop billing)
- [ ] Same privacy URL: **https://lk-studio-1.onrender.com/privacy**

## Policy & compliance

- [ ] Privacy policy URL: **https://lk-studio-1.onrender.com/privacy**
- [ ] Terms URL (optional in Console): **https://lk-studio-1.onrender.com/terms**
- [ ] **Account deletion** available in app: Profile → **Delete my account**
- [ ] Data safety form: declare phone, photos, location, payments (see privacy policy)
- [ ] Target audience: not designed for children under 13

## Backend (Render / production)

- [ ] `NODE_ENV=production`
- [ ] `SKIP_DEMO_SEED=true`
- [ ] **Do not** set `LOGIN_OTP_DEMO=true` or `NEXT_PUBLIC_SHOW_DEMO_LOGIN=true` in production
- [ ] S3 (or R2) configured for photo uploads — see [RENDER-DEPLOY.md](./RENDER-DEPLOY.md)
- [ ] Firebase Phone OTP or trusted-device login tested on real devices
- [ ] Razorpay keys if subscriptions are live

## Content rating & declarations

- [ ] Complete Play content rating questionnaire
- [ ] Declare ads: none (unless added later)
- [ ] Declare in-app purchases if Razorpay subscriptions are offered

## After approval

- [ ] Monitor crash reports in Play Console
- [ ] Keep privacy policy URL reachable (required for updates)
