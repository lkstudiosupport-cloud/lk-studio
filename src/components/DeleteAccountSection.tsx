"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { parseApiResponse } from "@/lib/parse-api-response";

export function DeleteAccountSection({
  locale,
  aboveBottomNav = false,
  position = "edge",
}: {
  locale: Locale;
  aboveBottomNav?: boolean;
  position?: "edge" | "inline";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
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

  function openDialog() {
    setOpen(true);
    setStep(1);
    setConfirmText("");
    setError(null);
  }

  function closeDialog() {
    if (pending) return;
    setOpen(false);
    setStep(1);
    setConfirmText("");
    setError(null);
  }

  return (
    <>
      {position === "edge" ? (
        <div
          className={`delete-account-edge-pin${aboveBottomNav ? " delete-account-edge-pin--above-nav" : ""}`}
        >
          <button
            type="button"
            onClick={openDialog}
            className="delete-account-edge-btn"
            aria-label={t(locale, "deleteAccountButtonShort")}
          >
            <Trash2 className="h-2.5 w-2.5" strokeWidth={1.5} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openDialog}
          className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          {t(locale, "deleteAccountButtonShort")}
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={t(locale, "deleteAccountConfirmTitle")}
          onClick={() => !pending && closeDialog()}
        >
          <div
            className="w-full max-w-[22rem] overflow-hidden rounded-xl bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
              <p className="text-xs font-semibold text-red-800">
                {t(locale, "deleteAccountConfirmTitle")}
              </p>
              <button
                type="button"
                disabled={pending}
                onClick={closeDialog}
                className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 disabled:opacity-50"
                aria-label={t(locale, "cancel")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-3 p-3">
              {error && <p className="text-xs text-red-600">{error}</p>}
              {step === 1 ? (
                <>
                  <p className="text-sm text-zinc-700">{t(locale, "deleteAccountConfirmBody")}</p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={closeDialog}
                      className="btn-secondary flex-1 py-1.5 text-xs"
                    >
                      {t(locale, "cancel")}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setStep(2)}
                      className="flex-1 rounded-lg bg-red-700 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {t(locale, "registerContinue")}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <label className="block">
                    <span className="mb-0.5 block text-[10px] font-medium text-zinc-500">
                      {t(locale, "deleteAccountTypeConfirm", { word: confirmWord })}
                    </span>
                    <input
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="input-premium w-full py-1.5 text-sm uppercase"
                      autoComplete="off"
                      disabled={pending}
                    />
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={closeDialog}
                      className="btn-secondary flex-1 py-1.5 text-xs"
                    >
                      {t(locale, "cancel")}
                    </button>
                    <button
                      type="button"
                      disabled={pending || !canConfirm}
                      onClick={deleteAccount}
                      className="flex-1 rounded-lg bg-red-700 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {pending ? "..." : t(locale, "deleteAccountButtonShort")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
