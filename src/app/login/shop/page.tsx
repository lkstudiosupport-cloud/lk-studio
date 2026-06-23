import { redirect } from "next/navigation";
import { getLocale } from "@/lib/locale-server";
import { getSession } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";

export default async function ShopLoginPage() {
  const session = await getSession();
  if (session?.role === "SHOP") redirect("/shop");

  const locale = await getLocale();
  return (
    <AuthShell locale={locale} title={t(locale, "shopLogin")}>
      <LoginForm locale={locale} role="SHOP" />
    </AuthShell>
  );
}
