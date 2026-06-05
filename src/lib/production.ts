/** Production / Play Store guards — no demo shortcuts when live. */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function allowDemoFeatures(): boolean {
  if (!isProduction()) return true;
  return process.env.ALLOW_DEMO_FEATURES === "true";
}

export function allowDemoOtpOnScreen(): boolean {
  if (!isProduction()) return process.env.LOGIN_OTP_DEMO !== "false";
  return process.env.LOGIN_OTP_DEMO === "true" && process.env.ALLOW_DEMO_FEATURES === "true";
}
