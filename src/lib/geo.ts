/** Haversine distance in kilometres between two WGS84 points. */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function parseCoordsFromMapsLink(link: string | null | undefined): {
  lat: number;
  lng: number;
} | null {
  if (!link) return null;
  const q = link.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (q) return { lat: parseFloat(q[1]), lng: parseFloat(q[2]) };
  const at = link.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at) return { lat: parseFloat(at[1]), lng: parseFloat(at[2]) };
  return null;
}

export function formatDistanceKm(km: number, locale: string): string {
  if (km < 1) {
    const m = Math.round(km * 1000);
    return locale === "hi" ? `${m} m दूर` : locale === "te" ? `${m} m దూరం` : `${m} m away`;
  }
  const rounded = km < 10 ? km.toFixed(1) : String(Math.round(km));
  return locale === "hi"
    ? `${rounded} km दूर`
    : locale === "te"
      ? `${rounded} km దూరం`
      : `${rounded} km away`;
}

export type Locatable = {
  latitude: number | null;
  longitude: number | null;
  locationLink?: string | null;
};

export function resolveCoords(entity: Locatable): { lat: number; lng: number } | null {
  if (entity.latitude != null && entity.longitude != null) {
    return { lat: entity.latitude, lng: entity.longitude };
  }
  return parseCoordsFromMapsLink(entity.locationLink ?? null);
}

export function sortByDistance<T extends Locatable>(
  items: T[],
  fromLat: number,
  fromLng: number
): (T & { distanceKm: number | null })[] {
  return items
    .map((item) => {
      const coords = resolveCoords(item);
      return {
        ...item,
        distanceKm: coords ? distanceKm(fromLat, fromLng, coords.lat, coords.lng) : null,
      };
    })
    .sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
}
