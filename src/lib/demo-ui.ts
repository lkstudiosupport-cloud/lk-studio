/** Client-safe demo UI gates (NEXT_PUBLIC_* inlined at build time). */

export function showDemoLoginUI(): boolean {
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXT_PUBLIC_SHOW_DEMO_LOGIN === "true";
  }
  return process.env.NEXT_PUBLIC_SHOW_DEMO_LOGIN !== "false";
}

export function showDemoOtpOnScreenUI(): boolean {
  if (process.env.NODE_ENV === "production") {
    return (
      process.env.NEXT_PUBLIC_SHOW_DEMO_LOGIN === "true" &&
      process.env.NEXT_PUBLIC_SHOW_DEMO_OTP === "true"
    );
  }
  return process.env.NEXT_PUBLIC_SHOW_DEMO_OTP !== "false";
}
