"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { useVoiceCapture } from "@/hooks/useVoiceCapture";
import { transliterateClientText, useAdaptTextOnLocaleChange, useIndicTextSync } from "@/hooks/useIndicTextSync";

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
  transliterate?: boolean;
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
  transliterate = true,
}: Props) {
  const [text, setText] = useState(defaultText);
  const textRef = useRef(text);
  const interimRef = useRef("");
  const { scheduleConvert, convertNow } = useIndicTextSync(
    locale,
    text,
    (next) => {
      setText(next);
      textRef.current = next;
    },
    { enabled: transliterate }
  );

  useAdaptTextOnLocaleChange(locale, text, (next) => {
    setText(next);
    textRef.current = next;
  }, { enabled: transliterate });

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
        interimRef.current = "";
        void (async () => {
          const spoken = transliterate
            ? await transliterateClientText(chunk, locale)
            : chunk;
          const next = `${base} ${spoken}`.trim();
          setText(next);
          textRef.current = next;
        })();
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
          const next = e.target.value;
          setText(next);
          scheduleConvert(next);
        }}
        onBlur={() => {
          void convertNow(textRef.current);
        }}
        rows={3}
        className="input-premium w-full"
        lang={locale === "en" ? "en" : locale}
        spellCheck={locale === "en"}
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
