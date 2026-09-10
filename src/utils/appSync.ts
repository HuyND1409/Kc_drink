export type SyncEvent =
  | "PROFILE_UPDATED"
  | "CUSTOMER_UPDATED"
  | "EMPLOYEE_UPDATED"
  | "VOUCHER_UPDATED"
  | "TOPPING_UPDATED"
  | "NGUYEN_LIEU_UPDATED"
  | "PRODUCT_UPDATED"
  | "KHUYEN_MAI_UPDATED"
  | "SIZE_UPDATED"
  | "BAN_THANH_PHAM_UPDATED"
  | "INVENTORY_UPDATED"
  | "HOA_DON_UPDATED"
  | "ONLINE_ORDER_UPDATED"
  | "GHN_UPDATED"
  | "APP_REVALIDATE";

const channel = new BroadcastChannel("kc-drink-sync");

export type SyncCallback = (type: SyncEvent, payload?: unknown) => void;

const subscribers = new Set<SyncCallback>();

// Single listener for incoming messages from other tabs
channel.addEventListener("message", (event: MessageEvent) => {
  subscribers.forEach((callback) => {
    callback(event.data?.type, event.data?.payload);
  });
});

export const notifyDataChanged = (
  type: SyncEvent,
  payload?: unknown
) => {
  // 1. Deliver to SAME TAB
  subscribers.forEach((callback) => {
    callback(type, payload);
  });

  // 2. Deliver to OTHER TABS
  channel.postMessage({
    type,
    payload
  });
};

export const onDataChanged = (
  callback: SyncCallback
) => {
  subscribers.add(callback);

  return () => {
    subscribers.delete(callback);
  };
};

export const setupGlobalRevalidate = () => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      notifyDataChanged("APP_REVALIDATE");
    }
  };

  const handleFocus = () => {
    notifyDataChanged("APP_REVALIDATE");
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("focus", handleFocus);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("focus", handleFocus);
  };
};
