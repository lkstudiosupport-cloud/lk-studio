"use client";

/** Client-side MSG91 OTP widget configuration (public env vars only). */

export function isMsg91WidgetClientConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_MSG91_WIDGET_ID?.trim() &&
      process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN?.trim()
  );
}

export function msg91WidgetId(): string {
  return process.env.NEXT_PUBLIC_MSG91_WIDGET_ID?.trim() ?? "";
}

export function msg91WidgetToken(): string {
  return process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN?.trim() ?? "";
}

/** E.164 digits → MSG91 identifier (country code, no +). */
export function toMsg91Identifier(e164Digits: string): string {
  const digits = e164Digits.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function extractMsg91AccessToken(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const candidates = [o["access-token"], o.accessToken, o.token, o.message];
  for (const c of candidates) {
    if (typeof c === "string" && c.length > 20) return c;
  }
  return null;
}

type Msg91Window = Window & {
  initSendOTP?: (config: Record<string, unknown>) => void;
  sendOtp?: (
    identifier: string,
    onSuccess?: (data: unknown) => void,
    onFailure?: (error: unknown) => void
  ) => void;
  verifyOtp?: (
    otp: string,
    onSuccess?: (data: unknown) => void,
    onFailure?: (error: unknown) => void
  ) => void;
  retryOtp?: (
    channel: number,
    onSuccess?: (data: unknown) => void,
    onFailure?: (error: unknown) => void
  ) => void;
};

const SCRIPT_SRC = "https://verify.msg91.com/otp-provider.js";
let loadPromise: Promise<void> | null = null;

function msg91Window(): Msg91Window {
  return window as Msg91Window;
}

/** Load MSG91 OTP widget script and initialize with exposeMethods for custom UI. */
export function ensureMsg91WidgetLoaded(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("MSG91 widget requires browser"));
  }
  if (!isMsg91WidgetClientConfigured()) {
    return Promise.reject(new Error("MSG91 widget is not configured"));
  }

  if (msg91Window().sendOtp) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const configuration = {
      widgetId: msg91WidgetId(),
      tokenAuth: msg91WidgetToken(),
      exposeMethods: true,
      success: () => {},
      failure: () => {},
    };

    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      msg91Window().initSendOTP?.(configuration);
      if (msg91Window().sendOtp) {
        resolve();
        return;
      }
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      msg91Window().initSendOTP?.(configuration);
      if (msg91Window().sendOtp) resolve();
      else reject(new Error("MSG91 widget failed to initialize"));
    };
    script.onerror = () => reject(new Error("Failed to load MSG91 OTP script"));
    document.body.appendChild(script);
  });

  return loadPromise;
}

export function msg91WidgetSendOtp(identifier: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ensureMsg91WidgetLoaded()
      .then(() => {
        const send = msg91Window().sendOtp;
        if (!send) {
          reject(new Error("MSG91 sendOtp unavailable"));
          return;
        }
        send(
          identifier,
          () => resolve(),
          (err) => reject(err instanceof Error ? err : new Error(String(err ?? "Send OTP failed")))
        );
      })
      .catch(reject);
  });
}

export function msg91WidgetVerifyOtp(otp: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ensureMsg91WidgetLoaded()
      .then(() => {
        const verify = msg91Window().verifyOtp;
        if (!verify) {
          reject(new Error("MSG91 verifyOtp unavailable"));
          return;
        }
        verify(
          otp.trim(),
          (data) => {
            const token = extractMsg91AccessToken(data);
            if (token) resolve(token);
            else reject(new Error("MSG91 did not return access token"));
          },
          (err) => reject(err instanceof Error ? err : new Error(String(err ?? "Invalid OTP")))
        );
      })
      .catch(reject);
  });
}
