import type { Locale } from "@/lib/i18n/locales";

const SPEECH_LOCALES: Record<Locale, string> = {
  en: "en-IN",
  te: "te-IN",
  hi: "hi-IN",
};

export function speechLocaleFor(locale: Locale) {
  return SPEECH_LOCALES[locale] ?? "en-IN";
}

export function hasSpeechRecognition() {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function pickAudioMimeType() {
  if (typeof MediaRecorder === "undefined") return undefined;
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return types.find((type) => MediaRecorder.isTypeSupported(type));
}

export async function uploadVoiceBlob(blob: Blob) {
  const ext = blob.type.includes("mp4")
    ? "m4a"
    : blob.type.includes("ogg")
      ? "ogg"
      : "webm";
  const fd = new FormData();
  fd.append("file", blob, `voice-${Date.now()}.${ext}`);
  fd.append("folder", "voice");
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  const data = (await res.json()) as { path?: string };
  return data.path ?? null;
}
