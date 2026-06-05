import type { CapacitorConfig } from "@capacitor/cli";

/**
 * APK loads your Next.js server in a WebView.
 *
 * Local test (phone + PC same Wi‑Fi):
 *   1. Run: npm run dev -- -H 0.0.0.0
 *   2. Set CAPACITOR_SERVER_URL=http://YOUR_PC_IP:3000
 *   3. npm run cap:sync && npm run build:apk
 *
 * Production: deploy Next.js, then set CAPACITOR_SERVER_URL=https://your-domain.com
 */
const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.lkstudio.app",
  appName: "LK Studio",
  webDir: "public/mobile-shell",
  android: {
    allowMixedContent: true,
  },
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: serverUrl.startsWith("http://"),
          androidScheme: serverUrl.startsWith("https") ? "https" : "http",
        },
      }
    : {}),
};

export default config;
