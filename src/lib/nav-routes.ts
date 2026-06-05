/** Off-nav pages map to a main tab so swipe still works (profile, designs, …). */
const OFF_NAV_TAB: Record<string, string> = {
  "/customer/profile": "/customer",
  "/customer/designs": "/customer/shops",
  "/customer/favorites": "/customer/shops",
  "/customer/price-requests": "/customer/shops",
  "/customer/contact": "/customer/shops",
  "/customer/subscription": "/customer",
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
