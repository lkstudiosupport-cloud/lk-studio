/** Google Maps link for a lat/lng pin (opens in Maps app on mobile). */
export function googleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export const DEFAULT_MAP_CENTER = { lat: 17.385, lng: 78.4867 } as const;
