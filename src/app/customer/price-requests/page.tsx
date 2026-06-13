import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { CustomerPriceRequestsPanel } from "@/components/CustomerPriceRequestsPanel";
import { CustomerDesignPaywall } from "@/components/CustomerDesignPaywall";
import { customerDesignAccessForUser } from "@/lib/customer-design-access-server";

export default async function CustomerPriceRequestsPage() {
  const session = await requireSession(["CUSTOMER"]);
  const locale = await getLocale();
  const { allowed: designAccess } = await customerDesignAccessForUser(session!.id);
  if (!designAccess) {
    return <CustomerDesignPaywall locale={locale} />;
  }

  const requests = await prisma.priceRequest.findMany({
    where: { customerId: session!.id },
    include: {
      shop: { select: { id: true, shopName: true } },
      design: { select: { id: true, title: true, imagePath: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">{t(locale, "myPriceQuotes")}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t(locale, "myPriceQuotesHint")}</p>
      </div>
      <CustomerPriceRequestsPanel locale={locale} requests={requests} />
    </div>
  );
}
