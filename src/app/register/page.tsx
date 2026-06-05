import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "@/components/RegisterForm";

export default async function RegisterPage() {
  const locale = await getLocale();
  return (
    <AuthShell locale={locale} title={t(locale, "register")}>
      <RegisterForm locale={locale} />
    </AuthShell>
  );
}
