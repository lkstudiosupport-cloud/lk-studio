import test from "node:test";
import assert from "node:assert/strict";
import { buildBillNumber, buildShopNumberBase, extractPincodeFromAddress } from "./shop-code";

test("extracts a six-digit pincode from an address", () => {
  assert.equal(extractPincodeFromAddress("Main Road, 560001, Bengaluru"), "560001");
});

test("falls back to a generic shop base when no pincode is present", () => {
  assert.equal(buildShopNumberBase("Near Market Road"), "SHOP");
});

test("builds a business-style bill number from the shop name initial and pincode", () => {
  assert.equal(buildBillNumber("Ravi Tailors", "560001", 1), "R560001-1");
  assert.equal(buildBillNumber("Ravi Tailors", "560001", 7), "R560001-7");
});
