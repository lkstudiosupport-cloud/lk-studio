import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { prisma } from "@/lib/prisma";
import { SHOP_MONTHLY_PRICE_INR, isInTrial, isSubscriptionActive } from "@/lib/subscription";
import { isDemoAccountUser } from "@/lib/demo-accounts";
import { isRazorpayConfigured } from "@/lib/razorpay-config";
import { AutopayOnboardingPage } from "@/components/AutopayOnboardingPage";

/** Shop payment / autopay only — customers are free. */
export default async function RegisterAutopayPage() {
  const session = await requireSession(["SHOP", "CUSTOMER"]);
  if (session!.role === "CUSTOMER") redirect("/customer/designs");

  if (!session!.shopId) redirect("/login/shop");
  const locale = await getLocale();

  const [profile, user] = await Promise.all([
    prisma.shopProfile.findUnique({
      where: { id: session!.shopId },
      select: {
        shopName: true,
        phone: true,
        autopayEnabled: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        createdAt: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: session!.id },
      select: { phone: true, phoneNormalized: true },
    }),
  ]);
  if (!profile) redirect("/login/shop");
  if (isDemoAccountUser(user) || isDemoAccountUser({ phone: profile.phone })) redirect("/shop");
  if (profile.autopayEnabled) redirect("/shop");
  if (
    profile.subscriptionStatus === "ACTIVE" &&
    isSubscriptionActive(
      profile.subscriptionStatus,
      profile.subscriptionEndsAt,
      profile.createdAt
    )
  ) {
    redirect("/shop");
  }

  const inTrial = isInTrial(
    profile.subscriptionStatus,
    profile.subscriptionEndsAt,
    profile.createdAt
  );

  return (
    <AutopayOnboardingPage
      locale={locale}
      role="SHOP"
      amountInr={SHOP_MONTHLY_PRICE_INR}
      razorpayConfigured={isRazorpayConfigured()}
      payeeLabel={profile.shopName}
      homePath="/shop"
      inTrial={inTrial}
    />
  );
}
