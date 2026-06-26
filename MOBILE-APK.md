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

## Production / Play Store (signed AAB)

1. Deploy Next.js + database — see [RENDER-DEPLOY.md](./RENDER-DEPLOY.md).
2. Set production URL in `.env.capacitor`:
   ```env
   CAPACITOR_SERVER_URL=https://lk-studio-1.onrender.com
   ```
3. Create a release keystore (once, back up safely):
   ```powershell
   keytool -genkeypair -v -storetype PKCS12 -keystore lk-studio-release.keystore -alias lkstudio -keyalg RSA -keysize 2048 -validity 10000
   ```
4. Copy `keystore.properties.example` → `android\keystore.properties` and fill in passwords.
5. Add release signing to `android\app\build.gradle` (after `npx cap add android`):
   ```gradle
   def keystorePropertiesFile = rootProject.file("keystore.properties")
   def keystoreProperties = new Properties()
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
   }
   android {
       signingConfigs {
           release {
               if (keystorePropertiesFile.exists()) {
                   storeFile file(keystoreProperties['storeFile'])
                   storePassword keystoreProperties['storePassword']
                   keyAlias keystoreProperties['keyAlias']
                   keyPassword keystoreProperties['keyPassword']
               }
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled true
               shrinkResources true
               proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```
   Or skip manual edits — `npm run build:aab:release` runs `scripts/patch-android-release.ps1`, which applies signing, R8, and ProGuard rules from `scripts/android-proguard-rules.pro`.
6. Build signed AAB:
   ```powershell
   npm.cmd run build:aab:release
   ```
   Output: **`LK-Studio-release.aab`** — upload to Google Play Console.

For sideload testing with the **same release build** (R8, signing, version) as the AAB:

```powershell
npm.cmd run build:apk:release
```

Output: **`LK-Studio-release.apk`**

See [PLAY-STORE-CHECKLIST.md](./PLAY-STORE-CHECKLIST.md) and [play-store/ASSETS.md](./play-store/ASSETS.md) for listing assets and privacy URL.

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
