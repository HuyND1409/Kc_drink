export type SyncEvent =
  | "PROFILE_UPDATED"
  | "CUSTOMER_UPDATED"
  | "EMPLOYEE_UPDATED"
  | "VOUCHER_UPDATED"
  | "TOPPING_UPDATED"
  | "NGUYEN_LIEU_UPDATED";

const channel = new BroadcastChannel("kc-drink-sync");

export const notifyDataChanged = (
  type: SyncEvent,
  payload?: unknown
) => {
  channel.postMessage({
    type,
    payload
  });
};

export const onDataChanged = (
  callback: (type: SyncEvent, payload?: unknown) => void
) => {
  const handler = (event: MessageEvent) => {
    callback(event.data?.type, event.data?.payload);
  };

  channel.addEventListener("message", handler);

  return () => {
    channel.removeEventListener("message", handler);
  };
};
