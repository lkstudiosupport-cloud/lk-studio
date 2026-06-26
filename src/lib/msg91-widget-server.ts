import { formatMsg91Mobile } from "@/lib/msg91-sms";

function widgetHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const authKey = process.env.MSG91_AUTH_KEY?.trim();
  if (authKey) headers.authkey = authKey;
  return headers;
}

function widgetId(): string | null {
  return (
    process.env.MSG91_WIDGET_ID?.trim() ||
    process.env.NEXT_PUBLIC_MSG91_WIDGET_ID?.trim() ||
    null
  );
}

function widgetToken(): string | null {
  return (
    process.env.MSG91_WIDGET_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN?.trim() ||
    null
  );
}

export function isMsg91WidgetServerSendConfigured(): boolean {
  return Boolean(widgetId() && widgetToken());
}

type Msg91WidgetResponse = {
  type?: string;
  message?: string;
  reqId?: string;
  request_id?: string;
  ["access-token"]?: string;
  accessToken?: string;
};

function parseJson(text: string): Msg91WidgetResponse {
  try {
    return JSON.parse(text) as Msg91WidgetResponse;
  } catch {
    return {};
  }
}

function reqIdFrom(data: Msg91WidgetResponse): string | null {
  const id = data.reqId ?? data.request_id ?? data.message;
  return typeof id === "string" && id.length > 0 ? id : null;
}

function accessTokenFrom(data: Msg91WidgetResponse): string | null {
  const token = data["access-token"] ?? data.accessToken;
  return typeof token === "string" && token.length > 20 ? token : null;
}

/** Send OTP via MSG91 widget server API (works in Capacitor WebView — no browser script). */
export async function sendMsg91WidgetOtpMobile(e164Digits: string): Promise<string | null> {
  const id = widgetId();
  const token = widgetToken();
  if (!id || !token) return null;

  const identifier = formatMsg91Mobile(e164Digits);

  try {
    const res = await fetch("https://control.msg91.com/api/v5/widget/sendOtpMobile", {
      method: "POST",
      headers: widgetHeaders(),
      body: JSON.stringify({
        widgetId: id,
        tokenAuth: token,
        identifier,
      }),
    });

    const text = await res.text();
    const data = parseJson(text);

    if (!res.ok) {
      console.error("MSG91 widget sendOtpMobile HTTP error:", res.status, data, text);
      return null;
    }

    if (data.type && data.type !== "success") {
      console.error("MSG91 widget sendOtpMobile failed:", data, text);
      return null;
    }

    const reqId = reqIdFrom(data);
    if (!reqId) {
      console.error("MSG91 widget sendOtpMobile: missing reqId", data, text);
      return null;
    }

    return reqId;
  } catch (err) {
    console.error("MSG91 widget sendOtpMobile request error:", err);
    return null;
  }
}

/** Verify OTP via MSG91 widget server API; returns JWT access token on success. */
export async function verifyMsg91WidgetOtpMobile(
  reqId: string,
  otp: string
): Promise<string | null> {
  const id = widgetId();
  const token = widgetToken();
  if (!id || !token) return null;

  try {
    const res = await fetch("https://control.msg91.com/api/v5/widget/verifyOtp", {
      method: "POST",
      headers: widgetHeaders(),
      body: JSON.stringify({
        widgetId: id,
        tokenAuth: token,
        reqId,
        otp: otp.trim(),
      }),
    });

    const text = await res.text();
    const data = parseJson(text);

    if (!res.ok) {
      console.error("MSG91 widget verifyOtp HTTP error:", res.status, data, text);
      return null;
    }

    if (data.type && data.type !== "success") {
      console.error("MSG91 widget verifyOtp failed:", data, text);
      return null;
    }

    const accessToken = accessTokenFrom(data);
    if (!accessToken) {
      console.error("MSG91 widget verifyOtp: missing access token", data, text);
      return null;
    }

    return accessToken;
  } catch (err) {
    console.error("MSG91 widget verifyOtp request error:", err);
    return null;
  }
}
