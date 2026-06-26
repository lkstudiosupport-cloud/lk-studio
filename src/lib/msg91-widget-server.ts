import {
  isMsg91WidgetServerSendConfigured,
  msg91WidgetIdServer,
  msg91WidgetTokenServer,
} from "@/lib/msg91-config";
import { formatMsg91Mobile } from "@/lib/msg91-sms";

export { isMsg91WidgetServerSendConfigured };

type Msg91WidgetResponse = {
  type?: string;
  message?: string;
  reqId?: string;
  request_id?: string;
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
    nested && typeof nested === "object" ? nested.reqId : undefined,
    nested && typeof nested === "object" ? nested.request_id : undefined,
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
    nested && typeof nested === "object" ? nested["access-token"] : undefined,
    nested && typeof nested === "object" ? nested.accessToken : undefined,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.length > 20) return c;
  }

  return null;
}

function widgetFailed(data: Msg91WidgetResponse, text: string, context: string): null {
  console.error(`MSG91 widget ${context} failed:`, data, text);
  return null;
}

/** Send OTP via MSG91 widget server API (works in Capacitor WebView — no browser script). */
export async function sendMsg91WidgetOtpMobile(e164Digits: string): Promise<string | null> {
  const id = msg91WidgetIdServer();
  const token = msg91WidgetTokenServer();
  if (!id || !token) return null;

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
      return widgetFailed(data, text, "sendOtpMobile");
    }

    const reqId = reqIdFrom(data);
    if (!reqId) {
      if (!res.ok) {
        console.error("MSG91 widget sendOtpMobile HTTP error:", res.status, data, text);
      } else {
        console.error("MSG91 widget sendOtpMobile: missing reqId", data, text);
      }
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
      return widgetFailed(data, text, "verifyOtp");
    }

    const accessToken = accessTokenFrom(data);
    if (!accessToken) {
      if (!res.ok) {
        console.error("MSG91 widget verifyOtp HTTP error:", res.status, data, text);
      } else {
        console.error("MSG91 widget verifyOtp: missing access token", data, text);
      }
      return null;
    }

    return accessToken;
  } catch (err) {
    console.error("MSG91 widget verifyOtp request error:", err);
    return null;
  }
}
