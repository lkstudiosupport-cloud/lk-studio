import { NextResponse } from "next/server";

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
      `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&format=json`,
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
    const data = (await res.json()) as { display_name?: string };
    return NextResponse.json({ address: data.display_name ?? null });
  } catch {
    return NextResponse.json({ error: "Geocode failed" }, { status: 502 });
  }
}
