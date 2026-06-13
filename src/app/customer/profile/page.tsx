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

export default async function CustomerProfilePage() {
  const session = await requireSession(["CUSTOMER"]);
  const locale = await getLocale();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.id },
    select: {
      name: true,
      phone: true,
      whatsapp: true,
      address: true,
      locationLink: true,
      latitude: true,
      longitude: true,
      profilePhoto: true,
    },
  });

  return (
    <div className="space-y-6">
      <CustomerProfileHeader locale={locale} />
      <CustomerProfileForm locale={locale} user={user} />
      <div className="mt-4 border-t border-brand-green/10 pt-4 pb-4">
        <ProfileLogout locale={locale} />
      </div>
      <LegalFooter locale={locale} className="pt-2" />
      <DeleteAccountSection locale={locale} />
    </div>
  );
}
