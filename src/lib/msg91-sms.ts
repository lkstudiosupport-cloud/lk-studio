/** MSG91 SMS OTP — production India (+91) with DLT-approved templates. */

import { msg91AuthKey } from "@/lib/msg91-config";

function authKey(): string | null {
  return msg91AuthKey();
}

function templateId(): string | null {
  const id = process.env.MSG91_TEMPLATE_ID?.trim();
  return id || null;
}

/** Template variable name in MSG91 flow (matches ##OTP## or ##var## in template). */
function otpVariableName(): string {
  return process.env.MSG91_OTP_VARIABLE?.trim() || "OTP";
}

export function isMsg91Configured(): boolean {
  return Boolean(authKey() && templateId());
}

export function msg91OtpConfigError(): string | null {
  if (isMsg91Configured()) return null;
  if (!authKey()) return "MSG91_AUTH_KEY is not set";
  return "MSG91_TEMPLATE_ID is not set";
}

/** E.164 digits → MSG91 format e.g. 919876543210 */
export function formatMsg91Mobile(e164Digits: string): string {
  const digits = e164Digits.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

type Msg91FlowResponse = {
  type?: string;
  message?: string;
  request_id?: string;
};

function msg91Success(data: Msg91FlowResponse): boolean {
  if (data.type === "success") return true;
  const msg = data.message?.toLowerCase() ?? "";
  return msg.includes("success") || msg.includes("verified");
}

/** Send OTP via MSG91 v5 API — MSG91 generates the code (verify with verifyMsg91ManagedOtp). */
export async function sendMsg91ManagedOtp(
  e164Digits: string,
  templateIdOverride: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = authKey();
  const tpl = templateIdOverride.trim();
  if (!key || !tpl) return { ok: false, error: "MSG91 authkey or template not configured" };

  const mobile = formatMsg91Mobile(e164Digits);

  try {
    const res = await fetch("https://control.msg91.com/api/v5/otp", {
      method: "POST",
      headers: {
        authkey: key,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        template_id: tpl,
        mobile,
        otp_length: 6,
        otp_expiry: 10,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as Msg91FlowResponse;

    if (!res.ok) {
      console.error("MSG91 managed OTP HTTP error:", res.status, data);
      return {
        ok: false,
        error: data.message ?? `MSG91 HTTP ${res.status}`,
      };
    }

    if (msg91Success(data)) return { ok: true };

    console.error("MSG91 managed OTP send failed:", data.message ?? data);
    return { ok: false, error: data.message ?? "MSG91 OTP send failed" };
  } catch (err) {
    console.error("MSG91 managed OTP request error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "MSG91 OTP request error",
    };
  }
}

/** Verify OTP via MSG91 v5 API (pairs with sendMsg91ManagedOtp). */
export async function verifyMsg91ManagedOtp(e164Digits: string, code: string): Promise<boolean> {
  const key = authKey();
  if (!key) return false;

  const mobile = formatMsg91Mobile(e164Digits);
  const otp = code.trim();

  if (await verifyMsg91ManagedOtpV5(key, mobile, otp)) return true;
  return verifyMsg91LegacyOtp(key, mobile, otp);
}

async function verifyMsg91ManagedOtpV5(
  key: string,
  mobile: string,
  otp: string
): Promise<boolean> {
  try {
    const res = await fetch("https://control.msg91.com/api/v5/otp/verify", {
      method: "POST",
      headers: {
        authkey: key,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ mobile, otp }),
    });

    const data = (await res.json().catch(() => ({}))) as Msg91FlowResponse;
    if (!res.ok) return false;
    return msg91Success(data);
  } catch {
    return false;
  }
}

/** Legacy SendOTP API — uses MSG91 OTP templates (no template_id in request). */
export async function sendMsg91LegacyOtp(
  e164Digits: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = authKey();
  if (!key) return { ok: false, error: "MSG91_AUTH_KEY is not set" };

  const mobile = formatMsg91Mobile(e164Digits);
  const params = new URLSearchParams({
    authkey: key,
    mobile,
    otp_length: "6",
    otp_expiry: "10",
  });

  try {
    const res = await fetch(`https://control.msg91.com/api/sendotp.php?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const text = await res.text();
    let data: Msg91FlowResponse = {};
    try {
      data = JSON.parse(text) as Msg91FlowResponse;
    } catch {
      return { ok: false, error: text.slice(0, 120) || "Invalid MSG91 response" };
    }

    if (!res.ok) {
      return { ok: false, error: data.message ?? `MSG91 HTTP ${res.status}` };
    }

    if (msg91Success(data)) return { ok: true };

    return { ok: false, error: data.message ?? "MSG91 legacy OTP send failed" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "MSG91 legacy OTP request error",
    };
  }
}

async function verifyMsg91LegacyOtp(key: string, mobile: string, otp: string): Promise<boolean> {
  const params = new URLSearchParams({ authkey: key, mobile, otp });
  try {
    const res = await fetch(
      `https://control.msg91.com/api/verifyRequestOTP.php?${params.toString()}`,
      { method: "GET", headers: { Accept: "application/json" } }
    );
    const data = (await res.json().catch(() => ({}))) as Msg91FlowResponse;
    if (!res.ok) return false;
    return msg91Success(data);
  } catch {
    return false;
  }
}

/** Send a 6-digit OTP via MSG91 v5 OTP API (DLT template + authkey). */
export async function sendMsg91OtpV5(
  e164Digits: string,
  code: string,
  templateIdOverride?: string
): Promise<boolean> {
  const key = authKey();
  const tpl = templateIdOverride?.trim() || templateId();
  if (!key || !tpl) return false;

  const mobile = formatMsg91Mobile(e164Digits);

  try {
    const res = await fetch("https://control.msg91.com/api/v5/otp", {
      method: "POST",
      headers: {
        authkey: key,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        template_id: tpl,
        mobile,
        otp: code,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as Msg91FlowResponse;

    if (!res.ok) {
      console.error("MSG91 v5 OTP HTTP error:", res.status, data);
      return false;
    }

    if (data.type === "success") return true;

    console.error("MSG91 v5 OTP send failed:", data.message ?? data);
    return false;
  } catch (err) {
    console.error("MSG91 v5 OTP request error:", err);
    return false;
  }
}

/** Send a 6-digit OTP via MSG91 Flow API (DLT template). */
export async function sendMsg91Otp(e164Digits: string, code: string): Promise<boolean> {
  const key = authKey();
  const tpl = templateId();
  if (!key || !tpl) return false;

  const mobile = formatMsg91Mobile(e164Digits);
  const varName = otpVariableName();

  try {
    const res = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        authkey: key,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        template_id: tpl,
        short_url: "0",
        recipients: [{ mobiles: mobile, [varName]: code }],
      }),
    });

    const data = (await res.json().catch(() => ({}))) as Msg91FlowResponse;

    if (!res.ok) {
      console.error("MSG91 OTP HTTP error:", res.status, data);
      return false;
    }

    if (data.type === "success") return true;

    console.error("MSG91 OTP send failed:", data.message ?? data);
    return false;
  } catch (err) {
    console.error("MSG91 OTP request error:", err);
    return false;
  }
}
