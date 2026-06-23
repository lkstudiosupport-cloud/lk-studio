import { createClient } from "@supabase/supabase-js";
import type { UserRole } from "@prisma/client";
import { generateOtpCode } from "@/lib/auth-user";
import { consumeLoginOtp, storeLoginOtp } from "@/lib/login-session";
import { allowDemoOtpOnScreen } from "@/lib/production";
import { isDemoPhoneE164 } from "@/lib/demo-accounts";

export type LoginOtpSendResult = {
  sent: boolean;
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

/** Send login OTP via Supabase Auth SMS, or local demo store when not configured. */
export async function sendLoginOtp(
  e164Digits: string,
  role: UserRole
): Promise<LoginOtpSendResult> {
  if (isSupabaseOtpConfigured()) {
    const supabase = createOtpClient();
    const { error } = await supabase.auth.signInWithOtp({
      phone: supabasePhone(e164Digits),
    });

    if (error) {
      console.error("Supabase OTP send error:", error.message);
      throw new Error(error.message);
    }

    return {
      sent: true,
      demoMode: false,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };
  }

  const code = generateOtpCode();
  const expiresAt = await storeLoginOtp(e164Digits, role, code);
  console.log(`[LK Studio OTP demo] +${e164Digits}: ${code}`);

  const demoMode =
    allowDemoOtpOnScreen() ||
    (process.env.NODE_ENV !== "production" && isDemoPhoneE164(e164Digits));

  return {
    sent: false,
    demoMode,
    expiresAt,
    ...(demoMode && allowDemoOtpOnScreen() ? { demoCode: code } : {}),
  };
}

/** Verify login OTP via Supabase Auth or local demo store. */
export async function verifyLoginOtp(
  e164Digits: string,
  role: UserRole,
  code: string
): Promise<boolean> {
  if (isSupabaseOtpConfigured()) {
    const supabase = createOtpClient();
    const { data, error } = await supabase.auth.verifyOtp({
      phone: supabasePhone(e164Digits),
      token: code.trim(),
      type: "sms",
    });

    if (error || !data.session) {
      if (error) console.error("Supabase OTP verify error:", error.message);
      return false;
    }

    await supabase.auth.signOut();
    return true;
  }

  return consumeLoginOtp(e164Digits, role, code.trim());
}
