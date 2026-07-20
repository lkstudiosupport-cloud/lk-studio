"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useTransition } from "react";
import { useIsSwipeNavBlocked, useSwipeTabs } from "@/hooks/useSwipeTabs";
import { isSwipeNavBlocked, resolveNavHref } from "@/lib/nav-routes";
import { prefetchShopTabFromHref } from "@/lib/shop-tab-client-cache";
import { whenShopPriorityTabsReady } from "@/lib/shop-boot";

/** Swipe left/right on page content to move between main nav sections (Dashboard, Designs, Orders, …). */
export function SwipeNavContent({
  navHrefs,
  children,
}: {
  navHrefs: readonly string[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [, startTransition] = useTransition();

  const activeHref = useMemo(() => resolveNavHref(pathname, navHrefs), [pathname, navHrefs]);
  const formBlocked = useIsSwipeNavBlocked();
  const swipeEnabled = activeHref != null && !isSwipeNavBlocked(pathname) && !formBlocked;

  const onTabChange = useCallback(
    (href: string) => {
      prefetchShopTabFromHref(href);
      startTransition(() => router.push(href));
    },
    [router, startTransition]
  );

  useEffect(() => {
    for (const href of navHrefs) {
      if (href.includes("/designs")) continue;
      router.prefetch(href);
      prefetchShopTabFromHref(href);
    }
    void whenShopPriorityTabsReady().then(() => {
      for (const href of navHrefs) {
        if (href.includes("/designs")) router.prefetch(href);
      }
    });
  }, [navHrefs, router]);

  const swipe = useSwipeTabs(navHrefs, activeHref ?? navHrefs[0], onTabChange, swipeEnabled);

  return (
    <div
      className="app-scroll-body-with-bottom-nav w-full min-w-0 touch-pan-y"
      onTouchStart={swipe.onTouchStart}
      onTouchEnd={swipe.onTouchEnd}
    >
      {children}
    </div>
  );
}
