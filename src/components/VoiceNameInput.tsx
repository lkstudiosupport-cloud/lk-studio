"use client";

import { Mic, Square } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { useVoiceCapture } from "@/hooks/useVoiceCapture";
import { transliterateClientText, useIndicTextSync } from "@/hooks/useIndicTextSync";

export function VoiceNameInput({
  value,
  onChange,
  placeholder,
  name,
  listenLabel,
  stopLabel,
  locale = "en",
  micErrorLabel,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  name?: string;
  listenLabel: string;
  stopLabel: string;
  locale?: Locale;
  micErrorLabel?: string;
  required?: boolean;
}) {
  const valueRef = useRef(value);
  const interimRef = useRef("");
  const { scheduleConvert, convertNow } = useIndicTextSync(locale, value, onChange);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const { active, start, stop } = useVoiceCapture({
    locale,
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        const base = valueRef.current.replace(interimRef.current, "").trim();
        interimRef.current = "";
        void (async () => {
          const spoken = await transliterateClientText(text, locale);
          const next = `${base} ${spoken}`.trim();
          onChange(next);
          valueRef.current = next;
        })();
      } else {
        const base = valueRef.current.replace(interimRef.current, "").trim();
        interimRef.current = text;
        onChange(`${base} ${text}`.trim());
      }
    },
    onError: (message) => {
      alert(micErrorLabel ?? message);
    },
  });

  return (
    <div className="flex gap-2">
      <input
        name={name}
        value={value}
        required={required}
        onChange={(e) => {
          interimRef.current = "";
          const next = e.target.value;
          onChange(next);
          scheduleConvert(next);
        }}
        onBlur={() => void convertNow(valueRef.current)}
        placeholder={placeholder}
        className="input-premium min-w-0 flex-1"
        lang={locale === "en" ? "en" : locale}
        spellCheck={locale === "en"}
      />
      {!active ? (
        <button
          type="button"
          onClick={() => void start()}
          className="shrink-0 rounded-xl bg-brand-green/10 p-2.5 text-brand-green"
          title={listenLabel}
          aria-label={listenLabel}
        >
          <Mic className="h-5 w-5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void stop()}
          className="shrink-0 animate-pulse rounded-xl bg-red-100 p-2.5 text-red-700"
          title={stopLabel}
          aria-label={stopLabel}
        >
          <Square className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
