"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { useVoiceCapture } from "@/hooks/useVoiceCapture";

type Props = {
  locale: Locale;
  textLabel: string;
  hintLabel?: string;
  startLabel: string;
  stopLabel: string;
  micErrorLabel: string;
  defaultText?: string;
  fieldName?: string;
  onTextChange?: (text: string) => void;
};

export function VoiceNotes({
  locale,
  textLabel,
  hintLabel,
  startLabel,
  stopLabel,
  micErrorLabel,
  defaultText = "",
  fieldName = "notes",
  onTextChange,
}: Props) {
  const [text, setText] = useState(defaultText);
  const textRef = useRef(text);
  const interimRef = useRef("");

  useEffect(() => {
    setText(defaultText);
  }, [defaultText]);

  useEffect(() => {
    textRef.current = text;
    onTextChange?.(text);
  }, [text, onTextChange]);

  const { active, start, stop } = useVoiceCapture({
    locale,
    onTranscript: (chunk, isFinal) => {
      if (isFinal) {
        const base = textRef.current.replace(interimRef.current, "").trim();
        const next = `${base} ${chunk}`.trim();
        interimRef.current = "";
        setText(next);
      } else {
        const base = textRef.current.replace(interimRef.current, "").trim();
        interimRef.current = chunk;
        setText(`${base} ${chunk}`.trim());
      }
    },
    onError: (message) => alert(micErrorLabel || message),
  });

  return (
    <div className="space-y-3 rounded-xl border border-brand-green/15 bg-brand-cream/50 p-4">
      <label className="block text-sm font-semibold text-brand-green">{textLabel}</label>
      {hintLabel && <p className="text-xs text-zinc-500">{hintLabel}</p>}
      <textarea
        name={fieldName}
        value={text}
        onChange={(e) => {
          interimRef.current = "";
          setText(e.target.value);
        }}
        rows={3}
        className="input-premium w-full"
      />
      <div className="flex flex-wrap gap-2">
        {!active ? (
          <button
            type="button"
            onClick={() => void start()}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-white"
          >
            <Mic className="h-4 w-4" />
            {startLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void stop()}
            className="inline-flex animate-pulse items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white"
          >
            <Square className="h-4 w-4" />
            {stopLabel}
          </button>
        )}
      </div>
    </div>
  );
}
