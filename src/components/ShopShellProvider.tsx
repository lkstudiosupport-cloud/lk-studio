"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { bindShopTabCacheScope, clearShopTabCache } from "@/lib/shop-tab-client-cache";

type ShopShellValue = {
  locale: Locale;
  shopId: string;
};

const ShopShellContext = createContext<ShopShellValue | null>(null);

/**
 * Provides locale + shopId to tab pages so they can render as sync shells
 * (no per-tab RSC await) and keeps the client tab cache scoped to this shop.
 */
export function ShopShellProvider({
  locale,
  shopId,
  children,
}: ShopShellValue & { children: React.ReactNode }) {
  // Sync bind during render so warmer / hooks never write under the wrong scope.
  bindShopTabCacheScope(shopId);

  return (
    <ShopShellContext.Provider value={{ locale, shopId }}>{children}</ShopShellContext.Provider>
  );
}

export function useShopShell(): ShopShellValue {
  const value = useContext(ShopShellContext);
  if (!value) {
    throw new Error("useShopShell must be used within ShopShellProvider");
  }
  return value;
}

/** Clear tab cache on logout so the next shop never sees prior data. */
export function clearShopShellCaches() {
  clearShopTabCache();
}
