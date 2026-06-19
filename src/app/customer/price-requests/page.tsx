import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { CustomerPriceRequestsPanel } from "@/components/CustomerPriceRequestsPanel";
import { CustomerPriceQuoteSection } from "@/components/CustomerPriceQuoteSection";

export default async function CustomerPriceRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ shopId?: string }>;
}) {
  const session = await requireSession(["CUSTOMER"]);
  const locale = await getLocale();
  const { shopId } = await searchParams;

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
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t(locale, "myPriceQuotes")}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t(locale, "myPriceQuotesHint")}</p>
      </div>

      <CustomerPriceQuoteSection
        locale={locale}
        customerId={session!.id}
        shopIdParam={shopId}
      />

      {requests.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-brand-green">{t(locale, "myPriceQuotesHistory")}</h2>
          <CustomerPriceRequestsPanel locale={locale} requests={requests} />
        </section>
      )}
    </div>
  );
}
