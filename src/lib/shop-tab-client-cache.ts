"use client";

import type { ShopTabId, ShopTabPayloadMap } from "@/lib/shop-tab-types";

type CacheEntry<T> = { data: T; at: number };

/** Prefer background refresh after this age. */
const SOFT_TTL_MS = 45_000;
/** Keep showing stale data until this age (true SWR). */
const HARD_TTL_MS = 30 * 60_000;

const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

/** Active shop — cache keys are scoped so another shop never sees this data. */
let activeShopId: string | null = null;

function cacheKey(tab: ShopTabId, query = ""): string {
  const scope = activeShopId ?? "_";
  return query ? `${scope}:${tab}?${query}` : `${scope}:${tab}`;
}

function tabPrefix(tab: ShopTabId): string {
  const scope = activeShopId ?? "_";
  return `${scope}:${tab}`;
}

/** Bind tab cache to the logged-in shop; clears when shop changes. */
export function bindShopTabCacheScope(shopId: string) {
  if (activeShopId === shopId) return;
  activeShopId = shopId;
  store.clear();
  inflight.clear();
}

export function getShopTabCache<T>(tab: ShopTabId, query = ""): T | null {
  const key = cacheKey(tab, query);
  const hit = store.get(key) as CacheEntry<T> | undefined;
  if (!hit) return null;
  if (Date.now() - hit.at > HARD_TTL_MS) {
    store.delete(key);
    return null;
  }
  return hit.data;
}

export function isShopTabCacheFresh(tab: ShopTabId, query = ""): boolean {
  const key = cacheKey(tab, query);
  const hit = store.get(key);
  if (!hit) return false;
  return Date.now() - hit.at <= SOFT_TTL_MS;
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
  const prefix = tabPrefix(tab);
  for (const key of [...store.keys()]) {
    if (key === prefix || key.startsWith(`${prefix}?`)) store.delete(key);
  }
  for (const key of [...inflight.keys()]) {
    if (key === prefix || key.startsWith(`${prefix}?`)) inflight.delete(key);
  }
}

/**
 * Drop cached tab(s) and immediately prefetch fresh payloads so the next
 * navigation can paint from memory instead of a cold skeleton.
 */
export function invalidateAndPrefetchShopTabs(...tabs: ShopTabId[]) {
  for (const tab of tabs) {
    clearShopTabCache(tab);
    void fetchShopTabData(tab, "", { force: true }).catch(() => {});
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
    if (cached && isShopTabCacheFresh(tab, query)) return cached;
    const pending = inflight.get(key) as Promise<ShopTabPayloadMap[T]> | undefined;
    if (pending) {
      // Stale-while-revalidate: paint immediately if we have anything.
      if (cached) return cached;
      return pending;
    }
    // Soft-stale: return cached now and refresh in background when caller
    // only needs a value (prefetch). useShopTabData also triggers refresh.
    if (cached) {
      void fetchShopTabData(tab, query, { force: true }).catch(() => {});
      return cached;
    }
  }

  const existing = inflight.get(key) as Promise<ShopTabPayloadMap[T]> | undefined;
  if (opts?.force && existing) return existing;

  const qs = new URLSearchParams(query);
  qs.set("tab", tab);
  const promise = (async () => {
    const res = await fetch(`/api/shop/tabs?${qs.toString()}`, {
      credentials: "include",
      // Always bypass HTTP cache — client Map + server tags own freshness.
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
    if (inflight.get(key) === promise) inflight.delete(key);
  }
}

/** Prefetch a shop main-tab route into the client memory cache. */
export function prefetchShopTabFromHref(href: string) {
  const tab = shopTabHrefToId(href);
  if (!tab) return;
  const query = tab === "bills" ? billsQueryFromHref(href) : "";
  void fetchShopTabData(tab, query).catch(() => {});
}
