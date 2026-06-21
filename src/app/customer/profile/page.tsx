import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import {
  CustomerProfileForm,
  CustomerProfileHeader,
} from "@/components/CustomerProfileForm";
import { ProfileLogout } from "@/components/ProfileLogout";
import { DeleteAccountSection } from "@/components/DeleteAccountSection";
import { LegalFooter } from "@/components/LegalFooter";
import { LayoutDashboard, ChevronRight } from "lucide-react";

export default async function CustomerProfilePage() {
  const session = await requireSession(["CUSTOMER"]);
  const locale = await getLocale();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.id },
    select: {
      name: true,
      phone: true,
      whatsapp: true,
      profilePhoto: true,
    },
  });

  return (
    <div className="space-y-6">
      <CustomerProfileHeader locale={locale} />

      <Link
        href="/customer"
        className="card-premium flex items-center gap-4 p-4 transition hover:shadow-lg active:scale-[0.99]"
      >
        <LayoutDashboard className="h-10 w-10 text-brand-green" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-brand-green">{t(locale, "dashboard")}</p>
          <p className="text-sm text-zinc-600">{t(locale, "customerDashboardHint")}</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-brand-gold-dark" />
      </Link>

      <CustomerProfileForm locale={locale} user={user} />
      <div className="mt-4 border-t border-brand-green/10 pt-4 pb-4">
        <ProfileLogout locale={locale} />
      </div>
      <LegalFooter locale={locale} className="pt-2" />
      <DeleteAccountSection locale={locale} aboveBottomNav />
    </div>
  );
}
