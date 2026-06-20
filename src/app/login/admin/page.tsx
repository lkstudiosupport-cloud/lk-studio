import { getLocale } from "@/lib/locale-server";
import { AuthShell } from "@/components/AuthShell";
import { AdminLoginForm } from "@/components/AdminLoginForm";

export default async function AdminLoginPage() {
  const locale = await getLocale();
  return (
    <AuthShell locale={locale} title="LK Studio Admin">
      <AdminLoginForm />
      <p className="mt-4 text-center text-xs text-zinc-500">
        Catalog upload for Maggam, Embroidery, Blouse, Dress &amp; Children
      </p>
    </AuthShell>
  );
}
