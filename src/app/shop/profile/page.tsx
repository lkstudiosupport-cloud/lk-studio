import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { ShopProfileForm } from "@/components/ShopProfileForm";
import { ProfileLogout } from "@/components/ProfileLogout";
import { LegalFooter } from "@/components/LegalFooter";
import { ProfileSubscriptionSection } from "@/components/ProfileSubscriptionSection";
import { Store } from "lucide-react";
import { SHOP_MONTHLY_PRICE_INR } from "@/lib/subscription";
import { isRazorpayConfigured } from "@/lib/razorpay-config";
import { isDemoAccountUser } from "@/lib/demo-accounts";

export default async function ShopProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ subscription?: string }>;
}) {
  const session = await requireSession(["SHOP"]);
  const locale = await getLocale();
  const sp = searchParams ? await searchParams : undefined;
  const [profile, user] = await Promise.all([
    prisma.shopProfile.findUniqueOrThrow({
      where: { id: session!.shopId! },
    }),
    prisma.user.findUnique({
      where: { id: session!.id },
      select: { phone: true, phoneNormalized: true },
    }),
  ]);

  const isDemo =
    isDemoAccountUser(user) || isDemoAccountUser({ phone: profile.phone });

  return (
    <div className="space-y-6">
      <h1 className="page-title flex items-center gap-2">
        <Store className="h-8 w-8 text-brand-green" />
        {t(locale, "shopProfileTitle")}
      </h1>
      <ShopProfileForm locale={locale} profile={profile} />
      {!isDemo && (
        <ProfileSubscriptionSection
          locale={locale}
          status={profile.subscriptionStatus}
          endsAt={profile.subscriptionEndsAt}
          amountInr={SHOP_MONTHLY_PRICE_INR}
          roleLabel={`${profile.shopName} · ${t(locale, "shopSubscriptionPrice", { amount: SHOP_MONTHLY_PRICE_INR })}`}
          role="SHOP"
          autopayEnabled={profile.autopayEnabled}
          razorpayConfigured={isRazorpayConfigured()}
          payeeLabel={profile.shopName}
          defaultOpen={sp?.subscription === "1"}
          accountCreatedAt={profile.createdAt}
        />
      )}
      <div className="mt-4 border-t border-brand-green/10 pt-4 pb-4">
        <ProfileLogout locale={locale} />
      </div>
      <LegalFooter locale={locale} className="pt-2" />
    </div>
  );
}
