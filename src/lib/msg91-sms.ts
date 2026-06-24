/** MSG91 SMS OTP — production India (+91) with DLT-approved templates. */

function authKey(): string | null {
  const key = process.env.MSG91_AUTH_KEY?.trim();
  return key || null;
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
