"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, UserRound } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { designImageSrc } from "@/lib/design-images";
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
import { pickMeasurementForType, MEASUREMENT_TYPES, type MeasurementTypeId } from "@/lib/measurements";
import {
  buildShopMeasurementsJson,
  captureMeasurementSnapshot,
  shopMeasurementsToRecord,
  type LastMeasurementSnapshot,
} from "@/lib/shop-measurements";
import { useSwipeNavBlock } from "@/hooks/useSwipeTabs";
import { ShopOrderGuide, ShopOrderGuideHelpButton } from "@/components/ShopOrderGuide";
import {
  buildLookupGuideSteps,
  buildOrderGuideSteps,
  hasSeenShopOrderGuide,
} from "@/lib/shop-order-guide";

type SavedCustomer = { id: string; name: string; phone: string | null; whatsapp: string | null };

const MAX_FAVORITES = 3;
const MAX_GALLERY = 3;

type MeasurementMode = "view" | "manual";
type MeasurementReuseChoice = "same" | "different";

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
  const [customerIsRegistered, setCustomerIsRegistered] = useState(true);
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>("view");
  const [personId, setPersonId] = useState("");
  const [viewMeasureType, setViewMeasureType] = useState<MeasurementTypeId>("blouse");
  const [selectedDesigns, setSelectedDesigns] = useState<string[]>([]);
  const [formKey, setFormKey] = useState(0);
  const [ordersSavedCount, setOrdersSavedCount] = useState(0);
  const [showPostSave, setShowPostSave] = useState(false);
  const [lastMeasurementSnapshot, setLastMeasurementSnapshot] =
    useState<LastMeasurementSnapshot | null>(null);
  const [measurementReuseChoice, setMeasurementReuseChoice] =
    useState<MeasurementReuseChoice>("different");
  const pendingSnapshotRef = useRef<LastMeasurementSnapshot | null>(null);
  const [state, formAction, pending] = useActionState(createShopOrder, initialActionState);
  const [guideOpen, setGuideOpen] = useState(false);

  useSwipeNavBlock(true);

  useEffect(() => {
    if (!hasSeenShopOrderGuide()) setGuideOpen(true);
  }, []);

  const guideSteps = useMemo(() => {
    if (showPostSave) return [];
    if (!customer) return buildLookupGuideSteps();
    return buildOrderGuideSteps({
      hasPersons: customer.persons.length > 0,
      hasFavorites: customer.favorites.length > 0,
    });
  }, [customer, showPostSave]);

  useEffect(() => {
    if (guideSteps.length === 0) setGuideOpen(false);
  }, [guideSteps.length]);

  useEffect(() => {
    if (state.ok) {
      if (pendingSnapshotRef.current) {
        setLastMeasurementSnapshot(pendingSnapshotRef.current);
      }
      setOrdersSavedCount((n) => n + 1);
      setShowPostSave(true);
    }
  }, [state.ok]);

  function resetOrderForm() {
    setSelectedDesigns([]);
    setFormKey((k) => k + 1);
    setShowPostSave(false);
    setMeasurementReuseChoice("same");
  }

  function handleAddAnotherOrder() {
    resetOrderForm();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function applySnapshotToForm(formData: FormData, snap: LastMeasurementSnapshot) {
    if (snap.mode === "view") {
      formData.set("measurementMode", "view");
      formData.set("personId", snap.personId);
      formData.delete("shopMeasurementsJson");
      return;
    }
    formData.set("measurementMode", "manual");
    formData.delete("personId");
    formData.set("shopMeasurementsJson", buildShopMeasurementsJson(snap.data.type, snap.data.fields, snap.data.personName));
  }

  async function submitOrder(formData: FormData) {
    if (measurementReuseChoice === "same" && lastMeasurementSnapshot) {
      applySnapshotToForm(formData, lastMeasurementSnapshot);
    }
    pendingSnapshotRef.current = captureMeasurementSnapshot(
      formData,
      measurementMode,
      personId,
      viewMeasureType
    );
    return formAction(formData);
  }

  function applySnapshotToUi(snap: LastMeasurementSnapshot) {
    if (snap.mode === "view") {
      setMeasurementMode("view");
      setPersonId(snap.personId);
      setViewMeasureType(snap.viewMeasureType);
      return;
    }
    setMeasurementMode("manual");
  }

  function handleViewOrders() {
    router.push("/shop/orders?tab=pending");
    router.refresh();
  }

  async function continueToOrder(byId?: string) {
    setLookupError("");
    setLookupPending(true);
    try {
      const result = await lookupShopOrderCustomer({
        customerId: byId,
        phone: byId ? undefined : phone,
        name: customerName,
      });
      if (!result.ok) {
        setLookupError(t(locale, result.error));
        setCustomer(null);
        return;
      }
      setCustomer(result.customer);
      setCustomerIsRegistered(result.isRegistered);
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

  if (!customer) {
    return (
      <>
        <ShopOrderGuide locale={locale} steps={guideSteps} open={guideOpen} onClose={() => setGuideOpen(false)} />
        <div className="card-premium min-w-0 space-y-5 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href="/shop/orders"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-green"
            >
              <ArrowLeft className="h-4 w-4" />
              {t(locale, "orders")}
            </Link>
            <ShopOrderGuideHelpButton locale={locale} onClick={() => setGuideOpen(true)} />
          </div>

          <h1 className="text-xl font-bold text-brand-green">{t(locale, "newShopOrder")}</h1>
          <p className="text-sm text-zinc-600">{t(locale, "newShopOrderHint")}</p>

          <label className="block" data-guide-target="guide-customer-name">
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

        <div data-guide-target="guide-customer-phone">
          <CustomerPhoneField
            locale={locale}
            value={phone}
            onChange={setPhone}
            onNamePicked={setCustomerName}
          />
        </div>

        {customers.length > 0 && (
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-zinc-600">
              {t(locale, "pickSavedCustomer")}
            </span>
            <select
              defaultValue=""
              onChange={(e) => {
                const id = e.target.value;
                if (id) void continueToOrder(id);
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
          onClick={() => void continueToOrder()}
          className="btn-primary w-full py-3 disabled:opacity-60"
          data-guide-target="guide-find-customer"
        >
          {lookupPending ? "..." : t(locale, "continueNewOrder")}
        </button>
        </div>
      </>
    );
  }

  const selectedPerson = customer.persons.find((p) => p.id === personId);
  const reuseSameMeasurements =
    lastMeasurementSnapshot != null && measurementReuseChoice === "same";
  const manualPrefill =
    lastMeasurementSnapshot?.mode === "manual" ? lastMeasurementSnapshot.data : undefined;

  function renderSnapshotSummary(snap: LastMeasurementSnapshot) {
    if (snap.mode === "view") {
      const person = customer.persons.find((p) => p.id === snap.personId);
      const measurement = person
        ? pickMeasurementForType(person.measurements, snap.viewMeasureType)
        : null;
      return (
        <div className="space-y-2 rounded-xl border border-brand-green/10 bg-brand-cream/40 p-3">
          <p className="text-sm font-semibold text-brand-green">
            {person?.name ?? t(locale, "person")} · {t(locale, `measurementType_${snap.viewMeasureType}`)}
          </p>
          <MeasurementListView
            locale={locale}
            measurementType={snap.viewMeasureType}
            measurement={measurement}
            compact
            showDiagram={false}
          />
        </div>
      );
    }
    return (
      <div className="space-y-2 rounded-xl border border-brand-green/10 bg-brand-cream/40 p-3">
        {snap.data.personName && (
          <p className="text-sm font-semibold text-brand-green">{snap.data.personName}</p>
        )}
        <MeasurementListView
          locale={locale}
          measurementType={snap.data.type}
          measurement={shopMeasurementsToRecord(snap.data)}
          compact
          showDiagram={false}
        />
      </div>
    );
  }

  return (
    <>
      <ShopOrderGuide locale={locale} steps={guideSteps} open={guideOpen} onClose={() => setGuideOpen(false)} />
      <div className="space-y-5">
        <div className="card-premium min-w-0 space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
            type="button"
            onClick={() => {
              setCustomer(null);
              setCustomerIsRegistered(true);
              setLookupError("");
              setOrdersSavedCount(0);
              setShowPostSave(false);
              setLastMeasurementSnapshot(null);
              setMeasurementReuseChoice("different");
              setFormKey((k) => k + 1);
            }}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-green"
          >
            <ArrowLeft className="h-4 w-4" />
            {t(locale, "changeCustomer")}
          </button>
          <div className="flex items-center gap-2">
            <ShopOrderGuideHelpButton locale={locale} onClick={() => setGuideOpen(true)} />
            <Link href="/shop/orders" className="text-sm text-brand-green-soft underline-offset-2 hover:underline">
              {t(locale, "orders")}
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-brand-green/15 bg-brand-cream/60 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-brand-green">
            <UserRound className="h-4 w-4" />
            {customerName || customer.name}
          </p>
          {(customer.phone || customer.whatsapp) && (
            <p className="mt-1 text-sm text-zinc-600">{customer.phone || customer.whatsapp}</p>
          )}
          {!customerIsRegistered && (
            <p className="mt-2 text-xs font-medium text-amber-800">{t(locale, "newCustomerWalkInHint")}</p>
          )}
          {customerIsRegistered && customer.persons.length > 0 && (
            <p className="mt-2 text-xs font-medium text-emerald-800">{t(locale, "registeredCustomerFoundHint")}</p>
          )}
          {ordersSavedCount > 0 && (
            <p className="mt-2 text-xs font-medium text-brand-gold-dark">
              {t(locale, "ordersSavedForCustomer", { n: ordersSavedCount })}
            </p>
          )}
        </div>

        {showPostSave ? (
          <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="flex items-center gap-2 font-semibold text-emerald-800">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              {t(locale, "orderPlaced")}
            </p>
            <p className="text-sm text-emerald-700">{t(locale, "addAnotherOrderHint")}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleAddAnotherOrder}
                className="btn-primary flex-1 py-3"
              >
                {t(locale, "addAnotherOrder")}
              </button>
              <button
                type="button"
                onClick={handleViewOrders}
                className="flex-1 rounded-xl border-2 border-brand-green/20 bg-white py-3 text-sm font-semibold text-brand-green"
              >
                {t(locale, "viewOrdersList")}
              </button>
            </div>
          </div>
        ) : (
        <form key={formKey} action={submitOrder} encType="multipart/form-data" className="space-y-5">
          <input type="hidden" name="customerId" value={customer.id} />

          <section className="space-y-3" data-guide-target="guide-measurements">
            <h2 className="text-sm font-bold text-brand-green">{t(locale, "measurements")}</h2>

            {lastMeasurementSnapshot && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMeasurementReuseChoice("same")}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold ${
                    measurementReuseChoice === "same"
                      ? "bg-brand-green text-brand-gold"
                      : "bg-white text-brand-green ring-1 ring-brand-green/15"
                  }`}
                >
                  {t(locale, "sameMeasurementsAsPrevious")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMeasurementReuseChoice("different");
                    applySnapshotToUi(lastMeasurementSnapshot);
                  }}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold ${
                    measurementReuseChoice === "different"
                      ? "bg-brand-green text-brand-gold"
                      : "bg-white text-brand-green ring-1 ring-brand-green/15"
                  }`}
                >
                  {t(locale, "differentMeasurements")}
                </button>
              </div>
            )}

            {reuseSameMeasurements && lastMeasurementSnapshot ? (
              <>
                {lastMeasurementSnapshot.mode === "view" ? (
                  <>
                    <input type="hidden" name="measurementMode" value="view" />
                    <input type="hidden" name="personId" value={lastMeasurementSnapshot.personId} />
                  </>
                ) : (
                  <>
                    <input type="hidden" name="measurementMode" value="manual" />
                    <input
                      type="hidden"
                      name="shopMeasurementsJson"
                      value={buildShopMeasurementsJson(
                        lastMeasurementSnapshot.data.type,
                        lastMeasurementSnapshot.data.fields,
                        lastMeasurementSnapshot.data.personName
                      )}
                    />
                  </>
                )}
                {renderSnapshotSummary(lastMeasurementSnapshot)}
              </>
            ) : (
              <>
                <input type="hidden" name="measurementMode" value={measurementMode} />

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
                  <div
                    className="space-y-3 rounded-xl border border-brand-green/10 bg-white p-3"
                    data-guide-target="guide-person-measurements"
                  >
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
                          {MEASUREMENT_TYPES.map((type) => (
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
                  <div
                    className="rounded-xl border border-brand-green/10 bg-white p-3"
                    data-guide-target="guide-manual-measurements"
                  >
                    <p className="mb-3 text-xs text-zinc-500">{t(locale, "shopManualMeasurementsHint")}</p>
                    <ShopManualMeasurementsForm
                      locale={locale}
                      defaultPersonName={customerName}
                      initialData={manualPrefill}
                    />
                  </div>
                )}
              </>
            )}
          </section>

          <section>
            <span className="mb-2 block text-sm font-semibold text-brand-green">
              {t(locale, "referencePhotos")}
            </span>

            {customer.favorites.length > 0 && (
              <div className="mb-4" data-guide-target="guide-favorites">
                <p className="mb-2 text-xs text-zinc-500">{t(locale, "pickCustomerFavorites")}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {customer.favorites.map((fav) => {
                    const checked = selectedDesigns.includes(fav.designId);
                    const thumb = designImageSrc(fav.design.imagePath);
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

            <div data-guide-target="guide-upload-photos">
              <MultiImageUpload
                namePrefix="orderImg"
                label={t(locale, "photosFromGallery")}
                locale={locale}
                max={MAX_GALLERY}
              />
            </div>
          </section>

          <textarea
            name="notes"
            rows={2}
            placeholder={t(locale, "clothHandoverNotes")}
            className="input-premium w-full text-sm"
            data-guide-target="guide-notes"
          />

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button
            type="submit"
            disabled={
              pending ||
              (!reuseSameMeasurements && measurementMode === "view" && !personId)
            }
            className="btn-primary w-full py-3 disabled:opacity-60"
            data-guide-target="guide-submit-order"
          >
            {pending ? "..." : t(locale, "saveOrderPending")}
          </button>
        </form>
        )}
      </div>
    </div>
    </>
  );
}
