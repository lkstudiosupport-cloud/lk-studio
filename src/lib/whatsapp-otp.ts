import { isDemoPhoneE164 } from "@/lib/demo-accounts";
import { allowDemoOtpOnScreen } from "@/lib/production";

/**
 * Send login OTP via WhatsApp Business Cloud API, custom webhook, or demo log.
 *
 * Production setup (Meta):
 * - WHATSAPP_CLOUD_TOKEN — permanent access token
 * - WHATSAPP_PHONE_NUMBER_ID — from WhatsApp > API Setup
 * - WHATSAPP_OTP_TEMPLATE_NAME — approved auth template (body param = code)
 *
 * Alternative: WHATSAPP_OTP_WEBHOOK — POST { phone, message, code }
 * Dev: omit vars; code is logged and returned as demoCode when LOGIN_OTP_DEMO is set.
 */

export type WhatsAppOtpResult = {
  sent: boolean;
  demoMode: boolean;
  message: string;
};

export async function sendWhatsAppOtp(e164Digits: string, code: string): Promise<WhatsAppOtpResult> {
  const message = `Your LK Studio login code is ${code}. Valid for 10 minutes. Do not share.`;
  const token = process.env.WHATSAPP_CLOUD_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME?.trim() || "lk_studio_login";
  const templateLang = process.env.WHATSAPP_OTP_TEMPLATE_LANG?.trim() || "en";
  const webhook = process.env.WHATSAPP_OTP_WEBHOOK?.trim();

  if (token && phoneNumberId) {
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: e164Digits,
          type: "template",
          template: {
            name: templateName,
            language: { code: templateLang },
            components: [
              {
                type: "body",
                parameters: [{ type: "text", text: code }],
              },
            ],
          },
        }),
      });

      if (res.ok) {
        return { sent: true, demoMode: false, message };
      }

      console.error("WhatsApp Cloud API OTP failed:", res.status, await res.text());
    } catch (err) {
      console.error("WhatsApp Cloud API request error:", err);
    }
  }

  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: e164Digits, message, code }),
      });
      if (res.ok) {
        return { sent: true, demoMode: false, message };
      }
      console.error("WhatsApp OTP webhook failed:", res.status, await res.text());
    } catch (err) {
      console.error("WhatsApp OTP webhook error:", err);
    }
  }

  console.log(`[LK Studio OTP] +${e164Digits}: ${code}`);

  const demoMode =
    allowDemoOtpOnScreen() ||
    (process.env.NODE_ENV !== "production" && isDemoPhoneE164(e164Digits));

  return { sent: false, demoMode, message };
}
