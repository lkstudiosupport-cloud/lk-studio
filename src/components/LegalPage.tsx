import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { LegalFooter } from "@/components/LegalFooter";
import type { LegalSection } from "@/lib/legal-content";
import {
  privacySectionTitlesHi,
  privacySectionTitlesTe,
  termsSectionTitlesHi,
  termsSectionTitlesTe,
} from "@/lib/legal-content";

type Props = {
  locale: Locale;
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
  kind: "privacy" | "terms";
};

function sectionTitle(locale: Locale, kind: "privacy" | "terms", enTitle: string): string {
  if (locale === "hi") {
    const map = kind === "privacy" ? privacySectionTitlesHi : termsSectionTitlesHi;
    return map[enTitle] ?? enTitle;
  }
  if (locale === "te") {
    const map = kind === "privacy" ? privacySectionTitlesTe : termsSectionTitlesTe;
    return map[enTitle] ?? enTitle;
  }
  return enTitle;
}

export function LegalPage({ locale, title, lastUpdated, sections, kind }: Props) {
  return (
    <main className="brand-page-bg app-page-shell mx-auto min-h-dvh w-full max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-brand-green-soft hover:underline">
          ← {t(locale, "backHome")}
        </Link>
      </div>

      <article className="card-premium space-y-6 p-6 sm:p-8">
        <header>
          <h1 className="text-2xl font-bold text-brand-green">{title}</h1>
          <p className="mt-2 text-sm text-brand-green-soft">
            {t(locale, "legalLastUpdated")}: {lastUpdated}
          </p>
          {locale !== "en" && (
            <p className="mt-2 text-xs text-zinc-500">{t(locale, "legalEnglishFallback")}</p>
          )}
        </header>

        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-brand-green">
              {sectionTitle(locale, kind, section.title)}
            </h2>
            <div className="mt-2 space-y-2 text-sm leading-relaxed text-zinc-700">
              {section.body.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </article>

      <LegalFooter locale={locale} className="mt-8 pb-8" />
    </main>
  );
}
