"use client";

import { useEffect, useId, useState } from "react";
import type { CountryCode } from "libphonenumber-js";
import { getCountryCallingCode } from "libphonenumber-js";
import {
  buildPhoneInternational,
  dialCodeFor,
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
  /** Narrow country dial-code select so the national number field stays visible on mobile. */
  compactCountry?: boolean;
};

export function PhoneInput({
  locale,
  value,
  onChange,
  name = "phone",
  required,
  defaultCountry = DEFAULT_PHONE_COUNTRY,
  id: idProp,
  compactCountry = false,
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

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="sr-only">
        {t(locale, "mobileNumber")}
      </label>
      <div className="flex min-w-0 gap-1.5">
        <select
          aria-label={t(locale, "phoneCountry")}
          value={country}
          onChange={(e) => onCountryChange(e.target.value as CountryCode)}
          className={
            compactCountry
              ? "input-premium w-[3.75rem] shrink-0 px-1 py-2 text-xs tabular-nums sm:w-[4.5rem] sm:px-1.5 sm:text-sm"
              : "input-premium w-[7.5rem] shrink-0 px-2 text-sm sm:w-36"
          }
        >
          {PHONE_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {compactCountry ? dialCodeFor(c.code) : `${c.flag} ${dialCodeFor(c.code)}`}
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
    </div>
  );
}
