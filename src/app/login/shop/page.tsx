import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";

export default async function ShopLoginPage() {
  const locale = await getLocale();
  return (
    <AuthShell locale={locale} title={t(locale, "shopLogin")}>
      <LoginForm locale={locale} role="SHOP" />
    </AuthShell>
  );
}
