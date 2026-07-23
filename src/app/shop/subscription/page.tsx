import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDemoAccountUser } from "@/lib/demo-accounts";

export default async function ShopSubscriptionPage() {
  const session = await requireSession(["SHOP"]);
  if (!session?.shopId) redirect("/login/shop");

  const [profile, user] = await Promise.all([
    prisma.shopProfile.findUnique({
      where: { id: session.shopId },
      select: { phone: true },
    }),
    prisma.user.findUnique({
      where: { id: session.id },
      select: { phone: true, phoneNormalized: true },
    }),
  ]);

  if (
    isDemoAccountUser(user) ||
    isDemoAccountUser({ phone: profile?.phone })
  ) {
    redirect("/shop/profile");
  }

  redirect("/shop/profile?subscription=1");
}
