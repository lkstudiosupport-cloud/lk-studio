import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import {
  CustomerProfileForm,
  CustomerProfileHeader,
} from "@/components/CustomerProfileForm";
import { ProfileLogout } from "@/components/ProfileLogout";
import { DeleteAccountSection } from "@/components/DeleteAccountSection";
import { LegalFooter } from "@/components/LegalFooter";
import { ProfileSubscriptionSection } from "@/components/ProfileSubscriptionSection";
import { CUSTOMER_MONTHLY_PRICE_INR } from "@/lib/subscription";
import { isRazorpayConfigured } from "@/lib/razorpay-config";

export default async function CustomerProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ subscription?: string }>;
}) {
  const session = await requireSession(["CUSTOMER"]);
  const locale = await getLocale();
  const sp = searchParams ? await searchParams : undefined;
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.id },
    select: {
      name: true,
      phone: true,
      whatsapp: true,
      address: true,
      locationLink: true,
      latitude: true,
      longitude: true,
      profilePhoto: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      autopayEnabled: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <CustomerProfileHeader locale={locale} />
      <CustomerProfileForm locale={locale} user={user} />
      <ProfileSubscriptionSection
        locale={locale}
        status={user.subscriptionStatus}
        endsAt={user.subscriptionEndsAt}
        amountInr={CUSTOMER_MONTHLY_PRICE_INR}
        roleLabel={t(locale, "customerSubscriptionPrice", { amount: CUSTOMER_MONTHLY_PRICE_INR })}
        role="CUSTOMER"
        autopayEnabled={user.autopayEnabled}
        razorpayConfigured={isRazorpayConfigured()}
        payeeLabel={user.name}
        defaultOpen={sp?.subscription === "1"}
        accountCreatedAt={user.createdAt}
      />
      <div className="mt-4 border-t border-brand-green/10 pt-4 pb-4">
        <ProfileLogout locale={locale} />
      </div>
      <LegalFooter locale={locale} className="pt-2" />
      <DeleteAccountSection locale={locale} />
    </div>
  );
}
