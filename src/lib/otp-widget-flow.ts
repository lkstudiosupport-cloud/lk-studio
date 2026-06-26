"use client";

import { resolvePhoneE164 } from "@/lib/phone";
import {
  isMsg91WidgetClientConfigured,
  msg91WidgetSendOtp,
  msg91WidgetVerifyOtp,
  toMsg91Identifier,
} from "@/lib/msg91-widget-client";

/** After server OK, send SMS through MSG91 widget when production uses widget mode. */
export async function deliverOtpViaWidgetIfNeeded(
  phone: string,
  widgetOtp: boolean
): Promise<void> {
  if (!widgetOtp) return;

  if (!isMsg91WidgetClientConfigured()) {
    throw new Error("MSG91 widget is not configured on client");
  }

  const e164 = resolvePhoneE164(phone);
  if (!e164) {
    throw new Error("Invalid phone number");
  }

  await msg91WidgetSendOtp(toMsg91Identifier(e164));
}

/** Returns MSG91 access token when widget mode is active; otherwise undefined. */
export async function verifyOtpViaWidgetIfNeeded(
  code: string,
  widgetOtp: boolean
): Promise<string | undefined> {
  if (!widgetOtp) return undefined;
  return msg91WidgetVerifyOtp(code);
}
