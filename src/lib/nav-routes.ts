/** Shop bill create/detail/edit — keep swipe on list only (/shop/bills). */
function isShopBillSubPage(pathname: string): boolean {
  return pathname.startsWith("/shop/bills/");
}

/** Pages where horizontal swipe must not change main nav (forms, wizards, …). */
const SWIPE_NAV_BLOCKED: readonly string[] = [];

export function isSwipeNavBlocked(pathname: string): boolean {
  if (isShopBillSubPage(pathname)) return true;
  return SWIPE_NAV_BLOCKED.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** Off-nav pages map to a main tab so swipe still works (profile, designs, …). */
const OFF_NAV_TAB: Record<string, string> = {
  "/customer/profile": "/customer/designs",
  "/customer": "/customer/designs",
  "/customer/favorites": "/customer/shops",
  "/customer/price-requests": "/customer/shops",
  "/customer/contact": "/customer/shops",
  "/customer/subscription": "/customer/designs",
  "/shop/profile": "/shop",
  "/shop/reports": "/shop",
  "/shop/customer-favorites": "/shop/orders",
  "/shop/price-requests": "/shop/orders",
  "/shop/subscription": "/shop",
};

/** Match current path to the active main-nav href (e.g. /shop/bills/abc → /shop/bills). */
export function resolveNavHref(pathname: string, navHrefs: readonly string[]): string | null {
  const sorted = [...navHrefs].sort((a, b) => b.length - a.length);

  for (const href of sorted) {
    if (href === "/shop" || href === "/customer") {
      if (pathname === href) return href;
      continue;
    }
    if (pathname === href || pathname.startsWith(`${href}/`)) {
      return href;
    }
  }

  for (const [prefix, navHref] of Object.entries(OFF_NAV_TAB)) {
    if (!navHrefs.includes(navHref)) continue;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return navHref;
    }
  }

  return null;
}
