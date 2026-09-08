import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "@/components/RegisterForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const partnerOnly = params.app === "partner";

  return (
    <AuthShell
      locale={locale}
      title={partnerOnly ? t(locale, "partnerRegisterTitle") : t(locale, "register")}
    >
      <RegisterForm locale={locale} partnerOnly={partnerOnly} />
    </AuthShell>
  );
}
