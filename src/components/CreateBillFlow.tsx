"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Receipt, UserRound } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { MultiPieceBillForm } from "@/components/MultiPieceBillForm";
import { WhatsAppPhoneField } from "@/components/WhatsAppPhoneField";
import { useSwipeNavBlock } from "@/hooks/useSwipeTabs";

type Customer = { id: string; name: string; phone: string | null; whatsapp: string | null };

export function CreateBillFlow({ locale, customers }: { locale: Locale; customers: Customer[] }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [error, setError] = useState("");
  useSwipeNavBlock(true);

  const pickCustomer = (id: string) => {
    const c = customers.find((x) => x.id === id);
    if (!c) return;
    setCustomerName(c.name);
    setCustomerPhone(c.whatsapp || c.phone || "");
  };

  const continueToBill = () => {
    setError("");
    if (!customerName.trim()) {
      setError(t(locale, "enterCustomerName"));
      return;
    }
    setStep(2);
  };

  if (step === 2) {
    return (
      <MultiPieceBillForm
        locale={locale}
        customers={customers}
        initialCustomerName={customerName.trim()}
        initialCustomerPhone={customerPhone.trim()}
        hideCustomerSection
        onChangeCustomer={() => setStep(1)}
      />
    );
  }

  return (
    <div className="card-premium min-w-0 space-y-5 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <Link
          href="/shop/bills"
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-green"
        >
          <ArrowLeft className="h-4 w-4" />
          {t(locale, "backToBills")}
        </Link>
      </div>

      <h1 className="flex items-center gap-2 text-xl font-bold text-brand-green">
        <Receipt className="h-6 w-6" />
        {t(locale, "createBill")}
      </h1>

      <div className="space-y-3 rounded-xl border border-brand-green/10 bg-brand-cream/50 p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-brand-green">
          <UserRound className="h-4 w-4" />
          {t(locale, "customerDetails")}
        </p>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-brand-green">
            {t(locale, "customerName")}
          </span>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            list="create-bill-customer-names"
            autoFocus
            placeholder={t(locale, "customerNamePlaceholder")}
            className="input-premium w-full"
          />
          <datalist id="create-bill-customer-names">
            {customers.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </label>

        {customers.length > 0 && (
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-zinc-600">
              {t(locale, "pickCustomerForWhatsApp")}
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
                  {c.whatsapp || c.phone ? ` · ${c.whatsapp || c.phone}` : ""}
                </option>
              ))}
            </select>
          </label>
        )}

        <WhatsAppPhoneField
          locale={locale}
          value={customerPhone}
          onChange={setCustomerPhone}
          onNamePicked={(name) => {
            if (!customerName.trim()) setCustomerName(name);
          }}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="button" onClick={continueToBill} className="btn-primary w-full py-3 text-lg">
        {t(locale, "continueToBill")}
      </button>
    </div>
  );
}
