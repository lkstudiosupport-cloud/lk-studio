"use client";

import { useEffect, useRef } from "react";
import { Mic, Square } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { useVoiceCapture } from "@/hooks/useVoiceCapture";

type Props = {
  locale: Locale;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
  micErrorLabel: string;
  startLabel: string;
  stopLabel: string;
};

export function VoiceInput({
  locale,
  value,
  onChange,
  placeholder,
  "aria-label": ariaLabel,
  className = "",
  micErrorLabel,
  startLabel,
  stopLabel,
}: Props) {
  const textRef = useRef(value);
  const interimRef = useRef("");

  useEffect(() => {
    textRef.current = value;
  }, [value]);

  const { active, start, stop } = useVoiceCapture({
    locale,
    onTranscript: (chunk, isFinal) => {
      if (isFinal) {
        const base = textRef.current.replace(interimRef.current, "").trim();
        interimRef.current = "";
        onChange(`${base} ${chunk}`.trim());
      } else {
        const base = textRef.current.replace(interimRef.current, "").trim();
        interimRef.current = chunk;
        onChange(`${base} ${chunk}`.trim());
      }
    },
    onError: (message) => alert(micErrorLabel || message),
  });

  return (
    <div className={`flex min-w-0 items-center gap-1 ${className}`}>
      <input
        value={value}
        onChange={(e) => {
          interimRef.current = "";
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="input-premium min-w-0 flex-1 py-1.5 text-sm"
      />
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
    </div>
  );
}
