import type { Metadata } from "next";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { LegalPage } from "@/components/LegalPage";
import { LEGAL_TERMS_URL, termsSectionsEn } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Terms of Service — LK Studio",
  description: "Terms for using LK Studio tailoring shop SaaS.",
  alternates: { canonical: LEGAL_TERMS_URL },
};

export default async function TermsPage() {
  const locale = await getLocale();
  return (
    <LegalPage
      locale={locale}
      title={t(locale, "termsOfService")}
      lastUpdated="22 June 2026"
      sections={termsSectionsEn}
      kind="terms"
    />
  );
}
