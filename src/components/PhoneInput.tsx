"use client";

import { useEffect, useId, useState } from "react";
import type { CountryCode } from "libphonenumber-js";
import { getCountryCallingCode } from "libphonenumber-js";
import {
  buildPhoneInternational,
  dialCodeFor,
  formatPhoneDisplay,
  parsePhone,
} from "@/lib/phone";
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES } from "@/lib/phone-countries";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";

type PhoneInputProps = {
  locale: Locale;
  value: string;
  onChange: (e164: string) => void;
  name?: string;
  required?: boolean;
  defaultCountry?: CountryCode;
  id?: string;
  /** Hide formatted preview and hint (e.g. when wrapped by CustomerPhoneField). */
  hideFooter?: boolean;
};

export function PhoneInput({
  locale,
  value,
  onChange,
  name = "phone",
  required,
  defaultCountry = DEFAULT_PHONE_COUNTRY,
  id: idProp,
  hideFooter = false,
}: PhoneInputProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [country, setCountry] = useState<CountryCode>(defaultCountry);
  const [national, setNational] = useState("");

  useEffect(() => {
    if (!value.trim()) {
      setNational("");
      return;
    }
    const parsed = parsePhone(value, defaultCountry);
    if (parsed) {
      setCountry(parsed.country);
      setNational(parsed.national);
      return;
    }
    const allDigits = value.replace(/\D/g, "");
    const cc = getCountryCallingCode(country);
    const nationalDigits =
      allDigits.startsWith(cc) && allDigits.length > cc.length
        ? allDigits.slice(cc.length)
        : allDigits;
    setNational(nationalDigits);
  }, [value, defaultCountry, country]);

  function emit(nextCountry: CountryCode, nextNational: string) {
    const digits = nextNational.replace(/\D/g, "");
    if (!digits) {
      onChange("");
      return;
    }
    onChange(buildPhoneInternational(digits, nextCountry));
  }

  function onCountryChange(next: CountryCode) {
    setCountry(next);
    emit(next, national);
  }

  function onNationalChange(raw: string) {
    const digits = raw.replace(/\D/g, "");
    setNational(digits);
    emit(country, digits);
  }

  const displayValue = value ? formatPhoneDisplay(value) : "";

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="sr-only">
        {t(locale, "mobileNumber")}
      </label>
      <div className="flex min-w-0 gap-2">
        <select
          aria-label={t(locale, "phoneCountry")}
          value={country}
          onChange={(e) => onCountryChange(e.target.value as CountryCode)}
          className="input-premium w-[7.5rem] shrink-0 px-2 text-sm sm:w-36"
        >
          {PHONE_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {dialCodeFor(c.code)}
            </option>
          ))}
        </select>
        <input
          id={id}
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required={required}
          value={national}
          onChange={(e) => onNationalChange(e.target.value)}
          placeholder={t(locale, "mobileNumberPlaceholder")}
          className="input-premium min-w-0 flex-1"
        />
      </div>
      <input type="hidden" name={`${name}E164`} value={value} readOnly />
      {!hideFooter && displayValue && (
        <p className="text-xs text-brand-green-soft">
          {t(locale, "phoneFormatted")}: {displayValue}
        </p>
      )}
      {!hideFooter && (
        <p className="text-xs text-zinc-500">{t(locale, "mobileNumberHint")}</p>
      )}
    </div>
  );
}
