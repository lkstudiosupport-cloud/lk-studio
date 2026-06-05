import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { ContactActions } from "@/components/ContactActions";

export default async function ContactPage() {
  const locale = await getLocale();
  const shop = await prisma.shopProfile.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!shop) {
    return <p className="text-zinc-500">{t(locale, "noData")}</p>;
  }

  return <ContactActions shop={shop} locale={locale} />;
}
