import Link from "next/link";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { WorkPartnerRequestsFeed } from "@/components/WorkPartnerRequestsFeed";
import { parseWorkerPartnerRole } from "@/lib/work-partner-roles";
import { normalizeCity } from "@/lib/cities";

export default async function WorkPartnerRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; city?: string }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const role = parseWorkerPartnerRole(params.role);
  const city = normalizeCity(params.city);

  const requests = await prisma.workerPartnerRequest.findMany({
    where: {
      status: "OPEN",
      ...(role ? { role } : {}),
      ...(city ? { city } : {}),
    },
    include: {
      shop: {
        select: {
          shopName: true,
          shopCode: true,
          city: true,
          address: true,
          phone: true,
          whatsapp: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="brand-page-bg min-h-dvh">
      <div className="app-main-content mx-auto max-w-2xl space-y-6 py-6">
        <div>
          <Link href="/" className="text-sm text-brand-green underline">
            ← {t(locale, "backHome")}
          </Link>
          <h1 className="page-title mt-2">{t(locale, "workPartnerAppTitle")}</h1>
          <p className="mt-1 text-sm text-zinc-600">{t(locale, "workPartnerAppHint")}</p>
        </div>
        <WorkPartnerRequestsFeed
          locale={locale}
          requests={requests}
          initialRole={params.role ?? ""}
          initialCity={params.city ?? ""}
        />
      </div>
    </main>
  );
}
