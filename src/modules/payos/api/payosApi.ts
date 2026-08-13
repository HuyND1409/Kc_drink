import api from "@/api/axios";

export type PayOSPaymentStatus =
  | "PENDING"
  | "PAID"
  | "CANCELLED"
  | "EXPIRED"
  | string;

export interface PayOSCreateRequest {
  amount: number;
  description: string;
}

export interface PayOSCreateResponse {
  orderCode: number;
  amount: number;
  description: string;
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId: string;
  status: PayOSPaymentStatus;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export function createPayOSPayment(data: PayOSCreateRequest) {
  return api.post<ApiResponse<PayOSCreateResponse>>(
    "/payos/create-payment",
    data
  );
}

export function getPayOSPayment(orderCode: number) {
  return api.get<ApiResponse<PayOSCreateResponse>>(
    `/payos/${orderCode}`
  );
}
