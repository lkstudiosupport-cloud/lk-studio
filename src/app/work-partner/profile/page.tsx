import { redirect } from "next/navigation";
import Link from "next/link";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { ProfileLogout } from "@/components/ProfileLogout";
import { normalizePhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

export default async function WorkPartnerProfilePage() {
  const session = await requireSession(["PARTNER"]);
  if (!session) redirect("/login/partner");

  const locale = await getLocale();
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { name: true, phone: true, phoneNormalized: true, city: true, address: true },
  });

  const phoneNorm = user?.phoneNormalized || (user?.phone ? normalizePhone(user.phone) : null);
  const partnerProfile = phoneNorm
    ? await prisma.workPartnerProfile.findUnique({
        where: { phoneNormalized: phoneNorm },
        select: {
          name: true,
          phone: true,
          city: true,
          address: true,
          yearsExperience: true,
          ratingSum: true,
          ratingCount: true,
        },
      })
    : null;

  const rating =
    partnerProfile && partnerProfile.ratingCount > 0
      ? (partnerProfile.ratingSum / partnerProfile.ratingCount).toFixed(1)
      : null;

  return (
    <main className="partner-app-frame space-y-6 py-6 sm:py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="page-title">{t(locale, "profile")}</h1>
        <Link href="/work-partner/requests" className="text-sm font-semibold text-brand-green underline">
          {t(locale, "workPartnerAppTitle")}
        </Link>
      </div>

      <div className="card-premium space-y-3 p-4 sm:p-6">
        <p className="text-lg font-bold text-brand-green">
          {partnerProfile?.name || user?.name || "—"}
        </p>
        <p className="text-sm text-zinc-700">
          {t(locale, "phone")}: {partnerProfile?.phone || user?.phone || "—"}
        </p>
        {(partnerProfile?.city || user?.city) && (
          <p className="text-sm text-zinc-700">
            {t(locale, "city")}: {partnerProfile?.city || user?.city}
          </p>
        )}
        {(partnerProfile?.address || user?.address) && (
          <p className="text-sm text-zinc-700">
            {t(locale, "address")}: {partnerProfile?.address || user?.address}
          </p>
        )}
        {partnerProfile && (
          <p className="text-sm text-zinc-700">
            {t(locale, "workPartnerYearsExperience")}: {partnerProfile.yearsExperience}
          </p>
        )}
        {rating && (
          <p className="text-sm text-zinc-700">
            {t(locale, "workPartnerRatingLabel")}: {rating} ({partnerProfile?.ratingCount})
          </p>
        )}
      </div>

      <ProfileLogout locale={locale} redirectTo="/work-partner" />
    </main>
  );
}
