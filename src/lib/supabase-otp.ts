import { createClient } from "@supabase/supabase-js";
import type { UserRole } from "@prisma/client";
import { generateOtpCode } from "@/lib/auth-user";
import { consumeLoginOtp, storeLoginOtp } from "@/lib/login-session";
import { allowDemoOtpOnScreen } from "@/lib/production";
import { isDemoPhoneE164 } from "@/lib/demo-accounts";

export type LoginOtpSendResult = {
  /** SMS accepted by Supabase/Twilio */
  sent: boolean;
  /** False when using in-app / server-stored OTP because SMS failed */
  smsDelivered: boolean;
  demoMode: boolean;
  expiresAt: Date;
  demoCode?: string;
};

function supabasePhone(e164Digits: string): string {
  return e164Digits.startsWith("+") ? e164Digits : `+${e164Digits}`;
}

export function isSupabaseOtpConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
        process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
  );
}

function createOtpClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!.trim();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function supabaseOtpConfigError(): string | null {
  if (isSupabaseOtpConfigured()) return null;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    return "NEXT_PUBLIC_SUPABASE_URL is not set";
  }
  return "Supabase publishable key or SUPABASE_SERVICE_ROLE_KEY is not set";
}

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

  return {
    sent: false,
    smsDelivered: false,
    demoMode: showCode,
    expiresAt,
    ...(showCode ? { demoCode: code } : {}),
  };
}

/** Send login OTP via Supabase SMS, with local fallback if SMS provider fails. */
export async function sendLoginOtp(
  e164Digits: string,
  role: UserRole
): Promise<LoginOtpSendResult> {
  if (isSupabaseOtpConfigured()) {
    try {
      const supabase = createOtpClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: supabasePhone(e164Digits),
      });

      if (!error) {
        return {
          sent: true,
          smsDelivered: true,
          demoMode: false,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        };
      }

      console.error("Supabase OTP send failed, using local fallback:", error.message);
    } catch (err) {
      console.error("Supabase OTP send error, using local fallback:", err);
    }
  }

  return sendLocalLoginOtp(e164Digits, role);
}

/** Verify OTP via Supabase or local store (local is used when SMS provider failed). */
export async function verifyLoginOtp(
  e164Digits: string,
  role: UserRole,
  code: string
): Promise<boolean> {
  const trimmed = code.trim();

  if (isSupabaseOtpConfigured()) {
    const supabase = createOtpClient();
    const { data, error } = await supabase.auth.verifyOtp({
      phone: supabasePhone(e164Digits),
      token: trimmed,
      type: "sms",
    });

    if (!error && data.session) {
      await supabase.auth.signOut();
      return true;
    }

    if (error) {
      console.error("Supabase OTP verify failed, trying local store:", error.message);
    }
  }

  return consumeLoginOtp(e164Digits, role, trimmed);
}
