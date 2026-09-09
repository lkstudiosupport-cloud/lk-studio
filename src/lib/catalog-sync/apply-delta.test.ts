import test from "node:test";
import assert from "node:assert/strict";
import { applyCatalogSyncDelta, countNewDesigns } from "./apply-delta";
import type { CachedDesign } from "./types";
import { shouldAutoSyncOnNetwork } from "./network";

function design(partial: Partial<CachedDesign> & { id: string }): CachedDesign {
  return {
    shopId: null,
    isCatalog: true,
    catalogNumber: partial.catalogNumber ?? partial.id,
    title: partial.title ?? partial.id,
    imagePath: "/x.jpg",
    imagesJson: null,
    category: "MAGGAM",
    createdAt: "2026-01-01T00:00:00.000Z",
    sizeTier: "SMALL",
    catalogPart: null,
    ...partial,
  };
}

test("applyCatalogSyncDelta upserts added/updated and removes deleted", () => {
  const existing = new Map<string, CachedDesign>([
    ["a", design({ id: "a", title: "Old A" })],
    ["b", design({ id: "b" })],
  ]);

  const { map, addedCount, updatedCount, deletedCount } = applyCatalogSyncDelta(existing, {
    fullSync: false,
    added: [design({ id: "c", title: "C" })],
    updated: [design({ id: "a", title: "New A" })],
    deleted: ["b"],
  });

  assert.equal(map.size, 2);
  assert.equal(map.get("a")?.title, "New A");
  assert.equal(map.has("b"), false);
  assert.equal(map.get("c")?.title, "C");
  assert.equal(addedCount, 1);
  assert.equal(updatedCount, 1);
  assert.equal(deletedCount, 1);
});

test("full sync page 1 clears previous cache before applying", () => {
  const existing = new Map<string, CachedDesign>([["old", design({ id: "old" })]]);
  const { map } = applyCatalogSyncDelta(
    existing,
    {
      fullSync: true,
      added: [design({ id: "new1" })],
      updated: [],
      deleted: [],
    },
    { page: 1 }
  );
  assert.equal(map.has("old"), false);
  assert.equal(map.has("new1"), true);
});

test("countNewDesigns only counts unseen ids", () => {
  const previous = new Set(["a"]);
  assert.equal(
    countNewDesigns(previous, {
      added: [design({ id: "a" }), design({ id: "b" }), design({ id: "c" })],
    }),
    2
  );
});

test("auto-sync respects wifi on / mobile data off defaults", () => {
  const settings = { wifi: true, mobileData: false };
  assert.equal(shouldAutoSyncOnNetwork("wifi", settings), true);
  assert.equal(shouldAutoSyncOnNetwork("cellular", settings), false);
  assert.equal(shouldAutoSyncOnNetwork("offline", settings), false);
  assert.equal(shouldAutoSyncOnNetwork("unknown", settings), true);
});
