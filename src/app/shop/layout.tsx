import { redirect } from "next/navigation";
import { NavShell } from "@/components/NavShell";
import { SwipeNavContent } from "@/components/SwipeNavContent";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { SessionRefresh } from "@/components/SessionRefresh";
import { AutopayGuard } from "@/components/AutopayGuard";
import { t } from "@/lib/i18n";
import { isDemoAccountUser } from "@/lib/demo-accounts";
import {
  cachedLocale,
  cachedShopSession,
  cachedShopNavProfile,
  cachedUserDemoFields,
} from "@/lib/cached-server";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const session = await cachedShopSession();
  if (!session?.shopId) redirect("/login/shop");

  const [locale, profile, user] = await Promise.all([
    cachedLocale(),
    cachedShopNavProfile(session.shopId!),
    cachedUserDemoFields(session.id),
  ]);

  const demoBypass =
    isDemoAccountUser(user) || isDemoAccountUser({ phone: profile?.phone });

  const navLinks = [
    { href: "/shop", label: t(locale, "dashboard"), shortLabel: t(locale, "navShortHome") },
    { href: "/shop/designs", label: t(locale, "designs"), shortLabel: t(locale, "navShortDesigns") },
    { href: "/shop/orders", label: t(locale, "orders"), shortLabel: t(locale, "navShortOrders") },
    { href: "/shop/bills", label: t(locale, "bills"), shortLabel: t(locale, "navShortBill") },
    { href: "/shop/workers", label: t(locale, "workers"), shortLabel: t(locale, "navShortWorkers") },
  ];

  return (
    <SubscriptionGate>
      <SessionRefresh />
      <AutopayGuard
        autopayEnabled={profile?.autopayEnabled ?? false}
        trialBypass={demoBypass}
        setupPath="/register/autopay"
      >
        <div className="brand-page-bg min-h-dvh w-full min-w-0">
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
            <div className="app-main-content app-main-content-with-bottom-nav mx-auto w-full min-w-0 max-w-5xl py-4 sm:py-6">
              {children}
            </div>
          </SwipeNavContent>
        </div>
      </AutopayGuard>
    </SubscriptionGate>
  );
}
