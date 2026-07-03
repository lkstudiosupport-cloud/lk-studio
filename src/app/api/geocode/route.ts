import { NextResponse } from "next/server";
import { matchCityFromAddressText, normalizeCity } from "@/lib/cities";

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  state_district?: string;
  county?: string;
};

/** Server-side reverse geocode (avoids browser CORS / Nominatim blocks). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&format=json&addressdetails=1`,
      {
        headers: {
          Accept: "application/json",
          "Accept-Language": "en",
          "User-Agent": "LKStudio/1.0 (tailor-app)",
        },
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) {
      return NextResponse.json({ error: "Geocode failed" }, { status: 502 });
    }
    const data = (await res.json()) as { display_name?: string; address?: NominatimAddress };
    const displayName = data.display_name ?? null;
    const parts = data.address;
    const rawCity =
      parts?.city ??
      parts?.town ??
      parts?.village ??
      parts?.suburb ??
      parts?.state_district ??
      parts?.county ??
      null;
    const city =
      normalizeCity(rawCity) ??
      matchCityFromAddressText(displayName) ??
      matchCityFromAddressText(rawCity);

    return NextResponse.json({ address: displayName, city });
  } catch {
    return NextResponse.json({ error: "Geocode failed" }, { status: 502 });
  }
}
