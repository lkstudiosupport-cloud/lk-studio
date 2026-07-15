import Link from "next/link";
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
      <main className="brand-page-bg min-h-dvh">
        <div className="app-main-content mx-auto max-w-2xl space-y-6 py-6">
          <h1 className="page-title">{t(locale, "workPartnerAppTitle")}</h1>
          <ServerRetryPanel locale={locale} />
        </div>
      </main>
    );
  }

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
