import { redirect } from "next/navigation";
import { NavShell } from "@/components/NavShell";
import { SwipeNavContent } from "@/components/SwipeNavContent";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { SessionRefresh } from "@/components/SessionRefresh";
import { AutopayGuard } from "@/components/AutopayGuard";
import { t } from "@/lib/i18n";
import {
  cachedLocale,
  cachedShopSession,
  cachedShopNavProfile,
} from "@/lib/cached-server";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const session = await cachedShopSession();
  if (!session?.shopId) redirect("/login/shop");

  const [locale, profile] = await Promise.all([
    cachedLocale(),
    cachedShopNavProfile(session.shopId!),
  ]);

  const navLinks = [
    { href: "/shop", label: t(locale, "dashboard") },
    { href: "/shop/designs", label: t(locale, "designs") },
    { href: "/shop/orders", label: t(locale, "orders") },
    { href: "/shop/bills", label: t(locale, "payments") },
    { href: "/shop/workers", label: t(locale, "workers") },
  ];

  return (
    <SubscriptionGate>
      <SessionRefresh />
      <AutopayGuard autopayEnabled={profile?.autopayEnabled ?? false} setupPath="/register/autopay">
        <div className="min-h-dvh brand-page-bg">
          <NavShell
            locale={locale}
            title={profile?.shopName ?? t(locale, "appName")}
            profileHref="/shop/profile"
            profileLabel={t(locale, "shopProfileTitle")}
            profilePhoto={profile?.profilePhoto}
            links={navLinks}
            navPosition="bottom"
          />
          <SwipeNavContent navHrefs={navLinks.map((l) => l.href)}>
            <div className="app-main-content app-main-content-with-bottom-nav mx-auto max-w-5xl py-4 sm:py-6">
              {children}
            </div>
          </SwipeNavContent>
        </div>
      </AutopayGuard>
    </SubscriptionGate>
  );
}
