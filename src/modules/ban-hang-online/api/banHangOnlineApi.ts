import api from "@/api/axios";
import { notifyDataChanged } from "@/utils/appSync";
import type {
  ApiResponse,
  PageResponse,
  SanPhamOnline,
  ChiTietSanPhamOnline,
  DiaChiOnline,
  VoucherOnline,
  CheckoutPreviewRequest,
  CheckoutPreviewResponse,
  TaoDonHangOnlineRequest,
  TaoDonHangOnlineResponse,
  PayOSCreateResponse,
  TrangThaiThanhToanOnlineResponse,
  ChiTietDonHangOnlineResponse,
  DonHangOnlineSummary,
  DiaChiOnlineRequest
} from "../types/banHangOnline";

export const getSanPhamOnline = async (params?: any) => {
  const response = await api.get<ApiResponse<PageResponse<SanPhamOnline>>>("/online/products", { params });
  return response;
};

export const getChiTietSanPhamOnline = async (idSanPham: number) => {
  const response = await api.get<ApiResponse<ChiTietSanPhamOnline>>(`/online/products/${idSanPham}`);
  return response;
};

export const getDiaChiOnline = async () => {
  const response = await api.get<ApiResponse<DiaChiOnline[]>>("/online/dia-chi");
  return response;
};

export const createDiaChiOnline = async (payload: DiaChiOnlineRequest) => {
  const response = await api.post<ApiResponse<DiaChiOnline>>("/online/dia-chi", payload);
  return response;
};

export const updateDiaChiOnline = async (idDiaChi: number, payload: DiaChiOnlineRequest) => {
  const response = await api.put<ApiResponse<DiaChiOnline>>(`/online/dia-chi/${idDiaChi}`, payload);
  return response;
};

export const setDefaultDiaChiOnline = async (idDiaChi: number) => {
  const response = await api.patch<ApiResponse<any>>(`/online/dia-chi/${idDiaChi}/default`);
  return response;
};

export const getVoucherOnline = async (tongTien: number) => {
  const response = await api.get<ApiResponse<VoucherOnline[]>>("/online/vouchers", {
    params: { tongTien }
  });
  return response;
};

export const previewCheckoutOnline = async (payload: CheckoutPreviewRequest) => {
  const response = await api.post<ApiResponse<CheckoutPreviewResponse>>("/online/checkout/preview", payload);
  return response;
};

export const createOnlineOrder = async (payload: TaoDonHangOnlineRequest) => {
  const response = await api.post<ApiResponse<TaoDonHangOnlineResponse>>("/online/orders", payload);
  notifyDataChanged("ONLINE_ORDER_UPDATED");
  return response;
};

export const createOnlinePayment = async (idHoaDon: number) => {
  const response = await api.post<ApiResponse<PayOSCreateResponse>>(`/online/orders/${idHoaDon}/payment`);
  return response;
};

export const getOnlinePaymentStatus = async (idHoaDon: number) => {
  const response = await api.get<ApiResponse<TrangThaiThanhToanOnlineResponse>>(`/online/orders/${idHoaDon}/payment-status`);
  return response;
};

export const cancelOnlinePayment = async (idHoaDon: number) => {
  const response = await api.post<ApiResponse<any>>(`/online/orders/${idHoaDon}/payment/cancel`);
  notifyDataChanged("ONLINE_ORDER_UPDATED");
  return response;
};

export const getOnlineOrders = async () => {
  const response = await api.get<ApiResponse<PageResponse<DonHangOnlineSummary>>>("/online/orders");
  return response;
};

export const getOnlineOrderDetail = async (idHoaDon: number) => {
  const response = await api.get<ApiResponse<ChiTietDonHangOnlineResponse>>(`/online/orders/${idHoaDon}`);
  return response;
};

export const cancelOnlineOrder = async (idHoaDon: number) => {
  const response = await api.post<ApiResponse<any>>(`/online/orders/${idHoaDon}/cancel`);
  notifyDataChanged("ONLINE_ORDER_UPDATED");
  return response;
};
