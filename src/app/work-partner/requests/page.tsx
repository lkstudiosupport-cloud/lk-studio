import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { WorkPartnerRequestsFeed } from "@/components/WorkPartnerRequestsFeed";
import { listOpenWorkerPartnerRequests } from "@/lib/work-partner-requests";
import { withDbRetry } from "@/lib/safe-db";
import { ServerRetryPanel } from "@/components/ServerRetryPanel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WorkPartnerRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; city?: string }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;

  let requests: Awaited<ReturnType<typeof listOpenWorkerPartnerRequests>> = [];
  try {
    requests = await withDbRetry(() =>
      listOpenWorkerPartnerRequests({
        role: params.role,
        city: params.city,
      })
    );
  } catch (err) {
    console.error("[lk-studio] work partner requests error:", err);
    return (
      <main className="partner-app-frame space-y-4 py-4 sm:space-y-6 sm:py-6 md:py-8">
        <h1 className="page-title">{t(locale, "workPartnerAppTitle")}</h1>
        <ServerRetryPanel locale={locale} />
      </main>
    );
  }

  return (
    <main className="partner-app-frame space-y-4 py-4 sm:space-y-6 sm:py-6 md:py-8">
      <div className="max-w-3xl">
        <h1 className="page-title">{t(locale, "workPartnerAppTitle")}</h1>
        <p className="mt-1 text-sm text-zinc-600 sm:text-base md:mt-2 md:text-lg">
          {t(locale, "workPartnerAppHint")}
        </p>
      </div>
      <WorkPartnerRequestsFeed
        locale={locale}
        requests={requests}
        initialRole={params.role ?? ""}
        initialCity={params.city ?? ""}
      />
    </main>
  );
}
