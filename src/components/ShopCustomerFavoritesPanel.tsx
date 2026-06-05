import Image from "next/image";
import { CATEGORIES } from "@/lib/categories";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { ServiceCategory } from "@prisma/client";
import { UserRound } from "lucide-react";

type FavoriteRow = {
  id: string;
  category: ServiceCategory;
  customer: { id: string; name: string; phone: string | null };
  design: { id: string; title: string; imagePath: string };
};

export function ShopCustomerFavoritesPanel({
  locale,
  favorites,
}: {
  locale: Locale;
  favorites: FavoriteRow[];
}) {
  const customerIds = [...new Set(favorites.map((f) => f.customer.id))];

  if (favorites.length === 0) {
    return (
      <p className="card-premium p-8 text-center text-zinc-500">{t(locale, "noCustomerFavoritesYet")}</p>
    );
  }

  return (
    <div className="space-y-4">
      {customerIds.map((customerId) => {
        const rows = favorites.filter((f) => f.customer.id === customerId);
        const customer = rows[0]!.customer;
        const categories = CATEGORIES.filter((c) => rows.some((r) => r.category === c.key));

        return (
          <article key={customerId} className="card-premium overflow-hidden">
            <div className="flex items-center gap-3 border-b border-brand-green/10 bg-brand-cream/50 px-4 py-3">
              <UserRound className="h-5 w-5 text-brand-green" />
              <div>
                <p className="font-bold text-brand-green">{customer.name}</p>
                {customer.phone && <p className="text-xs text-zinc-600">{customer.phone}</p>}
              </div>
            </div>

            <div className="space-y-4 p-4">
              {categories.map((cat) => {
                const items = rows.filter((r) => r.category === cat.key);
                return (
                  <section key={cat.key}>
                    <h3 className="mb-2 text-sm font-bold text-brand-green">
                      {t(locale, cat.labelKey)} · {t(locale, "customerFavoritesFolder")}
                    </h3>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="overflow-hidden rounded-lg border border-brand-green/15 bg-white"
                        >
                          <div className="relative aspect-square">
                            <Image
                              src={item.design.imagePath}
                              alt={item.design.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <p className="truncate px-1.5 py-1 text-[10px] font-medium text-brand-green">
                            {item.design.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </article>
        );
      })}
    </div>
  );
}
