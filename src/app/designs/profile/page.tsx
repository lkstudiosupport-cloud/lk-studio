import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { ProfileLogout } from "@/components/ProfileLogout";
import { LegalFooter } from "@/components/LegalFooter";

export default async function DesignsProfilePage() {
  const session = await requireSession(["SHOP", "CUSTOMER"]);
  const locale = await getLocale();
  if (!session) redirect("/designs");

  return (
    <div className="mx-auto max-w-md space-y-6 py-4">
      <div>
        <h1 className="page-title">{t(locale, "profile")}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {session.name}
          {session.role === "SHOP" ? ` · ${t(locale, "shopLogin")}` : ` · ${t(locale, "customerLogin")}`}
        </p>
      </div>
      <ProfileLogout locale={locale} redirectTo="/designs" />
      <LegalFooter locale={locale} />
    </div>
  );
}
