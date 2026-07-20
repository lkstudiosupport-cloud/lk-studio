"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Locale } from "@/lib/i18n/locales";
import {
  hasLatinLetters,
  localeNeedsIndicTransliteration,
} from "@/lib/indic-transliterate";

/**
 * Converts Latin typed/spoken text into the selected app language script
 * (Telugu / Hindi / Bengali) via /api/transliterate.
 */
export async function transliterateClientText(
  text: string,
  locale: Locale
): Promise<string> {
  if (!localeNeedsIndicTransliteration(locale)) return text;
  if (!hasLatinLetters(text)) return text;

  try {
    const qs = new URLSearchParams({ text, locale });
    const res = await fetch(`/api/transliterate?${qs}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return text;
    const json = (await res.json()) as { ok?: boolean; text?: string };
    if (json.ok && typeof json.text === "string") return json.text;
  } catch {
    /* keep original */
  }
  return text;
}

/** Debounced transliteration for controlled text fields (names, notes, pieces). */
export function useIndicTextSync(
  locale: Locale,
  value: string,
  onChange: (next: string) => void,
  opts?: { debounceMs?: number; enabled?: boolean }
) {
  const debounceMs = opts?.debounceMs ?? 700;
  const enabled = opts?.enabled !== false && localeNeedsIndicTransliteration(locale);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef = useRef(0);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const convertNow = useCallback(
    async (raw: string) => {
      if (!enabled || !hasLatinLetters(raw)) return raw;
      const seq = ++seqRef.current;
      const next = await transliterateClientText(raw, locale);
      if (seq !== seqRef.current) return raw;
      if (next !== raw && next !== valueRef.current) {
        onChangeRef.current(next);
      }
      return next;
    },
    [enabled, locale]
  );

  const scheduleConvert = useCallback(
    (raw: string) => {
      if (!enabled) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (!hasLatinLetters(raw)) return;
      timerRef.current = setTimeout(() => {
        void convertNow(raw);
      }, debounceMs);
    },
    [convertNow, debounceMs, enabled]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { scheduleConvert, convertNow };
}
