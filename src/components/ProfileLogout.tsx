"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { parseApiResponse } from "@/lib/parse-api-response";
import { getOrCreateDeviceId } from "@/lib/device-id";

export function ProfileLogout({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ deviceId: getOrCreateDeviceId() }),
      });
      const data = await parseApiResponse(res);
      if (data.error) {
        setError(String(data.error));
        setPending(false);
        return;
      }
      router.replace(typeof data.redirect === "string" ? data.redirect : "/");
      router.refresh();
    } catch {
      setError(t(locale, "logoutFailed"));
      setPending(false);
    }
  }

  return (
    <div>
      {error && <p className="mb-2 text-center text-sm text-red-600">{error}</p>}
      <button
        type="button"
        disabled={pending}
        onClick={logout}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-white py-3.5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 active:scale-[0.99] disabled:opacity-60"
      >
        <LogOut className="h-4 w-4" />
        {pending ? "..." : t(locale, "logout")}
      </button>
    </div>
  );
}
