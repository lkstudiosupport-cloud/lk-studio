"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSwipeNavBlock } from "@/hooks/useSwipeTabs";
import Link from "next/link";
import { VoiceInput } from "./VoiceInput";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { BillLineItem } from "@/lib/bill-items";
import { lineItemTotal } from "@/lib/bill-items";
import { Plus, Trash2, Receipt, ArrowLeft, UserRound, Pencil } from "lucide-react";
import { createBill, updateBill } from "@/app/shop/actions";
import { billPending } from "@/lib/bill-payment";
import { newId } from "@/lib/new-id";
import { CustomerPhoneField } from "@/components/CustomerPhoneField";
import { BillPieceNameField } from "@/components/BillPieceNameField";
import type { BillPresetItemId } from "@/lib/bill-preset-items";
import { billPresetLabelKey } from "@/lib/bill-preset-items";

type Customer = { id: string; name: string; phone: string | null; whatsapp: string | null };

function newLine(): BillLineItem {
  return { id: newId(), name: "", quantity: 0, price: 0, amount: 0 };
}

export function MultiPieceBillForm({
  locale,
  customers,
  initialCustomerName = "",
  initialCustomerPhone = "",
  initialLines,
  initialAdvancePaid = 0,
  initialPaidAmount = 0,
  editBillId,
  hideCustomerSection = false,
  onChangeCustomer,
}: {
  locale: Locale;
  customers: Customer[];
  initialCustomerName?: string;
  initialCustomerPhone?: string;
  initialLines?: BillLineItem[];
  initialAdvancePaid?: number;
  initialPaidAmount?: number;
  /** When set, form updates an existing bill instead of creating one. */
  editBillId?: string;
  hideCustomerSection?: boolean;
  onChangeCustomer?: () => void;
}) {
  const isEdit = Boolean(editBillId);
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone);
  const [lines, setLines] = useState<BillLineItem[]>(
    initialLines?.length ? initialLines : [newLine()]
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [advancePaid, setAdvancePaid] = useState(initialAdvancePaid);
  const [paidAmount, setPaidAmount] = useState(initialPaidAmount);

  const total = useMemo(
    () => lines.reduce((s, l) => s + lineItemTotal(l.quantity, l.price), 0),
    [lines]
  );

  useSwipeNavBlock(true);

  const prevLocaleRef = useRef(locale);
  useEffect(() => {
    const prev = prevLocaleRef.current;
    if (prev === locale) return;
    prevLocaleRef.current = locale;
    setLines((current) =>
      current.map((line) => {
        if (!line.presetId) return line;
        const name = t(locale, billPresetLabelKey(line.presetId as BillPresetItemId));
        return name === line.name ? line : { ...line, name };
      })
    );
  }, [locale]);

  const updateLine = (id: string, patch: Partial<BillLineItem>) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const next = { ...l, ...patch };
        next.amount = lineItemTotal(next.quantity, next.price);
        return next;
      })
    );
  };

  const removeLine = (id: string) => {
    setLines((prev) => (prev.length <= 1 ? [newLine()] : prev.filter((l) => l.id !== id)));
  };

  const pickCustomer = (id: string) => {
    const c = customers.find((x) => x.id === id);
    if (!c) return;
    setCustomerName(c.name);
    setCustomerPhone(c.phone || c.whatsapp || "");
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const name = customerName.trim();
    if (!name) {
      setError(t(locale, "enterCustomerName"));
      return;
    }
    const valid = lines
      .map((l) => ({
        ...l,
        amount: lineItemTotal(l.quantity, l.price),
      }))
      .filter((l) => l.name.trim() && l.amount > 0);
    if (valid.length === 0) {
      setError(t(locale, "addBillLines"));
      return;
    }

    setPending(true);
    const fd = new FormData(e.currentTarget);
    fd.set("customerName", name);
    fd.set("customerPhone", customerPhone.trim());
    fd.set("itemsJson", JSON.stringify(valid));
    fd.set("amount", String(valid.reduce((s, l) => s + l.amount, 0)));
    fd.set("advancePaid", String(advancePaid));
    fd.set("paidAmount", String(paidAmount));

    try {
      if (isEdit && editBillId) {
        fd.set("billId", editBillId);
        const result = await updateBill(fd);
        if (result && "ok" in result && result.ok === false) {
          setError(result.error);
          return;
        }
        // Successful update redirects from the server action.
        return;
      }

      const result = await createBill(fd);
      if (result && "ok" in result && result.ok === false) {
        setError(result.error);
        return;
      }
      // Successful create redirects from the server action.
    } catch (err) {
      // next/navigation redirect() throws — let the framework navigate
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        String((err as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
      ) {
        throw err;
      }
      const raw = err instanceof Error ? err.message : "Failed";
      setError(
        raw.includes("Server Components") || raw.includes("digest")
          ? t(locale, "saveBillFailedRetry")
          : raw
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="card-premium min-w-0 space-y-5 p-4 sm:p-5">
      {(hideCustomerSection || isEdit) && (
        <Link
          href={isEdit && editBillId ? `/shop/bills/${editBillId}` : "/shop/bills"}
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-green"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEdit ? t(locale, "backToBill") : t(locale, "backToBills")}
        </Link>
      )}

      <h2 className="flex items-center gap-2 text-lg font-bold text-brand-green">
        <Receipt className="h-6 w-6" />
        {isEdit ? t(locale, "editBill") : hideCustomerSection ? t(locale, "billBook") : t(locale, "createBill")}
      </h2>

      {hideCustomerSection ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-green/15 bg-brand-cream/60 px-4 py-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-brand-green-soft">
              <UserRound className="h-3.5 w-3.5" />
              {t(locale, "customer")}
            </p>
            <p className="font-bold text-brand-green">{customerName}</p>
            {customerPhone && <p className="text-sm text-zinc-600">{customerPhone}</p>}
          </div>
          {onChangeCustomer && (
            <button
              type="button"
              onClick={onChangeCustomer}
              className="inline-flex items-center gap-1 rounded-lg border border-brand-green/20 px-3 py-1.5 text-xs font-semibold text-brand-green"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t(locale, "changeCustomer")}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-brand-green/10 bg-brand-cream/50 p-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-brand-green">
              {t(locale, "customerName")}
            </span>
            <VoiceInput
              locale={locale}
              value={customerName}
              onChange={setCustomerName}
              list="bill-customer-names"
              required
              placeholder={t(locale, "customerNamePlaceholder")}
              className="w-full"
              micErrorLabel={t(locale, "micPermissionError")}
              startLabel={t(locale, "startListening")}
              stopLabel={t(locale, "stopListening")}
            />
            <datalist id="bill-customer-names">
              {customers.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </label>

          {customers.length > 0 && (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-zinc-600">
                {t(locale, "pickSavedCustomer")}
              </span>
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) pickCustomer(e.target.value);
                  e.target.value = "";
                }}
                className="input-premium w-full text-sm"
              >
                <option value="">{t(locale, "selectCustomerOptional")}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {(c.phone || c.whatsapp) ? ` · ${c.phone || c.whatsapp}` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}

          <CustomerPhoneField
            locale={locale}
            value={customerPhone}
            onChange={setCustomerPhone}
            onNamePicked={(name) => {
              if (!customerName.trim()) setCustomerName(name);
            }}
          />
        </div>
      )}

      <div className="space-y-3">
        <div>
          <p className="text-sm font-bold text-brand-green">{t(locale, "billLineItems")}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{t(locale, "billPresetQtyPriceHint")}</p>
        </div>

        <div className="-mx-1 overflow-x-auto overscroll-x-contain scroll-nav">
          <div className="min-w-0 w-full min-[360px]:min-w-[20rem] sm:min-w-[24rem]">
            <div className="grid grid-cols-[minmax(8rem,2fr)_3.5rem_4rem_4rem_1.75rem] items-end gap-x-1 border-b border-brand-green/15 px-1 pb-2 text-xs font-bold uppercase tracking-wide text-brand-green-soft sm:grid-cols-[minmax(10rem,2.5fr)_4rem_4.5rem_4.5rem_2rem] sm:gap-x-1.5">
              <span>{t(locale, "piece")}</span>
              <span className="text-center">{t(locale, "quantity")}</span>
              <span className="text-center">{t(locale, "unitPrice")}</span>
              <span className="text-right">{t(locale, "lineTotal")}</span>
              <span aria-hidden />
            </div>

            {lines.map((line, idx) => {
              const lineTotal = lineItemTotal(line.quantity, line.price);
              return (
                <div
                  key={line.id}
                  className="grid grid-cols-[minmax(8rem,2fr)_3.5rem_4rem_4rem_1.75rem] items-center gap-x-1 border-b border-zinc-100 px-1 py-2 last:border-b-0 sm:grid-cols-[minmax(10rem,2.5fr)_4rem_4.5rem_4.5rem_2rem] sm:gap-x-1.5"
                >
                  <div className="min-w-0">
                    <span className="mb-0.5 block text-xs font-semibold text-zinc-500">
                      {t(locale, "piece")} {idx + 1}
                    </span>
                    <BillPieceNameField
                      locale={locale}
                      value={line.name}
                      presetId={line.presetId}
                      onChange={(name) =>
                        updateLine(line.id, { name, presetId: undefined })
                      }
                      onPresetSelect={(presetId: BillPresetItemId, label) =>
                        updateLine(line.id, {
                          name: label,
                          presetId,
                          quantity: line.quantity > 0 ? line.quantity : 1,
                        })
                      }
                      placeholder={t(locale, "pieceNamePlaceholder")}
                      ariaLabel={`${t(locale, "piece")} ${idx + 1}`}
                    />
                  </div>

                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={line.quantity > 0 ? line.quantity : ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        updateLine(line.id, { quantity: 0 });
                        return;
                      }
                      const n = parseInt(raw, 10);
                      if (!Number.isNaN(n) && n > 0) {
                        updateLine(line.id, { quantity: n });
                      }
                    }}
                    className="input-premium w-full px-1 py-1.5 text-center text-sm"
                    aria-label={`${t(locale, "quantity")} ${idx + 1}`}
                  />

                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={line.price || ""}
                    onChange={(e) =>
                      updateLine(line.id, { price: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="₹"
                    className="input-premium w-full px-1 py-1.5 text-center text-sm"
                    aria-label={`${t(locale, "unitPrice")} ${idx + 1}`}
                  />

                  <p className="text-right text-sm font-bold tabular-nums text-brand-green">
                    ₹{lineTotal.toFixed(2)}
                  </p>

                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="rounded-lg p-1 text-red-600 hover:bg-red-50"
                    aria-label={t(locale, "removeLine")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setLines((p) => [...p, newLine()])}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-green/20 py-3 text-sm font-semibold text-brand-green"
        >
          <Plus className="h-4 w-4" />
          {t(locale, "addCustomLine")}
        </button>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-brand-green via-brand-green-light to-brand-green-soft px-4 py-3 text-white">
        <span className="font-semibold">{t(locale, "billTotal")}</span>
        <span className="text-2xl font-bold">₹{total.toFixed(2)}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-amber-800">
            {t(locale, "advancePaid")}
          </span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={advancePaid || ""}
            onChange={(e) => setAdvancePaid(parseFloat(e.target.value) || 0)}
            className="input-premium w-full"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-emerald-800">
            {t(locale, "amountPaid")}
          </span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={paidAmount || ""}
            onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
            className="input-premium w-full"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border-2 border-brand-green/25 bg-brand-cream px-4 py-3 text-center">
          <p className="text-xs font-semibold uppercase text-brand-green">{t(locale, "billTotal")}</p>
          <p className="text-2xl font-bold text-brand-green">₹{total.toFixed(2)}</p>
        </div>
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-center">
          <p className="text-xs font-medium text-rose-800">{t(locale, "pendingAmount")}</p>
          <p className="text-2xl font-bold text-rose-700">
            ₹{billPending(total, advancePaid, paidAmount).toFixed(2)}
          </p>
        </div>
      </div>

      <label className="flex items-center gap-2">
        <input name="paid" type="checkbox" className="h-4 w-4" />
        <span className="text-sm font-medium">{t(locale, "paid")}</span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={pending} className="btn-primary w-full py-3 text-lg">
        {pending
          ? isEdit
            ? t(locale, "updatingBill")
            : t(locale, "savingBill")
          : isEdit
            ? t(locale, "updateBill")
            : t(locale, "saveBill")}
      </button>
    </form>
  );
}
