import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { MeasurementForm } from "@/components/MeasurementForm";
import { AddPersonForm } from "@/components/AddPersonForm";
import Link from "next/link";

export default async function PersonsPage() {
  const session = await requireSession(["CUSTOMER"]);
  const locale = await getLocale();
  const persons = await prisma.person.findMany({
    where: { customerId: session!.id },
    include: { measurements: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="page-title">{t(locale, "persons")}</h1>
      <p className="text-sm text-zinc-600">{t(locale, "personsHint")}</p>

      <AddPersonForm locale={locale} />

      <div className="space-y-5">
        {persons.map((p) => (
          <MeasurementForm
            key={p.id}
            personId={p.id}
            personName={p.name}
            relation={p.relation}
            locale={locale}
            measurements={p.measurements}
            footer={
              <Link
                href="/customer/shops"
                className="btn-primary inline-flex w-full justify-center sm:w-auto"
              >
                {t(locale, "browseShops")} →
              </Link>
            }
          />
        ))}
      </div>

      {persons.length === 0 && (
        <p className="card-premium p-6 text-center text-zinc-500">{t(locale, "noData")}</p>
      )}
    </div>
  );
}
