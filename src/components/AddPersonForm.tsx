"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addPerson } from "@/app/customer/actions";
import { initialActionState } from "@/lib/action-state";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { UserPlus, CheckCircle2 } from "lucide-react";

export function AddPersonForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(addPerson, initialActionState);
  const [name, setName] = useState("");

  useEffect(() => {
    if (state.ok) {
      setName("");
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form action={action} className="card-premium grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto]">
      <div className="flex items-center gap-2 sm:col-span-3">
        <UserPlus className="h-5 w-5 text-brand-gold-dark" />
        <span className="font-semibold text-brand-green">{t(locale, "addPerson")}</span>
      </div>
      <input
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder={t(locale, "name")}
        className="input-premium"
      />
      <input name="relation" placeholder={t(locale, "relation")} className="input-premium" />
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "..." : t(locale, "addPerson")}
      </button>
      {state.ok && (
        <p className="flex items-center gap-1 text-sm text-emerald-700 sm:col-span-3">
          <CheckCircle2 className="h-4 w-4" />
          {t(locale, "personAdded")}
        </p>
      )}
      {state.error && (
        <p className="text-sm text-red-600 sm:col-span-3">{state.error}</p>
      )}
    </form>
  );
}
