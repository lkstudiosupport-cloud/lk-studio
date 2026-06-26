import type { UserRole } from "@prisma/client";
import { generateOtpCode } from "@/lib/auth-user";
import {
  clearLoginOtp,
  consumeLoginOtp,
  getMsg91WidgetReqId,
  storeLoginOtp,
  storeMsg91WidgetReqId,
} from "@/lib/login-session";
import {
  isMsg91Configured,
  msg91OtpConfigError,
  sendMsg91Otp,
} from "@/lib/msg91-sms";
import {
  isMsg91WidgetServerConfigured,
  msg91PhoneMatches,
  verifyMsg91WidgetAccessToken,
} from "@/lib/msg91-widget";
import {
  isMsg91WidgetRuntimeConfigured,
  isMsg91WidgetServerSendConfigured,
  otpConfigStatus,
} from "@/lib/msg91-config";
import {
  sendMsg91WidgetOtpMobile,
  verifyMsg91WidgetOtpMobile,
} from "@/lib/msg91-widget-server";
import { allowDemoOtpOnScreen, isProduction } from "@/lib/production";
import { isDemoPhoneE164 } from "@/lib/demo-accounts";

export {
  isMsg91Configured,
  msg91OtpConfigError,
  isMsg91WidgetServerConfigured,
  otpConfigStatus,
};

export type OtpProvider = "msg91" | "msg91-widget" | "local";

export type LoginOtpSendResult = {
  sent: boolean;
  smsDelivered: boolean;
  provider: OtpProvider;
  demoMode: boolean;
  expiresAt: Date;
  demoCode?: string;
};

function canShowOtpCodeOnScreen(e164Digits: string): boolean {
  return allowDemoOtpOnScreen() || isDemoPhoneE164(e164Digits);
}

async function sendLocalLoginOtp(
  e164Digits: string,
  role: UserRole
): Promise<LoginOtpSendResult> {
  const code = generateOtpCode();
  const expiresAt = await storeLoginOtp(e164Digits, role, code);
  console.log(`[LK Studio OTP local] +${e164Digits}: ${code}`);

  const showCode = canShowOtpCodeOnScreen(e164Digits);

  if (isProduction() && !showCode) {
    const status = otpConfigStatus();
    if (status.authKey && !status.widgetSend && !status.flowApi) {
      throw new Error(
        "Set MSG91_WIDGET_ID and MSG91_WIDGET_TOKEN on Render (server runtime env), then redeploy"
      );
    }
    throw new Error(
      msg91OtpConfigError() ??
        (status.widgetSend && !isMsg91WidgetRuntimeConfigured()
          ? "Set MSG91_WIDGET_ID and MSG91_WIDGET_TOKEN on Render (not only NEXT_PUBLIC_*), then redeploy"
          : "MSG91 OTP is not configured")
    );
  }

  return {
    sent: false,
    smsDelivered: false,
    provider: "local",
    demoMode: showCode,
    expiresAt,
    ...(showCode ? { demoCode: code } : {}),
  };
}

async function sendMsg91LoginOtp(
  e164Digits: string,
  role: UserRole
): Promise<LoginOtpSendResult> {
  const code = generateOtpCode();
  const expiresAt = await storeLoginOtp(e164Digits, role, code);
  const delivered = await sendMsg91Otp(e164Digits, code);

  if (delivered) {
    return {
      sent: true,
      smsDelivered: true,
      provider: "msg91",
      demoMode: false,
      expiresAt,
    };
  }

  console.error("MSG91 OTP send failed for", e164Digits);
  const showCode = canShowOtpCodeOnScreen(e164Digits);
  if (showCode) {
    return {
      sent: false,
      smsDelivered: false,
      provider: "local",
      demoMode: true,
      expiresAt,
      demoCode: code,
    };
  }

  throw new Error("MSG91 SMS delivery failed");
}

/** Send OTP via MSG91 widget server API (no browser script — works in Capacitor). */
async function sendMsg91WidgetServerLoginOtp(
  e164Digits: string,
  role: UserRole
): Promise<LoginOtpSendResult> {
  const reqId = await sendMsg91WidgetOtpMobile(e164Digits);
  if (!reqId) {
    if (isProduction() && !isMsg91WidgetRuntimeConfigured()) {
      throw new Error(
        "MSG91 widget credentials missing at runtime — set MSG91_WIDGET_ID and MSG91_WIDGET_TOKEN on Render, then redeploy"
      );
    }
    throw new Error("MSG91 widget SMS delivery failed — check widget token, SMS credits, and DLT template in MSG91 dashboard");
  }

  const expiresAt = await storeMsg91WidgetReqId(e164Digits, role, reqId);
  return {
    sent: true,
    smsDelivered: true,
    provider: "msg91-widget",
    demoMode: false,
    expiresAt,
  };
}

/** Send OTP via MSG91 Flow API or widget server API. */
export async function sendLoginOtp(
  e164Digits: string,
  role: UserRole
): Promise<LoginOtpSendResult> {
  if (isMsg91Configured()) {
    return sendMsg91LoginOtp(e164Digits, role);
  }

  if (isMsg91WidgetServerSendConfigured()) {
    return sendMsg91WidgetServerLoginOtp(e164Digits, role);
  }

  return sendLocalLoginOtp(e164Digits, role);
}

/** Verify 6-digit OTP (Flow/local code or MSG91 widget server reqId). */
export async function verifyLoginOtp(
  e164Digits: string,
  role: UserRole,
  code: string
): Promise<boolean> {
  const reqId = await getMsg91WidgetReqId(e164Digits, role);
  if (reqId) {
    const accessToken = await verifyMsg91WidgetOtpMobile(reqId, code);
    if (!accessToken) return false;
    const ok = await verifyMsg91WidgetLogin(e164Digits, accessToken);
    if (ok) await clearLoginOtp(e164Digits, role);
    return ok;
  }

  return consumeLoginOtp(e164Digits, role, code.trim());
}

/** Verify MSG91 widget JWT on server; returns true if token matches submitted phone. */
export async function verifyMsg91WidgetLogin(
  e164Digits: string,
  accessToken: string
): Promise<boolean> {
  const identity = await verifyMsg91WidgetAccessToken(accessToken);
  if (!identity?.mobile) return false;
  return msg91PhoneMatches(identity.mobile, e164Digits);
}
