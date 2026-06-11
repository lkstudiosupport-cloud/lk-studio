"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, UserRound } from "lucide-react";
import type { Design, ServiceCategory } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/categories";
import { parseDesignImages } from "@/lib/design-images";
import {
  createShopOrder,
  lookupShopOrderCustomer,
  type ShopOrderCustomerLookup,
} from "@/app/shop/actions";
import { initialActionState } from "@/lib/action-state";
import { CustomerPhoneField } from "@/components/CustomerPhoneField";
import { FormPhotoAdd } from "@/components/FormPhotoAdd";
import { MultiImageUpload } from "@/components/MultiImageUpload";
import { MeasurementListView } from "@/components/MeasurementListView";
import { WorkTypeSelect } from "@/components/WorkTypeSelect";
import { measurementTypeForCategory, pickMeasurementForType } from "@/lib/measurements";
import { useSwipeNavBlock } from "@/hooks/useSwipeTabs";

type SavedCustomer = { id: string; name: string; phone: string | null; whatsapp: string | null };
type DesignPick = Pick<Design, "id" | "title" | "category" | "imagePath" | "imagesJson">;

const MAX_DESIGNS = 3;
const MAX_GALLERY = 3;

export function CreateShopOrderFlow({
  locale,
  customers,
  designs,
}: {
  locale: Locale;
  customers: SavedCustomer[];
  designs: DesignPick[];
}) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [lookupPending, setLookupPending] = useState(false);
  const [customer, setCustomer] = useState<ShopOrderCustomerLookup | null>(null);
  const [category, setCategory] = useState<ServiceCategory>("MAGGAM");
  const [personId, setPersonId] = useState("");
  const [selectedDesigns, setSelectedDesigns] = useState<string[]>([]);
  const [state, formAction, pending] = useActionState(createShopOrder, initialActionState);

  useSwipeNavBlock(true);

  useEffect(() => {
    if (state.ok) {
      router.push("/shop/orders?tab=pending");
      router.refresh();
    }
  }, [state.ok, router]);

  const categoryDesigns = useMemo(
    () => designs.filter((d) => d.category === category),
    [designs, category]
  );

  const measureType = measurementTypeForCategory(category);

  async function findCustomer(byId?: string) {
    setLookupError("");
    setLookupPending(true);
    try {
      const result = await lookupShopOrderCustomer({
        customerId: byId,
        phone: byId ? undefined : phone,
      });
      if (!result.ok) {
        setLookupError(t(locale, result.error));
        setCustomer(null);
        return;
      }
      setCustomer(result.customer);
      setPersonId(result.customer.persons[0]?.id ?? "");
      setSelectedDesigns([]);
    } finally {
      setLookupPending(false);
    }
  }

  function toggleDesign(id: string) {
    setSelectedDesigns((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_DESIGNS) return prev;
      return [...prev, id];
    });
  }

  if (!customer) {
    return (
      <div className="card-premium min-w-0 space-y-5 p-4 sm:p-5">
        <Link
          href="/shop/orders"
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-green"
        >
          <ArrowLeft className="h-4 w-4" />
          {t(locale, "orders")}
        </Link>

        <h1 className="text-xl font-bold text-brand-green">{t(locale, "newShopOrder")}</h1>
        <p className="text-sm text-zinc-600">{t(locale, "newShopOrderHint")}</p>

        <CustomerPhoneField locale={locale} value={phone} onChange={setPhone} />

        {customers.length > 0 && (
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-zinc-600">
              {t(locale, "pickSavedCustomer")}
            </span>
            <select
              defaultValue=""
              onChange={(e) => {
                const id = e.target.value;
                if (id) void findCustomer(id);
                e.target.value = "";
              }}
              className="input-premium w-full text-sm"
            >
              <option value="">{t(locale, "selectCustomerOptional")}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.phone || c.whatsapp ? ` · ${c.phone || c.whatsapp}` : ""}
                </option>
              ))}
            </select>
          </label>
        )}

        {lookupError && <p className="text-sm text-red-600">{lookupError}</p>}

        <button
          type="button"
          disabled={lookupPending || !phone.trim()}
          onClick={() => void findCustomer()}
          className="btn-primary w-full py-3 disabled:opacity-60"
        >
          {lookupPending ? "..." : t(locale, "findCustomer")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="card-premium min-w-0 space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setCustomer(null);
              setLookupError("");
            }}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-green"
          >
            <ArrowLeft className="h-4 w-4" />
            {t(locale, "changeCustomer")}
          </button>
          <Link href="/shop/orders" className="text-sm text-brand-green-soft underline-offset-2 hover:underline">
            {t(locale, "orders")}
          </Link>
        </div>

        <div className="rounded-xl border border-brand-green/15 bg-brand-cream/60 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-brand-green">
            <UserRound className="h-4 w-4" />
            {customer.name}
          </p>
          {(customer.phone || customer.whatsapp) && (
            <p className="mt-1 text-sm text-zinc-600">{customer.phone || customer.whatsapp}</p>
          )}
        </div>

        {customer.persons.length === 0 ? (
          <p className="rounded-xl bg-amber-50 px-3 py-3 text-sm text-amber-900">
            {t(locale, "addPersonFirst")}
          </p>
        ) : (
        <form action={formAction} encType="multipart/form-data" className="space-y-5">
          <input type="hidden" name="customerId" value={customer.id} />

          <div>
            <span className="mb-2 block text-sm font-semibold text-brand-green">
              {t(locale, "orderCategory")}
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => {
                    setCategory(c.key);
                    setSelectedDesigns([]);
                  }}
                  className={`rounded-xl px-2 py-2.5 text-xs font-semibold ${
                    category === c.key ? "ring-2 ring-brand-gold ring-offset-1 " + c.color : c.color + " opacity-80"
                  }`}
                >
                  {t(locale, c.labelKey)}
                </button>
              ))}
            </div>
            <input type="hidden" name="category" value={category} />
          </div>

          <WorkTypeSelect locale={locale} defaultValue="STITCHING" />

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-brand-green">
              {t(locale, "selectPersonForOrder")}
            </span>
            <select
              name="personId"
              required
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className="input-premium w-full"
            >
              <option value="">{t(locale, "person")}</option>
              {customer.persons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.relation ? ` (${p.relation})` : ""}
                </option>
              ))}
            </select>
          </label>

          {personId && (
            <div className="rounded-xl border border-brand-green/10 bg-white p-3">
              {customer.persons
                .filter((p) => p.id === personId)
                .map((p) => (
                  <MeasurementListView
                    key={p.id}
                    locale={locale}
                    measurementType={measureType}
                    measurement={pickMeasurementForType(p.measurements, measureType)}
                    compact
                    showDiagram={false}
                  />
                ))}
            </div>
          )}

          <div>
            <span className="mb-1 block text-sm font-semibold text-brand-green">
              {t(locale, "uploadClothPhoto")}
            </span>
            <p className="mb-2 text-xs text-zinc-500">{t(locale, "clothPhotoHint")}</p>
            <FormPhotoAdd locale={locale} name="clothImage" />
          </div>

          <div>
            <span className="mb-2 block text-sm font-semibold text-brand-green">
              {t(locale, "pickShopDesigns")}
            </span>
            {categoryDesigns.length === 0 ? (
              <p className="text-sm text-zinc-500">{t(locale, "noDesignsInCategory")}</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categoryDesigns.map((d) => {
                  const checked = selectedDesigns.includes(d.id);
                  const thumb = parseDesignImages(d.imagesJson, d.imagePath)[0];
                  return (
                    <label
                      key={d.id}
                      className={`cursor-pointer overflow-hidden rounded-xl border-2 ${
                        checked ? "border-brand-gold" : "border-transparent"
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="designId"
                        value={d.id}
                        checked={checked}
                        onChange={() => toggleDesign(d.id)}
                        className="sr-only"
                      />
                      <div className="relative aspect-[3/4] bg-zinc-100">
                        <Image src={thumb} alt={d.title} fill className="object-cover" unoptimized />
                      </div>
                      <p className="truncate px-2 py-1.5 text-center text-xs font-medium text-brand-green">
                        {d.title}
                      </p>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <MultiImageUpload
            namePrefix="orderImg"
            label={t(locale, "photosFromGallery")}
            locale={locale}
            max={MAX_GALLERY}
          />

          <textarea
            name="notes"
            rows={2}
            placeholder={t(locale, "clothHandoverNotes")}
            className="input-premium w-full text-sm"
          />

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state.ok && (
            <p className="flex items-center gap-1 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {t(locale, "orderPlaced")}
            </p>
          )}

          <button type="submit" disabled={pending || !personId} className="btn-primary w-full py-3">
            {pending ? "..." : t(locale, "saveOrderPending")}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
