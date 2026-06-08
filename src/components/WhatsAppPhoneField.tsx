"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { PhoneInput } from "@/components/PhoneInput";
import { isContactPickerSupported, pickPhoneContact } from "@/lib/pick-contact";

export function WhatsAppPhoneField({
  locale,
  value,
  onChange,
  onNamePicked,
}: {
  locale: Locale;
  value: string;
  onChange: (phone: string) => void;
  /** When a picked contact includes a name, optionally fill the customer name field. */
  onNamePicked?: (name: string) => void;
}) {
  const [picking, setPicking] = useState(false);
  const [pickError, setPickError] = useState("");
  const pickerSupported = isContactPickerSupported();

  async function onPickContact() {
    setPickError("");
    if (!pickerSupported) {
      setPickError(t(locale, "whatsappPickLimitation"));
      return;
    }

    setPicking(true);
    try {
      const picked = await pickPhoneContact();
      if (picked.phone) onChange(picked.phone);
      if (picked.name && onNamePicked) onNamePicked(picked.name);
      if (!picked.phone) setPickError(t(locale, "pickContactNoPhone"));
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "CONTACT_PICKER_UNSUPPORTED") {
        setPickError(t(locale, "whatsappPickLimitation"));
      } else {
        setPickError(t(locale, "pickContactFailed"));
      }
    } finally {
      setPicking(false);
    }
  }

  return (
    <div className="space-y-1">
      <span className="mb-1 block text-sm font-semibold text-brand-green">
        {t(locale, "whatsappNumber")}
      </span>
      <div className="flex min-w-0 items-start gap-2">
        <div className="min-w-0 flex-1">
          <PhoneInput
            locale={locale}
            value={value}
            onChange={onChange}
            name="customerPhone"
            hideFooter
          />
        </div>
        <button
          type="button"
          onClick={onPickContact}
          disabled={picking}
          title={pickerSupported ? t(locale, "pickFromContacts") : t(locale, "whatsappPickLimitation")}
          aria-label={t(locale, "pickFromContacts")}
          className="inline-flex h-[2.75rem] shrink-0 items-center gap-1.5 rounded-xl border border-green-600/30 bg-green-50 px-3 text-xs font-bold text-green-700 shadow-sm transition hover:bg-green-100 disabled:opacity-60"
        >
          <MessageCircle className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">{t(locale, "pickFromContactsShort")}</span>
        </button>
      </div>
      <p className="text-xs text-zinc-500">{t(locale, "whatsappNumberHint")}</p>
      <p className="text-xs text-zinc-500">{t(locale, "whatsappPickLimitation")}</p>
      {pickError && <p className="text-xs text-red-600">{pickError}</p>}
    </div>
  );
}
