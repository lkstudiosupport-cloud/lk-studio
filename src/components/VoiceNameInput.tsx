"use client";

import { Mic, Square } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { useVoiceCapture } from "@/hooks/useVoiceCapture";

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

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const { active, start, stop } = useVoiceCapture({
    locale,
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        const base = valueRef.current.replace(interimRef.current, "").trim();
        const next = `${base} ${text}`.trim();
        interimRef.current = "";
        onChange(next);
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
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className="input-premium min-w-0 flex-1"
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
