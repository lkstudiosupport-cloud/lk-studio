import type { UserRole } from "@prisma/client";
import { generateOtpCode } from "@/lib/auth-user";
import {
  clearLoginOtp,
  consumeLoginOtp,
  getLoginOtpKind,
  getMsg91WidgetReqId,
  storeLoginOtp,
  storeMsg91ManagedOtp,
  storeMsg91WidgetReqId,
} from "@/lib/login-session";
import {
  msg91AuthKey,
  isMsg91WidgetServerSendConfigured,
  otpConfigStatus,
} from "@/lib/msg91-config";
import {
  isMsg91Configured,
  msg91OtpConfigError,
  sendMsg91ManagedOtp,
  sendMsg91Otp,
  verifyMsg91ManagedOtp,
} from "@/lib/msg91-sms";
import { resolveMsg91TemplateId } from "@/lib/msg91-template";
import {
  isMsg91WidgetServerConfigured,
  msg91PhoneMatches,
  verifyMsg91WidgetAccessToken,
} from "@/lib/msg91-widget";
import {
  sendMsg91WidgetOtpMobileDetailed,
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

export type OtpProvider = "msg91" | "msg91-widget" | "msg91-managed" | "local";

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
    throw new Error(
      msg91OtpConfigError() ??
        "MSG91 OTP is not configured — set MSG91_AUTH_KEY and MSG91_TEMPLATE_ID on Render"
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

/** MSG91 authkey v5 API — MSG91 generates OTP (works for login + register, Capacitor-safe). */
async function sendAuthkeyManagedLoginOtp(
  e164Digits: string,
  role: UserRole,
  templateId: string
): Promise<LoginOtpSendResult> {
  const result = await sendMsg91ManagedOtp(e164Digits, templateId);
  if (!result.ok) {
    throw new Error(result.error);
  }

  const expiresAt = await storeMsg91ManagedOtp(e164Digits, role);
  return {
    sent: true,
    smsDelivered: true,
    provider: "msg91-managed",
    demoMode: false,
    expiresAt,
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

/** Send OTP via MSG91 widget server API (fallback when authkey path unavailable). */
async function sendMsg91WidgetServerLoginOtp(
  e164Digits: string,
  role: UserRole
): Promise<LoginOtpSendResult> {
  const widgetResult = await sendMsg91WidgetOtpMobileDetailed(e164Digits);
  if (widgetResult.ok) {
    const expiresAt = await storeMsg91WidgetReqId(e164Digits, role, widgetResult.reqId);
    return {
      sent: true,
      smsDelivered: true,
      provider: "msg91-widget",
      demoMode: false,
      expiresAt,
    };
  }

  throw new Error(widgetResult.error || "MSG91 widget SMS delivery failed");
}

/** Send OTP for shop/customer login and registration. */
export async function sendLoginOtp(
  e164Digits: string,
  role: UserRole
): Promise<LoginOtpSendResult> {
  const templateId = await resolveMsg91TemplateId();

  if (msg91AuthKey() && templateId) {
    try {
      return await sendAuthkeyManagedLoginOtp(e164Digits, role, templateId);
    } catch (err) {
      console.error("MSG91 authkey OTP failed, trying widget fallback:", err);
      if (isMsg91WidgetServerSendConfigured()) {
        return sendMsg91WidgetServerLoginOtp(e164Digits, role);
      }
      throw err;
    }
  }

  if (isMsg91Configured()) {
    return sendMsg91LoginOtp(e164Digits, role);
  }

  if (isMsg91WidgetServerSendConfigured()) {
    return sendMsg91WidgetServerLoginOtp(e164Digits, role);
  }

  return sendLocalLoginOtp(e164Digits, role);
}

/** Verify 6-digit OTP (MSG91 authkey, widget reqId, or local hash). */
export async function verifyLoginOtp(
  e164Digits: string,
  role: UserRole,
  code: string
): Promise<boolean> {
  const kind = await getLoginOtpKind(e164Digits, role);

  if (kind === "managed") {
    const ok = await verifyMsg91ManagedOtp(e164Digits, code);
    if (ok) await clearLoginOtp(e164Digits, role);
    return ok;
  }

  if (kind === "widget") {
    const reqId = await getMsg91WidgetReqId(e164Digits, role);
    if (!reqId) return false;
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
