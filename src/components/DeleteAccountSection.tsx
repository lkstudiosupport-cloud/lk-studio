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
    <div className="card-premium border-red-100 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-red-800">{t(locale, "deleteAccountTitle")}</h2>
      <p className="mt-2 text-sm text-zinc-600">{t(locale, "deleteAccountHint")}</p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setConfirmText("");
          setError(null);
        }}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-300 bg-red-50 py-3 text-sm font-semibold text-red-800 transition hover:bg-red-100"
      >
        <Trash2 className="h-4 w-4" />
        {t(locale, "deleteAccountButton")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={t(locale, "deleteAccountTitle")}
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <p className="font-semibold text-red-800">{t(locale, "deleteAccountConfirmTitle")}</p>
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
              <p className="text-sm text-zinc-700">{t(locale, "deleteAccountConfirmBody")}</p>
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
                  className="btn-secondary flex-1 py-3"
                >
                  {t(locale, "cancel")}
                </button>
                <button
                  type="button"
                  disabled={pending || !canConfirm}
                  onClick={deleteAccount}
                  className="flex-1 rounded-xl bg-red-700 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {pending ? "..." : t(locale, "deleteAccountButton")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
