"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8f6ed" }}>
        <main
          style={{
            minHeight: "100dvh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              maxWidth: "24rem",
              background: "#fff",
              borderRadius: "1rem",
              padding: "1.5rem",
              textAlign: "center",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            }}
          >
            <h1 style={{ fontSize: "1.125rem", color: "#1b3022", marginBottom: "0.75rem" }}>
              LK Studio — temporary error
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#52525b", marginBottom: "1rem" }}>
              Please tap Try again. If it keeps failing, wait a minute and reopen the app.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.75rem",
                border: "none",
                background: "#1b3022",
                color: "#c9a227",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
