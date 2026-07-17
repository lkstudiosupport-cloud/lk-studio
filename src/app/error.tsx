"use client";

import { useEffect, useState } from "react";

const MAX_AUTO_RETRIES = 4;

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const autoRetrying = attempt < MAX_AUTO_RETRIES;

  useEffect(() => {
    console.error("[lk-studio] page error:", error.digest ?? error.message);
  }, [error]);

  useEffect(() => {
    if (!autoRetrying) return;
    const delay = Math.min(800 * Math.pow(2, attempt), 6000);
    const timer = setTimeout(() => {
      setAttempt((n) => n + 1);
      reset();
    }, delay);
    return () => clearTimeout(timer);
  }, [attempt, autoRetrying, reset]);

  return (
    <main className="brand-page-bg flex min-h-dvh items-center justify-center p-6">
      <div className="card-premium max-w-md space-y-4 p-6 text-center">
        <h1 className="text-lg font-bold text-brand-green">Something went wrong</h1>
        <p className="text-sm text-zinc-600">
          {autoRetrying
            ? "The server had a temporary problem loading this page. This often fixes itself after a refresh — especially when the server was idle. Retrying automatically…"
            : "The page still could not load. Check your internet connection, wait a moment, then tap Try again."}
        </p>
        <button type="button" onClick={() => reset()} className="btn-primary w-full py-3">
          Try again
        </button>
        <a href="/" className="btn-secondary block w-full py-3">
          Go to home
        </a>
      </div>
    </main>
  );
}
