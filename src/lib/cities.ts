/** Cities where LK Studio shops operate — extend as you add service areas. */
export const SERVICE_CITIES = [
  "Hyderabad",
  "Secunderabad",
  "Warangal",
  "Karimnagar",
  "Nizamabad",
  "Khammam",
  "Mahbubnagar",
  "Nalgonda",
  "Adilabad",
  "Suryapet",
  "Miryalaguda",
  "Siddipet",
  "Ramagundam",
  "Vijayawada",
  "Visakhapatnam",
  "Guntur",
  "Nellore",
  "Kurnool",
  "Tirupati",
  "Kadapa",
  "Anantapur",
  "Rajahmundry",
  "Kakinada",
  "Bangalore",
  "Chennai",
  "Mumbai",
  "Delhi",
  "Pune",
  "Other",
] as const;

export type ServiceCity = (typeof SERVICE_CITIES)[number];

export function normalizeCity(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const match = SERVICE_CITIES.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  return match ?? trimmed;
}

export function shopMatchesCustomerCity(
  shopCity: string | null | undefined,
  customerCity: string | null | undefined
): boolean {
  const customer = normalizeCity(customerCity);
  if (!customer) return true;
  const shop = normalizeCity(shopCity);
  if (!shop) return false;
  return shop === customer;
}

/** Guess service city from a geocoded address string. */
export function matchCityFromAddressText(text: string | null | undefined): string | null {
  if (!text?.trim()) return null;
  const lower = text.toLowerCase();
  for (const city of SERVICE_CITIES) {
    if (city === "Other") continue;
    if (lower.includes(city.toLowerCase())) return city;
  }
  return null;
}
