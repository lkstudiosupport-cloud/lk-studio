/** Coordinates first-open shop boot: priority tabs first, designs after. */

let priorityReady = false;
const waiters: Array<() => void> = [];

export function isShopPriorityTabsReady() {
  return priorityReady;
}

export function whenShopPriorityTabsReady(): Promise<void> {
  if (priorityReady) return Promise.resolve();
  return new Promise((resolve) => {
    waiters.push(resolve);
  });
}

export function markShopPriorityTabsReady() {
  if (priorityReady) return;
  priorityReady = true;
  while (waiters.length) waiters.shift()?.();
}

const SESSION_KEY = "lk-shop-boot-done";

export function shopBootAlreadyDoneThisSession() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markShopBootDoneThisSession() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* private mode */
  }
}
