import { redirect } from "next/navigation";
import { NavShell } from "@/components/NavShell";
import { SwipeNavContent } from "@/components/SwipeNavContent";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { SessionRefresh } from "@/components/SessionRefresh";
import { AutopayGuard } from "@/components/AutopayGuard";
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
    { href: "/customer", label: t(locale, "dashboard") },
    { href: "/customer/shops", label: t(locale, "browseShops") },
    { href: "/customer/price-requests", label: t(locale, "myPriceQuotes") },
    { href: "/customer/persons", label: t(locale, "persons") },
    { href: "/customer/bills", label: t(locale, "myBills") },
  ];

  return (
    <SubscriptionGate>
      <SessionRefresh />
      <AutopayGuard autopayEnabled={user?.autopayEnabled ?? false} setupPath="/register/autopay">
        <div className="min-h-dvh brand-page-bg">
          <NavShell
            locale={locale}
            title={t(locale, "appName")}
            profileHref="/customer/profile"
            profileLabel={t(locale, "customerProfileTitle")}
            profilePhoto={user?.profilePhoto}
            links={navLinks}
          />
          <SwipeNavContent navHrefs={navLinks.map((l) => l.href)}>
            <div className="app-main-content mx-auto max-w-5xl py-4 sm:py-6">{children}</div>
          </SwipeNavContent>
        </div>
      </AutopayGuard>
    </SubscriptionGate>
  );
}
