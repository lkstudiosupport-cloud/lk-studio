"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";

export function ShopCodeSearch({ locale, initialCode }: { locale: Locale; initialCode?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode ?? "");

  return (
    <form
      className="card-premium flex gap-2 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        const q = code.trim();
        if (!q) {
          router.push("/customer/shops");
          return;
        }
        router.push(`/customer/shops?code=${encodeURIComponent(q)}`);
      }}
    >
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t(locale, "searchShopByCodePlaceholder")}
          className="w-full rounded-lg border border-zinc-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <button type="submit" className="btn-primary shrink-0 px-4 py-2.5 text-sm">
        {t(locale, "searchShop")}
      </button>
    </form>
  );
}
