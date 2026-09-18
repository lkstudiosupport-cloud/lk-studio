/** Normalize user input to match stored shop codes (uppercase, trimmed). */
export function normalizeShopCode(input: string): string {
  return input.trim().toUpperCase();
}

export function extractPincodeFromAddress(address?: string | null): string | null {
  if (!address) return null;
  const match = address.match(/(\d{6})/);
  return match?.[1] ?? null;
}

export function buildShopNumberBase(address?: string | null): string {
  const pincode = extractPincodeFromAddress(address);
  if (!pincode) return "SHOP";
  return `PIN${pincode}`;
}

export function buildBillNumber(shopName: string, pincode: string | null, serial: number): string {
  const initial = shopName.trim().charAt(0).toUpperCase() || "S";
  const code = pincode ? `${initial}${pincode}` : initial;
  return `${code}-${serial}`;
}
