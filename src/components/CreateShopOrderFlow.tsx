"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, UserRound } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { parseDesignImages } from "@/lib/design-images";
import {
  createShopOrder,
  lookupShopOrderCustomer,
  type ShopOrderCustomerLookup,
} from "@/app/shop/actions";
import { initialActionState } from "@/lib/action-state";
import { CustomerPhoneField } from "@/components/CustomerPhoneField";
import { MultiImageUpload } from "@/components/MultiImageUpload";
import { MeasurementListView } from "@/components/MeasurementListView";
import { ShopManualMeasurementsForm } from "@/components/ShopManualMeasurementsForm";
import { pickMeasurementForType } from "@/lib/measurements";
import type { MeasurementTypeId } from "@/lib/measurements";
import { useSwipeNavBlock } from "@/hooks/useSwipeTabs";

type SavedCustomer = { id: string; name: string; phone: string | null; whatsapp: string | null };

const MAX_FAVORITES = 3;
const MAX_GALLERY = 3;

type MeasurementMode = "view" | "manual";

export function CreateShopOrderFlow({
  locale,
  customers,
}: {
  locale: Locale;
  customers: SavedCustomer[];
}) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [lookupPending, setLookupPending] = useState(false);
  const [customer, setCustomer] = useState<ShopOrderCustomerLookup | null>(null);
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>("view");
  const [personId, setPersonId] = useState("");
  const [viewMeasureType, setViewMeasureType] = useState<MeasurementTypeId>("blouse");
  const [selectedDesigns, setSelectedDesigns] = useState<string[]>([]);
  const [state, formAction, pending] = useActionState(createShopOrder, initialActionState);

  useSwipeNavBlock(true);

  useEffect(() => {
    if (state.ok) {
      router.push("/shop/orders?tab=pending");
      router.refresh();
    }
  }, [state.ok, router]);

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
      setCustomerName(result.customer.name);
      const firstPerson = result.customer.persons[0];
      setPersonId(firstPerson?.id ?? "");
      setMeasurementMode(result.customer.persons.length > 0 ? "view" : "manual");
      setSelectedDesigns([]);
    } finally {
      setLookupPending(false);
    }
  }

  function toggleDesign(id: string) {
    setSelectedDesigns((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_FAVORITES) return prev;
      return [...prev, id];
    });
  }

  const canSubmit =
    measurementMode === "view"
      ? Boolean(personId) || customer!.persons.length === 0
      : true;

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

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-brand-green">
            {t(locale, "customerName")}
          </span>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder={t(locale, "customerNamePlaceholder")}
            className="input-premium w-full"
          />
        </label>

        <CustomerPhoneField
          locale={locale}
          value={phone}
          onChange={setPhone}
          onNamePicked={setCustomerName}
        />

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
          disabled={lookupPending || !phone.trim() || !customerName.trim()}
          onClick={() => void findCustomer()}
          className="btn-primary w-full py-3 disabled:opacity-60"
        >
          {lookupPending ? "..." : t(locale, "findCustomer")}
        </button>
      </div>
    );
  }

  const selectedPerson = customer.persons.find((p) => p.id === personId);

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
            {customerName || customer.name}
          </p>
          {(customer.phone || customer.whatsapp) && (
            <p className="mt-1 text-sm text-zinc-600">{customer.phone || customer.whatsapp}</p>
          )}
        </div>

        <form action={formAction} encType="multipart/form-data" className="space-y-5">
          <input type="hidden" name="customerId" value={customer.id} />
          <input type="hidden" name="measurementMode" value={measurementMode} />

          <section className="space-y-3">
            <h2 className="text-sm font-bold text-brand-green">{t(locale, "measurements")}</h2>

            {customer.persons.length > 0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMeasurementMode("view")}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold ${
                    measurementMode === "view"
                      ? "bg-brand-green text-brand-gold"
                      : "bg-white text-brand-green ring-1 ring-brand-green/15"
                  }`}
                >
                  {t(locale, "viewCustomerMeasurements")}
                </button>
                <button
                  type="button"
                  onClick={() => setMeasurementMode("manual")}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold ${
                    measurementMode === "manual"
                      ? "bg-brand-green text-brand-gold"
                      : "bg-white text-brand-green ring-1 ring-brand-green/15"
                  }`}
                >
                  {t(locale, "shopManualMeasurements")}
                </button>
              </div>
            )}

            {measurementMode === "view" && customer.persons.length > 0 ? (
              <div className="space-y-3 rounded-xl border border-brand-green/10 bg-white p-3">
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

                {selectedPerson && (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {(["blouse", "dress", "child"] as MeasurementTypeId[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setViewMeasureType(type)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            viewMeasureType === type
                              ? "bg-brand-green text-brand-gold"
                              : "bg-brand-cream text-brand-green"
                          }`}
                        >
                          {t(locale, `measurementType_${type}`)}
                        </button>
                      ))}
                    </div>
                    <MeasurementListView
                      locale={locale}
                      measurementType={viewMeasureType}
                      measurement={pickMeasurementForType(selectedPerson.measurements, viewMeasureType)}
                      compact
                      showDiagram={false}
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-brand-green/10 bg-white p-3">
                <p className="mb-3 text-xs text-zinc-500">{t(locale, "shopManualMeasurementsHint")}</p>
                <ShopManualMeasurementsForm locale={locale} defaultPersonName={customerName} />
              </div>
            )}
          </section>

          <section>
            <span className="mb-2 block text-sm font-semibold text-brand-green">
              {t(locale, "referencePhotos")}
            </span>

            {customer.favorites.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs text-zinc-500">{t(locale, "pickCustomerFavorites")}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {customer.favorites.map((fav) => {
                    const checked = selectedDesigns.includes(fav.designId);
                    const thumb = parseDesignImages(fav.design.imagesJson, fav.design.imagePath)[0];
                    return (
                      <label
                        key={fav.designId}
                        className={`cursor-pointer overflow-hidden rounded-xl border-2 ${
                          checked ? "border-brand-gold" : "border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="designId"
                          value={fav.designId}
                          checked={checked}
                          onChange={() => toggleDesign(fav.designId)}
                          className="sr-only"
                        />
                        <div className="relative aspect-[3/4] bg-zinc-100">
                          <Image
                            src={thumb}
                            alt={fav.design.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <p className="truncate px-2 py-1.5 text-center text-xs font-medium text-brand-green">
                          {fav.design.title}
                        </p>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <MultiImageUpload
              namePrefix="orderImg"
              label={t(locale, "photosFromGallery")}
              locale={locale}
              max={MAX_GALLERY}
            />
          </section>

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

          <button
            type="submit"
            disabled={pending || (measurementMode === "view" && !personId)}
            className="btn-primary w-full py-3 disabled:opacity-60"
          >
            {pending ? "..." : t(locale, "saveOrderPending")}
          </button>
        </form>
      </div>
    </div>
  );
}
