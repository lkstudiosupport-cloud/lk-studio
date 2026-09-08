import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Play Store app 1: LK Studio (shop + customer) — main brand.
 * Tailoring Partner is a separate APK — see capacitor.work-partner.config.ts
 *
 * Local test (phone + PC same Wi‑Fi):
 *   1. Run: npm run dev -- -H 0.0.0.0
 *   2. Set CAPACITOR_SERVER_URL=http://YOUR_PC_IP:3000
 *   3. npm run cap:sync && npm run build:apk
 *
 * Production: CAPACITOR_SERVER_URL=https://lk-studio-1.onrender.com
 */
const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.lkstudio.app",
  appName: "LK Studio",
  webDir: "public/mobile-shell",
  android: {
    path: "android",
    allowMixedContent: true,
  },
  ...(serverUrl
    ? {
        server: {
          url: serverUrl.replace(/\/$/, ""),
          cleartext: serverUrl.startsWith("http://"),
          androidScheme: serverUrl.startsWith("https") ? "https" : "http",
        },
      }
    : {}),
};

export default config;
