# Google Play Store checklist — LK Studio

Use this before submitting the Android app (Capacitor WebView shell).

## App binary

- [ ] Build a **signed release AAB** (not debug APK): `npm run build:aab:release`
- [ ] Keystore created and backed up securely (see `keystore.properties.example`)
- [ ] `CAPACITOR_SERVER_URL` points to production HTTPS (e.g. `https://lk-studio-1.onrender.com`)
- [ ] Test login, photo upload, orders, and account deletion on a release build

## Play Console — Store listing

Assets and copy live in [`play-store/`](./play-store/). See [`play-store/ASSETS.md`](./play-store/ASSETS.md).

- [ ] App name: **LK Studio**
- [ ] Short description (80 chars max): `play-store/short-description-en.txt`
- [ ] Full description: `play-store/full-description-en.txt`
- [ ] App icon 512×512 PNG: `play-store/icon-512.png`
- [ ] Feature graphic 1024×500
- [ ] Phone screenshots (min 1080×1920, 2–8 images)
- [ ] Category: Business (or Lifestyle)
- [ ] Contact email: **lkstudio.support@gmail.com**

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
- [ ] WhatsApp OTP or trusted-device login tested on real devices
- [ ] Razorpay keys if subscriptions are live

## Content rating & declarations

- [ ] Complete Play content rating questionnaire
- [ ] Declare ads: none (unless added later)
- [ ] Declare in-app purchases if Razorpay subscriptions are offered

## After approval

- [ ] Monitor crash reports in Play Console
- [ ] Keep privacy policy URL reachable (required for updates)
