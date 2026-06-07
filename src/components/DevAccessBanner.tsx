"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink, Smartphone } from "lucide-react";

/** Shows public tunnel URL in dev — works on any Wi‑Fi or mobile data. */
export function DevAccessBanner() {
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/dev-access")
      .then((r) => r.json())
      .then((d: { tunnelUrl?: string | null }) => {
        if (d.tunnelUrl) setUrl(d.tunnelUrl);
      })
      .catch(() => {});
  }, []);

  if (!url) return null;

  const loginUrl = `${url.replace(/\/$/, "")}/login/customer`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(loginUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-3 text-left shadow-sm">
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-900">
        <Smartphone className="h-3.5 w-3.5" />
        Phone link (any Wi‑Fi / mobile data)
      </p>
      <p className="mb-2 break-all text-xs leading-snug text-emerald-800">{loginUrl}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-emerald-900 ring-1 ring-emerald-200 hover:bg-emerald-100"
        >
          <Copy className="h-3 w-3" />
          {copied ? "Copied" : "Copy link"}
        </button>
        <a
          href={loginUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-800"
        >
          <ExternalLink className="h-3 w-3" />
          Open
        </a>
      </div>
      <p className="mt-2 text-xs text-emerald-700/80">
        Run <code className="rounded bg-white/80 px-1">npm run dev:anywhere</code> on PC. No IP setup needed.
      </p>
    </div>
  );
}
