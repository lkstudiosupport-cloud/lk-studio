"use client";

import { useEffect, useRef } from "react";
import { Mic, Square } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { useVoiceCapture } from "@/hooks/useVoiceCapture";
import { transliterateClientText, useIndicTextSync } from "@/hooks/useIndicTextSync";

type Props = {
  locale: Locale;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
  list?: string;
  required?: boolean;
  autoFocus?: boolean;
  /** "inline" = mic beside input (default); "micInside" = mic overlaid inside input on the right */
  micVariant?: "inline" | "micInside";
  micErrorLabel: string;
  startLabel: string;
  stopLabel: string;
  /** Convert Latin typing/speech into selected language script (default true). */
  transliterate?: boolean;
};

export function VoiceInput({
  locale,
  value,
  onChange,
  placeholder,
  "aria-label": ariaLabel,
  className = "",
  list,
  required,
  autoFocus,
  micVariant = "inline",
  micErrorLabel,
  startLabel,
  stopLabel,
  transliterate = true,
}: Props) {
  const textRef = useRef(value);
  const interimRef = useRef("");
  const { scheduleConvert, convertNow } = useIndicTextSync(locale, value, onChange, {
    enabled: transliterate,
  });

  useEffect(() => {
    textRef.current = value;
  }, [value]);

  const { active, start, stop } = useVoiceCapture({
    locale,
    onTranscript: (chunk, isFinal) => {
      if (isFinal) {
        const base = textRef.current.replace(interimRef.current, "").trim();
        interimRef.current = "";
        void (async () => {
          const spoken = transliterate
            ? await transliterateClientText(chunk, locale)
            : chunk;
          const next = `${base} ${spoken}`.trim();
          onChange(next);
          textRef.current = next;
        })();
      } else {
        const base = textRef.current.replace(interimRef.current, "").trim();
        interimRef.current = chunk;
        onChange(`${base} ${chunk}`.trim());
      }
    },
    onError: (message) => alert(micErrorLabel || message),
  });

  function handleTyped(next: string) {
    interimRef.current = "";
    onChange(next);
    scheduleConvert(next);
  }

  async function handleBlur() {
    const converted = await convertNow(textRef.current);
    textRef.current = converted;
  }

  const micButton = (
    <button
      type="button"
      title={active ? stopLabel : startLabel}
      aria-label={active ? stopLabel : startLabel}
      onClick={() => (active ? void stop() : void start())}
      className={`shrink-0 rounded-lg p-1.5 ${
        active
          ? "animate-pulse bg-red-600 text-white"
          : "bg-brand-green/10 text-brand-green hover:bg-brand-green/20"
      }`}
    >
      {active ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );

  if (micVariant === "micInside") {
    return (
      <div className={`relative min-w-0 ${className}`}>
        <input
          value={value}
          onChange={(e) => handleTyped(e.target.value)}
          onBlur={() => void handleBlur()}
          placeholder={placeholder}
          aria-label={ariaLabel}
          list={list}
          required={required}
          autoFocus={autoFocus}
          className="input-premium w-full py-1.5 pe-10 text-sm"
          lang={locale === "en" ? "en" : locale}
          inputMode="text"
          autoCapitalize="words"
          autoCorrect="off"
          spellCheck={locale === "en"}
        />
        <div className="absolute inset-y-0 end-1 flex items-center">{micButton}</div>
      </div>
    );
  }

  return (
    <div className={`flex min-w-0 items-center gap-1 ${className}`}>
      <input
        value={value}
        onChange={(e) => handleTyped(e.target.value)}
        onBlur={() => void handleBlur()}
        placeholder={placeholder}
        aria-label={ariaLabel}
        list={list}
        required={required}
        autoFocus={autoFocus}
        className="input-premium min-w-0 flex-1 py-1.5 text-sm"
        lang={locale === "en" ? "en" : locale}
        inputMode="text"
        autoCapitalize="words"
        autoCorrect="off"
        spellCheck={locale === "en"}
      />
      {micButton}
    </div>
  );
}
