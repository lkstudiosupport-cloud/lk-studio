import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { ComingSoonPanel } from "@/components/ComingSoonPanel";

export default async function ShopWorkersPage() {
  const locale = await getLocale();

  return (
    <div className="space-y-4">
      <h1 className="page-title">{t(locale, "workers")}</h1>
      <ComingSoonPanel locale={locale} titleKey="workersComingSoon" hintKey="workersComingSoonHint" />
    </div>
  );
}
