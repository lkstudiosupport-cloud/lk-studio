import type { Metadata } from "next";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { LegalPage } from "@/components/LegalPage";
import { LEGAL_PRIVACY_URL, privacySectionsEn } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Privacy Policy — LK Studio",
  description: "How LK Studio collects and uses phone, photos, location, voice, and payment data.",
  alternates: { canonical: LEGAL_PRIVACY_URL },
};

export default async function PrivacyPage() {
  const locale = await getLocale();
  return (
    <LegalPage
      locale={locale}
      title={t(locale, "privacyPolicy")}
      lastUpdated="8 June 2026"
      sections={privacySectionsEn}
      kind="privacy"
    />
  );
}
