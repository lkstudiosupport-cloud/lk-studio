import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Separate Play Store app: LK Tailoring Partner (workers).
 * LK Studio (shop + customer) is the other app — same Render backend.
 *
 * Production:
 *   CAPACITOR_SERVER_URL=https://lk-studio-1.onrender.com
 *   npm run cap:sync:work-partner
 *   npm run build:apk:work-partner
 */
const baseUrl = (process.env.CAPACITOR_SERVER_URL ?? "https://lk-studio-1.onrender.com").replace(
  /\/$/,
  ""
);
const serverUrl = `${baseUrl}/work-partner`;

const config: CapacitorConfig = {
  appId: "com.lkstudio.tailoringpartner",
  appName: "LK Tailoring Partner",
  webDir: "public/mobile-shell",
  android: {
    path: "android-work-partner",
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
