import type { UserRole } from "@prisma/client";
import { generateOtpCode } from "@/lib/auth-user";
import { consumeLoginOtp, storeLoginOtp } from "@/lib/login-session";
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
import { allowDemoOtpOnScreen, isProduction } from "@/lib/production";
import { isDemoPhoneE164 } from "@/lib/demo-accounts";

export { isMsg91Configured, msg91OtpConfigError, isMsg91WidgetServerConfigured };

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
    throw new Error(
      msg91OtpConfigError() ??
        (isMsg91WidgetServerConfigured()
          ? "Configure MSG91 widget on login page or MSG91_TEMPLATE_ID for server SMS"
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

/** Send OTP via MSG91 Flow API (server SMS). Widget mode sends OTP on the client instead. */
export async function sendLoginOtp(
  e164Digits: string,
  role: UserRole
): Promise<LoginOtpSendResult> {
  if (isMsg91Configured()) {
    return sendMsg91LoginOtp(e164Digits, role);
  }

  return sendLocalLoginOtp(e164Digits, role);
}

/** Verify 6-digit code from server-stored OTP (Flow API / dev fallback). */
export async function verifyLoginOtp(
  e164Digits: string,
  role: UserRole,
  code: string
): Promise<boolean> {
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
