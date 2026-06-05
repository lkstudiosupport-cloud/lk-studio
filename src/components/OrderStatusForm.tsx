"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { OrderStatus } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { statusLabelKey, ORDER_STATUSES } from "@/lib/order-status";
import { orderStatusTabId } from "@/lib/order-stats";
import { updateOrderStatus } from "@/app/shop/actions";

export function OrderStatusForm({
  orderId,
  status,
  locale,
  onStatusUpdated,
}: {
  orderId: string;
  status: OrderStatus;
  locale: Locale;
  onStatusUpdated?: (tabId: string) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(status);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        await updateOrderStatus(formData);
        router.refresh();
        onStatusUpdated?.(orderStatusTabId(formData.get("status") as OrderStatus));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-1">
      <input type="hidden" name="orderId" value={orderId} />

      <div className="flex w-full items-center justify-end gap-2">
        <select
          name="status"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
          className="rounded-lg border-0 bg-white/15 px-2 py-1.5 text-xs font-medium text-white"
        >
          {ORDER_STATUSES.filter((s) => s !== "CANCELLED").map((s) => (
            <option key={s} value={s} className="text-brand-green">
              {t(locale, statusLabelKey(s))}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-gold px-3 py-1.5 text-xs font-bold text-brand-green disabled:opacity-60"
        >
          {pending ? "…" : t(locale, "save")}
        </button>
      </div>

      {error && <p className="text-right text-xs text-red-200">{error}</p>}
    </form>
  );
}
