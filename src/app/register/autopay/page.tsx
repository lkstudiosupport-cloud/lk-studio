import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { prisma } from "@/lib/prisma";
import {
  CUSTOMER_MONTHLY_PRICE_INR,
  SHOP_MONTHLY_PRICE_INR,
} from "@/lib/subscription";
import { isRazorpayConfigured } from "@/lib/razorpay-config";
import { AutopayOnboardingPage } from "@/components/AutopayOnboardingPage";

export default async function RegisterAutopayPage() {
  const session = await requireSession(["SHOP", "CUSTOMER"]);
  const locale = await getLocale();

  if (session!.role === "SHOP") {
    if (!session!.shopId) redirect("/login/shop");
    const profile = await prisma.shopProfile.findUnique({
      where: { id: session!.shopId },
      select: { shopName: true, autopayEnabled: true },
    });
    if (!profile) redirect("/login/shop");
    if (profile.autopayEnabled) redirect("/shop");

    return (
      <AutopayOnboardingPage
        locale={locale}
        role="SHOP"
        amountInr={SHOP_MONTHLY_PRICE_INR}
        razorpayConfigured={isRazorpayConfigured()}
        payeeLabel={profile.shopName}
        homePath="/shop"
      />
    );
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.id },
    select: { name: true, autopayEnabled: true },
  });
  if (user.autopayEnabled) redirect("/customer");

  return (
    <AutopayOnboardingPage
      locale={locale}
      role="CUSTOMER"
      amountInr={CUSTOMER_MONTHLY_PRICE_INR}
      razorpayConfigured={isRazorpayConfigured()}
      payeeLabel={user.name}
      homePath="/customer"
    />
  );
}
