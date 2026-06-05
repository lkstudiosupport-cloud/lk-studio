"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import {
  hasSpeechRecognition,
  pickAudioMimeType,
  speechLocaleFor,
  uploadVoiceBlob,
} from "@/lib/voice-recorder";

type Options = {
  locale?: Locale;
  onTranscript?: (text: string, isFinal: boolean) => void;
  /** When omitted, no audio file is recorded or uploaded — speech-to-text only. */
  onAudioPath?: (path: string) => void;
  onError?: (message: string) => void;
};

export function useVoiceCapture({
  locale = "en",
  onTranscript,
  onAudioPath,
  onError,
}: Options) {
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recordAudio = Boolean(onAudioPath);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stop = useCallback(async () => {
    if (!activeRef.current) return;
    activeRef.current = false;
    setActive(false);

    recognitionRef.current?.stop();
    recognitionRef.current = null;

    const recorder = recorderRef.current;
    recorderRef.current = null;

    if (recordAudio && recorder && recorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        recorder.addEventListener("stop", () => resolve(), { once: true });
        recorder.stop();
      });
      const mime = recorder.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mime });
      chunksRef.current = [];
      if (blob.size > 512 && onAudioPath) {
        try {
          const path = await uploadVoiceBlob(blob);
          if (path) onAudioPath(path);
        } catch {
          onError?.("Could not save voice recording");
        }
      }
    } else {
      chunksRef.current = [];
    }

    cleanupStream();
  }, [cleanupStream, onAudioPath, onError, recordAudio]);

  const startRecognition = useCallback(() => {
    if (!hasSpeechRecognition() || !onTranscript) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = speechLocaleFor(locale);
    rec.onresult = (event) => {
      let finalText = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const part = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += part;
        else interim += part;
      }
      if (finalText.trim()) onTranscript(finalText.trim(), true);
      else if (interim.trim()) onTranscript(interim.trim(), false);
    };
    rec.onerror = (event) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("SpeechRecognition:", event.error);
      }
    };
    rec.onend = () => {
      if (activeRef.current && recognitionRef.current === rec) {
        try {
          rec.start();
        } catch {
          /* ignore restart errors */
        }
      }
    };
    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      onError?.("Speech recognition could not start");
    }
  }, [locale, onError, onTranscript]);

  const start = useCallback(async () => {
    if (activeRef.current) return;

    if (recordAudio) {
      if (!navigator.mediaDevices?.getUserMedia) {
        onError?.("Microphone not supported on this device");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        chunksRef.current = [];

        const mimeType = pickAudioMimeType();
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
        recorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };
        recorder.start(400);
        startRecognition();

        activeRef.current = true;
        setActive(true);
      } catch {
        cleanupStream();
        onError?.("Allow microphone permission to record voice");
      }
      return;
    }

    if (!hasSpeechRecognition() || !onTranscript) {
      onError?.("Speech-to-text is not supported on this device");
      return;
    }

    activeRef.current = true;
    setActive(true);
    startRecognition();
  }, [cleanupStream, onError, onTranscript, recordAudio, startRecognition]);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      recognitionRef.current?.stop();
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      cleanupStream();
    };
  }, [cleanupStream]);

  const toggle = useCallback(() => {
    if (activeRef.current) void stop();
    else void start();
  }, [start, stop]);

  return { active, start, stop, toggle };
}
