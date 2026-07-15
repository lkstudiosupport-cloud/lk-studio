export const SHOP_ORDER_GUIDE_STORAGE_KEY = "lk-shop-order-guide-v1";

export type ShopOrderGuideIcon =
  | "customer"
  | "phone"
  | "find"
  | "measurements"
  | "person"
  | "favorites"
  | "upload"
  | "notes"
  | "submit";

export type ShopOrderGuideStep = {
  target: string;
  titleKey: string;
  bodyKey: string;
  icon: ShopOrderGuideIcon;
};

export function hasSeenShopOrderGuide(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(SHOP_ORDER_GUIDE_STORAGE_KEY) === "done";
  } catch {
    return true;
  }
}

export function markShopOrderGuideSeen(): void {
  try {
    localStorage.setItem(SHOP_ORDER_GUIDE_STORAGE_KEY, "done");
  } catch {
    /* ignore */
  }
}

export function buildLookupGuideSteps(): ShopOrderGuideStep[] {
  return [
    {
      target: "guide-customer-name",
      titleKey: "shopOrderGuide.lookupNameTitle",
      bodyKey: "shopOrderGuide.lookupNameBody",
      icon: "customer",
    },
    {
      target: "guide-customer-phone",
      titleKey: "shopOrderGuide.lookupPhoneTitle",
      bodyKey: "shopOrderGuide.lookupPhoneBody",
      icon: "phone",
    },
    {
      target: "guide-find-customer",
      titleKey: "shopOrderGuide.lookupFindTitle",
      bodyKey: "shopOrderGuide.lookupFindBody",
      icon: "find",
    },
  ];
}

export function buildOrderGuideSteps(input: {
  hasPersons: boolean;
  hasFavorites: boolean;
}): ShopOrderGuideStep[] {
  const steps: ShopOrderGuideStep[] = [
    {
      target: "guide-measurements",
      titleKey: "shopOrderGuide.measureTitle",
      bodyKey: "shopOrderGuide.measureBody",
      icon: "measurements",
    },
  ];

  if (input.hasPersons) {
    steps.push({
      target: "guide-person-measurements",
      titleKey: "shopOrderGuide.personTitle",
      bodyKey: "shopOrderGuide.personBody",
      icon: "person",
    });
  } else {
    steps.push({
      target: "guide-manual-measurements",
      titleKey: "shopOrderGuide.manualTitle",
      bodyKey: "shopOrderGuide.manualBody",
      icon: "person",
    });
  }

  if (input.hasFavorites) {
    steps.push({
      target: "guide-favorites",
      titleKey: "shopOrderGuide.favoritesTitle",
      bodyKey: "shopOrderGuide.favoritesBody",
      icon: "favorites",
    });
  }

  steps.push(
    {
      target: "guide-upload-photos",
      titleKey: "shopOrderGuide.uploadTitle",
      bodyKey: "shopOrderGuide.uploadBody",
      icon: "upload",
    },
    {
      target: "guide-notes",
      titleKey: "shopOrderGuide.notesTitle",
      bodyKey: "shopOrderGuide.notesBody",
      icon: "notes",
    },
    {
      target: "guide-submit-order",
      titleKey: "shopOrderGuide.submitTitle",
      bodyKey: "shopOrderGuide.submitBody",
      icon: "submit",
    }
  );

  return steps;
}
