import { redirect } from "next/navigation";
import { NavShell } from "@/components/NavShell";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { SessionRefresh } from "@/components/SessionRefresh";
import { ServerKeepAlive } from "@/components/ServerKeepAlive";
import { ShopTabCacheWarmer } from "@/components/ShopTabCacheWarmer";
import { ShopShellProvider } from "@/components/ShopShellProvider";
import { AutopayGuard } from "@/components/AutopayGuard";
import { t } from "@/lib/i18n";
import { isDemoAccountUser } from "@/lib/demo-accounts";
import { hasFullAppAccess } from "@/lib/subscription";
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

  if (!profile) {
    return (
      <main className="brand-page-bg flex min-h-dvh items-center justify-center p-6">
        <div className="card-premium max-w-md space-y-4 p-6 text-center">
          <h1 className="text-lg font-bold text-brand-green">{t(locale, "appName")}</h1>
          <p className="text-sm text-zinc-600">
            Shop profile could not be loaded. Check your connection and try again.
          </p>
          <a href="/shop" className="btn-primary block py-3">
            Try again
          </a>
          <a href="/login/shop" className="btn-secondary block py-3">
            {t(locale, "shopLogin")}
          </a>
        </div>
      </main>
    );
  }

  const demoBypass =
    isDemoAccountUser(user) || isDemoAccountUser({ phone: profile?.phone });
  const hasAccess =
    demoBypass ||
    hasFullAppAccess(
      profile.subscriptionStatus,
      profile.subscriptionEndsAt,
      profile.createdAt,
      profile.autopayEnabled
    );

  if (!hasAccess) {
    redirect("/register/autopay");
  }

  const navLinks = [
    { href: "/shop", label: t(locale, "dashboard"), shortLabel: t(locale, "navShortHome") },
    { href: "/shop/orders", label: t(locale, "orders"), shortLabel: t(locale, "navShortOrders") },
    { href: "/shop/bills", label: t(locale, "bills"), shortLabel: t(locale, "navShortBill") },
    { href: "/shop/attendance", label: t(locale, "attendanceSalary"), shortLabel: t(locale, "navShortAttendance") },
    { href: "/shop/workers", label: t(locale, "workers"), shortLabel: t(locale, "navShortWorkers") },
    { href: "/shop/designs", label: t(locale, "designs"), shortLabel: t(locale, "navShortDesigns") },
  ];

  const shopId = session.shopId!;

  return (
    <SubscriptionGate>
      <SessionRefresh />
      <ServerKeepAlive />
      <ShopShellProvider locale={locale} shopId={shopId}>
        <ShopTabCacheWarmer locale={locale} />
        <AutopayGuard hasAccess={hasAccess} setupPath="/register/autopay">
          <div className="brand-page-bg min-h-dvh w-full min-w-0">
            <NavShell
              locale={locale}
              title={profile?.shopName ?? t(locale, "appName")}
              profileHref="/shop/profile"
              profileLabel={t(locale, "shopProfileTitle")}
              profilePhoto={profile?.profilePhoto}
              links={navLinks}
              navPosition="top"
            />
            {/* Tabs stay fixed in header — change only on tap. */}
            <div className="app-scroll-body-with-top-nav w-full min-w-0">
              {/* pb only — padding-top comes from .app-main-content-with-top-nav (py-* would override it). */}
              <div className="app-main-content app-main-content-with-top-nav mx-auto w-full min-w-0 max-w-5xl pb-4 sm:pb-6">
                {children}
              </div>
            </div>
          </div>
        </AutopayGuard>
      </ShopShellProvider>
    </SubscriptionGate>
  );
}
