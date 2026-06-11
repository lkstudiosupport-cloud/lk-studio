"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { parseApiResponse } from "@/lib/parse-api-response";

export function DeleteAccountSection({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmWord = t(locale, "deleteAccountConfirmWord");
  const canConfirm = confirmText.trim().toUpperCase() === confirmWord.toUpperCase();

  async function deleteAccount() {
    if (!canConfirm) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      const data = await parseApiResponse(res);
      if (!res.ok) {
        setError(String(data.error ?? t(locale, "deleteAccountFailed")));
        setPending(false);
        return;
      }
      router.replace(typeof data.redirect === "string" ? data.redirect : "/");
      router.refresh();
    } catch {
      setError(t(locale, "deleteAccountFailed"));
      setPending(false);
    }
  }

  return (
    <>
      <div className="delete-account-edge-pin">
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setConfirmText("");
            setError(null);
          }}
          className="rounded-tr-lg p-2 text-red-500/70 transition hover:bg-red-50 hover:text-red-700 active:scale-95"
          aria-label={t(locale, "deleteAccountButton")}
          title={t(locale, "deleteAccountButton")}
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={t(locale, "deleteAccountConfirmTitle")}
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <p className="text-sm font-semibold text-red-800">
                {t(locale, "deleteAccountConfirmTitle")}
              </p>
              <button
                type="button"
                disabled={pending}
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-50"
                aria-label={t(locale, "cancel")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-4">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-zinc-600">
                  {t(locale, "deleteAccountTypeConfirm", { word: confirmWord })}
                </span>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="input-premium w-full uppercase"
                  autoComplete="off"
                  disabled={pending}
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setOpen(false)}
                  className="btn-secondary flex-1 py-2.5 text-sm"
                >
                  {t(locale, "cancel")}
                </button>
                <button
                  type="button"
                  disabled={pending || !canConfirm}
                  onClick={deleteAccount}
                  className="flex-1 rounded-xl bg-red-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {pending ? "..." : t(locale, "deleteAccountButton")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
