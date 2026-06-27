"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[lk-studio] page error:", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="brand-page-bg flex min-h-dvh items-center justify-center p-6">
      <div className="card-premium max-w-md space-y-4 p-6 text-center">
        <h1 className="text-lg font-bold text-brand-green">Something went wrong</h1>
        <p className="text-sm text-zinc-600">
          The server had a temporary problem loading this page. This often fixes itself after a
          refresh — especially right after an app update or when the server was idle.
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
