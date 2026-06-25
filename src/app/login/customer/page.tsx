import { redirect } from "next/navigation";
import { getLocale } from "@/lib/locale-server";
import { getSessionFromCookie } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";

export default async function CustomerLoginPage() {
  const session = await getSessionFromCookie();
  if (session?.role === "CUSTOMER") redirect("/customer/designs");

  const locale = await getLocale();
  return (
    <AuthShell locale={locale} title={t(locale, "customerLogin")}>
      <LoginForm locale={locale} role="CUSTOMER" />
    </AuthShell>
  );
}
