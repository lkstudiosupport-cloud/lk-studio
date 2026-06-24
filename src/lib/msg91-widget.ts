import { normalizePhone } from "@/lib/phone";

export type Msg91VerifiedIdentity = {
  mobile?: string;
  email?: string;
};

type VerifyAccessTokenResponse = {
  type?: string;
  message?: string;
  data?: Record<string, unknown>;
  mobile?: string;
  identifier?: string;
};

function authKey(): string | null {
  return process.env.MSG91_AUTH_KEY?.trim() || null;
}

export function isMsg91WidgetServerConfigured(): boolean {
  return Boolean(authKey());
}

/** Verify JWT from MSG91 OTP widget (server-side only — never call from browser). */
export async function verifyMsg91WidgetAccessToken(
  accessToken: string
): Promise<Msg91VerifiedIdentity | null> {
  const key = authKey();
  const token = accessToken.trim();
  if (!key || !token) return null;

  try {
    const res = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        authkey: key,
        "access-token": token,
      }),
    });

    const json = (await res.json().catch(() => ({}))) as VerifyAccessTokenResponse;

    if (!res.ok) {
      console.error("MSG91 verifyAccessToken HTTP error:", res.status, json);
      return null;
    }

    if (json.type && json.type !== "success") {
      console.error("MSG91 verifyAccessToken failed:", json.message ?? json);
      return null;
    }

    const payload = json.data ?? json;
    const mobileRaw =
      (typeof payload.mobile === "string" && payload.mobile) ||
      (typeof payload.phone === "string" && payload.phone) ||
      (typeof payload.identifier === "string" && payload.identifier) ||
      (typeof json.mobile === "string" && json.mobile) ||
      (typeof json.identifier === "string" && json.identifier) ||
      undefined;

    const emailRaw =
      (typeof payload.email === "string" && payload.email) ||
      (typeof json.email === "string" && json.email) ||
      undefined;

    if (!mobileRaw && !emailRaw) {
      console.error("MSG91 verifyAccessToken: no identity in response", json);
      return null;
    }

    return {
      mobile: mobileRaw ? normalizePhone(mobileRaw) : undefined,
      email: emailRaw,
    };
  } catch (err) {
    console.error("MSG91 verifyAccessToken request error:", err);
    return null;
  }
}

/** Match verified MSG91 mobile to the phone the user submitted. */
export function msg91PhoneMatches(verifiedMobile: string, submittedE164: string): boolean {
  const a = verifiedMobile.replace(/\D/g, "");
  const b = submittedE164.replace(/\D/g, "");
  if (!a || !b) return false;
  if (a === b) return true;
  return a.slice(-10) === b.slice(-10);
}
