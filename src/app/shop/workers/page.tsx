import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { ShopWorkPartnerRequestForm } from "@/components/ShopWorkPartnerRequestForm";
import { ShopWorkPartnerRequestsList } from "@/components/ShopWorkPartnerRequestsList";
import { ServerRetryPanel } from "@/components/ServerRetryPanel";
import { withDbRetry } from "@/lib/safe-db";

export default async function ShopWorkersPage() {
  const session = await requireSession(["SHOP"]);
  const locale = await getLocale();
  const shopId = session!.shopId!;

  let requests: Awaited<ReturnType<typeof loadRequests>> = [];
  try {
    requests = await withDbRetry(() => loadRequests(shopId));
  } catch {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">{t(locale, "workers")}</h1>
        </div>
        <ServerRetryPanel locale={locale} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t(locale, "workers")}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t(locale, "workerPartnerPageHint")}</p>
      </div>
      <ShopWorkPartnerRequestForm locale={locale} />
      <ShopWorkPartnerRequestsList locale={locale} requests={requests} />
    </div>
  );
}

async function loadRequests(shopId: string) {
  return prisma.workerPartnerRequest.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      role: true,
      customRole: true,
      neededFrom: true,
      durationType: true,
      customDays: true,
      notes: true,
      city: true,
      status: true,
      createdAt: true,
    },
  });
}
