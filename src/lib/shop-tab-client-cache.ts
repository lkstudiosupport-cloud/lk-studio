"use client";

import type { ShopTabId, ShopTabPayloadMap } from "@/lib/shop-tab-types";

type CacheEntry<T> = { data: T; at: number };

const TTL_MS = 90_000;
const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

function cacheKey(tab: ShopTabId, query = ""): string {
  return query ? `${tab}?${query}` : tab;
}

export function getShopTabCache<T>(tab: ShopTabId, query = ""): T | null {
  const key = cacheKey(tab, query);
  const hit = store.get(key) as CacheEntry<T> | undefined;
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    store.delete(key);
    return null;
  }
  return hit.data;
}

export function setShopTabCache<T>(tab: ShopTabId, data: T, query = "") {
  store.set(cacheKey(tab, query), { data, at: Date.now() });
}

export function clearShopTabCache(tab?: ShopTabId) {
  if (!tab) {
    store.clear();
    inflight.clear();
    return;
  }
  for (const key of [...store.keys()]) {
    if (key === tab || key.startsWith(`${tab}?`)) store.delete(key);
  }
  for (const key of [...inflight.keys()]) {
    if (key === tab || key.startsWith(`${tab}?`)) inflight.delete(key);
  }
}

export function shopTabHrefToId(href: string): ShopTabId | null {
  if (href === "/shop" || href.startsWith("/shop?")) return "dashboard";
  if (href.startsWith("/shop/orders")) return "orders";
  if (href.startsWith("/shop/bills")) return "bills";
  if (href.startsWith("/shop/workers")) return "workers";
  return null;
}

function billsQueryFromHref(href: string): string {
  try {
    const u = new URL(href, "http://local");
    const params = new URLSearchParams();
    const billsTab = u.searchParams.get("tab");
    const mode = u.searchParams.get("mode");
    const period = u.searchParams.get("period");
    if (billsTab) params.set("billsTab", billsTab);
    if (mode) params.set("mode", mode);
    if (period) params.set("period", period);
    return params.toString();
  } catch {
    return "";
  }
}

export async function fetchShopTabData<T extends ShopTabId>(
  tab: T,
  query = "",
  opts?: { force?: boolean }
): Promise<ShopTabPayloadMap[T]> {
  const key = cacheKey(tab, query);
  if (!opts?.force) {
    const cached = getShopTabCache<ShopTabPayloadMap[T]>(tab, query);
    if (cached) return cached;
    const pending = inflight.get(key) as Promise<ShopTabPayloadMap[T]> | undefined;
    if (pending) return pending;
  }

  const qs = new URLSearchParams(query);
  qs.set("tab", tab);
  const promise = (async () => {
    const res = await fetch(`/api/shop/tabs?${qs.toString()}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Tab load failed (${res.status})`);
    const json = (await res.json()) as { ok: boolean; data: ShopTabPayloadMap[T] };
    if (!json.ok || !json.data) throw new Error("Tab load failed");
    setShopTabCache(tab, json.data, query);
    return json.data;
  })();

  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}

/** Prefetch a shop main-tab route into the client memory cache. */
export function prefetchShopTabFromHref(href: string) {
  const tab = shopTabHrefToId(href);
  if (!tab) return;
  const query = tab === "bills" ? billsQueryFromHref(href) : "";
  void fetchShopTabData(tab, query).catch(() => {});
}
