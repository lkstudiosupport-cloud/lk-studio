import { redirect } from "next/navigation";
import { NavShell } from "@/components/NavShell";
import { SwipeNavContent } from "@/components/SwipeNavContent";
import { SessionRefresh } from "@/components/SessionRefresh";
import { ServerKeepAlive } from "@/components/ServerKeepAlive";
import { t } from "@/lib/i18n";
import {
  cachedLocale,
  cachedCustomerSession,
  cachedCustomerNavProfile,
} from "@/lib/cached-server";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await cachedCustomerSession();
  if (!session) redirect("/login/customer");

  const [locale, user] = await Promise.all([
    cachedLocale(),
    cachedCustomerNavProfile(session.id),
  ]);

  const navLinks = [
    { href: "/customer/designs", label: t(locale, "designs"), shortLabel: t(locale, "navShortDesigns") },
    { href: "/customer/shops", label: t(locale, "browseShops"), shortLabel: t(locale, "navShortShops") },
    {
      href: "/customer/price-requests",
      label: t(locale, "myPriceQuotes"),
      shortLabel: t(locale, "navShortQuotes"),
    },
    {
      href: "/customer/persons",
      label: t(locale, "measurements"),
      shortLabel: t(locale, "navShortMeasure"),
    },
    { href: "/customer/bills", label: t(locale, "myBills"), shortLabel: t(locale, "navShortBills") },
  ];

  return (
    <>
      <SessionRefresh />
      <ServerKeepAlive />
      <div className="brand-page-bg min-h-dvh w-full min-w-0">
        <NavShell
          locale={locale}
          title={t(locale, "appName")}
          profileHref="/customer/profile"
          profileLabel={t(locale, "customerProfileTitle")}
          profilePhoto={user?.profilePhoto}
          links={navLinks}
          navPosition="bottom"
        />
        <SwipeNavContent navHrefs={navLinks.map((l) => l.href)}>
          <div className="app-main-content app-main-content-with-bottom-nav mx-auto w-full min-w-0 max-w-5xl py-4 sm:py-6">
            {children}
          </div>
        </SwipeNavContent>
      </div>
    </>
  );
}
