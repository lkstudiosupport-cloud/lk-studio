import {
  isMsg91WidgetServerSendConfigured,
  msg91WidgetIdServer,
  msg91WidgetTokenServer,
} from "@/lib/msg91-config";
import { formatMsg91Mobile } from "@/lib/msg91-sms";

type SendResult = { ok: true; reqId: string } | { ok: false; error: string };

type Msg91WidgetResponse = {
  type?: string;
  message?: string;
  reqId?: string;
  request_id?: string;
  requestId?: string;
  ["access-token"]?: string;
  accessToken?: string;
  data?: Record<string, unknown>;
};

function parseJson(text: string): Msg91WidgetResponse {
  try {
    return JSON.parse(text) as Msg91WidgetResponse;
  } catch {
    return {};
  }
}

function looksLikeReqId(value: string): boolean {
  const v = value.trim();
  return v.length >= 8 && !/\s/.test(v);
}

function reqIdFrom(data: Msg91WidgetResponse): string | null {
  const nested = data.data;
  const candidates: unknown[] = [
    data.reqId,
    data.request_id,
    data.requestId,
    nested?.reqId,
    nested?.request_id,
    nested?.requestId,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && looksLikeReqId(c)) return c.trim();
  }

  // Legacy widget API: reqId is returned in `message` when type is success.
  if (data.type === "success" && typeof data.message === "string" && looksLikeReqId(data.message)) {
    return data.message.trim();
  }

  return null;
}

function accessTokenFrom(data: Msg91WidgetResponse): string | null {
  const nested = data.data;
  const candidates: unknown[] = [
    data["access-token"],
    data.accessToken,
    nested?.["access-token"],
    nested?.accessToken,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.length > 20) return c;
  }

  return null;
}

function msg91Error(data: Msg91WidgetResponse, text: string, httpStatus: number): string {
  if (typeof data.message === "string" && data.message.trim()) return data.message.trim();
  if (httpStatus >= 400) return `MSG91 HTTP ${httpStatus}`;
  return text.slice(0, 200) || "MSG91 widget request failed";
}

/** Send OTP via MSG91 widget server API (works in Capacitor WebView — no browser script). */
export async function sendMsg91WidgetOtpMobile(e164Digits: string): Promise<string | null> {
  const result = await sendMsg91WidgetOtpMobileDetailed(e164Digits);
  if (result.ok) return result.reqId;
  console.error("MSG91 widget sendOtpMobile:", result.error);
  return null;
}

export async function sendMsg91WidgetOtpMobileDetailed(e164Digits: string): Promise<SendResult> {
  const id = msg91WidgetIdServer();
  const token = msg91WidgetTokenServer();
  if (!id || !token) return { ok: false, error: "Widget ID or token not configured" };

  const identifier = formatMsg91Mobile(e164Digits);

  try {
    const res = await fetch("https://control.msg91.com/api/v5/widget/sendOtpMobile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        widgetId: id,
        tokenAuth: token,
        identifier,
      }),
    });

    const text = await res.text();
    const data = parseJson(text);

    if (data.type && data.type !== "success") {
      return { ok: false, error: msg91Error(data, text, res.status) };
    }

    const reqId = reqIdFrom(data);
    if (!reqId) {
      return {
        ok: false,
        error: msg91Error(data, text, res.status) || "Missing reqId in MSG91 response",
      };
    }

    return { ok: true, reqId };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "MSG91 widget request error",
    };
  }
}

/** Verify OTP via MSG91 widget server API; returns JWT access token on success. */
export async function verifyMsg91WidgetOtpMobile(
  reqId: string,
  otp: string
): Promise<string | null> {
  const id = msg91WidgetIdServer();
  const token = msg91WidgetTokenServer();
  if (!id || !token) return null;

  try {
    const res = await fetch("https://control.msg91.com/api/v5/widget/verifyOtp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        widgetId: id,
        tokenAuth: token,
        reqId,
        otp: otp.trim(),
      }),
    });

    const text = await res.text();
    const data = parseJson(text);

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

export { isMsg91WidgetServerSendConfigured } from "@/lib/msg91-config";
