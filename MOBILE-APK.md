# Mobile APK (Android)

The app is a **WebView shell** that opens your LK Studio **Next.js server**.  
The phone must reach that server (same Wi‑Fi for local test, or a public URL for production).

## Step 1 — Install dependencies

```powershell
cd C:\Users\saima\Projects\lk-studio
npm.cmd install
```

## Step 2 — Set server URL for the APK

Copy the example file and edit with **your PC’s IP** (same Wi‑Fi as phone):

```powershell
copy .env.capacitor.example .env.capacitor
notepad .env.capacitor
```

Example:

```env
CAPACITOR_SERVER_URL=http://192.168.1.10:3000
```

Find your IP: `ipconfig` → **IPv4 Address**.

For **Android emulator** only, use:

```env
CAPACITOR_SERVER_URL=http://10.0.2.2:3000
```

## Step 3 — Start the server (keep running)

```powershell
npm.cmd run dev -- -H 0.0.0.0
```

Open `http://YOUR_IP:3000` in the phone browser first to confirm it loads.

## Step 4 — Build APK

First time only:

```powershell
npx.cmd cap add android
```

Then build:

```powershell
npm.cmd run build:apk
```

APK file:

**`C:\Users\saima\Projects\lk-studio\LK-Studio-debug.apk`**

Copy this file to your phone and install (enable **Install unknown apps** for Files/Chrome).

## Step 5 — Open Android Studio (optional)

```powershell
npm.cmd run cap:open
```

Run on a device/emulator from Android Studio.

---

## Production APK (Play Store later)

1. Deploy Next.js + database to a host (Vercel + Postgres, VPS, etc.).
2. Set `CAPACITOR_SERVER_URL=https://your-domain.com` in `.env.capacitor`.
3. Rebuild APK.
4. For release signing, use Android Studio → **Build → Generate Signed Bundle/APK**.

---

## Requirements

- Node.js + npm
- **Android Studio** (includes Android SDK) — [https://developer.android.com/studio](https://developer.android.com/studio)
- JDK 17 (you already have Java)

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| Blank white screen in APK | Server not running, wrong IP in `.env.capacitor`, or phone not on same Wi‑Fi |
| `gradlew` failed | Open Android Studio once, install SDK Platform 34 |
| Camera upload | Allow camera/storage when app asks |
