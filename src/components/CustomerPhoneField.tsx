"use client";

import { useEffect, useState } from "react";
import { Contact, Mic, Square } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { PhoneInput } from "@/components/PhoneInput";
import { isContactPickerSupported, pickPhoneContact } from "@/lib/pick-contact";
import { useVoiceCapture } from "@/hooks/useVoiceCapture";

const SPOKEN_DIGIT: Record<string, string> = {
  zero: "0",
  oh: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
};

function digitsFromSpeech(text: string): string {
  const direct = text.replace(/\D/g, "");
  if (direct.length >= 4) return direct;
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => SPOKEN_DIGIT[word] ?? "")
    .join("");
}

export function CustomerPhoneField({
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
  const [pickerSupported, setPickerSupported] = useState(false);

  useEffect(() => {
    setPickerSupported(isContactPickerSupported());
  }, []);

  const { active: voiceActive, start: startVoice, stop: stopVoice } = useVoiceCapture({
    locale,
    onTranscript: (chunk, isFinal) => {
      if (!isFinal) return;
      const digits = digitsFromSpeech(chunk);
      if (digits) onChange(digits);
    },
    onError: () => alert(t(locale, "micPermissionError")),
  });

  async function onPickContact() {
    setPickError("");
    if (!pickerSupported) {
      setPickError(t(locale, "contactPickUnsupported"));
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
        setPickError(t(locale, "contactPickUnsupported"));
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
        {t(locale, "mobileNumber")}
      </span>
      <div className="flex min-w-0 items-start gap-1.5">
        <div className="min-w-0 flex-1">
          <PhoneInput
            locale={locale}
            value={value}
            onChange={onChange}
            name="customerPhone"
            compactCountry
          />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            title={voiceActive ? t(locale, "stopListening") : t(locale, "startListening")}
            aria-label={voiceActive ? t(locale, "stopListening") : t(locale, "startListening")}
            onClick={() => (voiceActive ? void stopVoice() : void startVoice())}
            className={`inline-flex h-[2.75rem] w-10 items-center justify-center rounded-xl p-2 ${
              voiceActive
                ? "animate-pulse bg-red-600 text-white"
                : "bg-brand-green/10 text-brand-green hover:bg-brand-green/20"
            }`}
          >
            {voiceActive ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => void onPickContact()}
            disabled={picking}
            title={pickerSupported ? t(locale, "pickFromContacts") : t(locale, "contactPickUnsupported")}
            aria-label={t(locale, "pickFromContacts")}
            className="inline-flex h-[2.75rem] w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700 shadow-sm transition hover:bg-zinc-100 disabled:opacity-60 sm:w-auto sm:gap-1.5 sm:px-3"
          >
            <Contact className="h-4 w-4 shrink-0" />
            <span className="hidden text-xs font-semibold sm:inline">
              {t(locale, "pickFromContactsShort")}
            </span>
          </button>
        </div>
      </div>
      <p className="text-xs text-zinc-500">{t(locale, "whatsappNumberHint")}</p>
      {pickError && <p className="text-xs text-red-600">{pickError}</p>}
    </div>
  );
}
