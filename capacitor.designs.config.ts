import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Separate Play Store app: LK Designs (shop + customer designs only).
 * Same Render backend as LK Studio / Tailoring Partner.
 *
 * Production:
 *   CAPACITOR_SERVER_URL=https://lk-studio-1.onrender.com
 *   npm run cap:sync:designs
 *   npm run build:apk:designs
 */
const baseUrl = (process.env.CAPACITOR_SERVER_URL ?? "https://lk-studio-1.onrender.com").replace(
  /\/$/,
  ""
);
const serverUrl = `${baseUrl}/designs`;

const config: CapacitorConfig = {
  appId: "com.lkstudio.designs",
  appName: "LK Designs",
  webDir: "public/mobile-shell",
  android: {
    path: "android-designs",
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: "#1b3022",
      androidSplashResourceName: "splash",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
    androidScheme: serverUrl.startsWith("https") ? "https" : "http",
  },
};

export default config;
