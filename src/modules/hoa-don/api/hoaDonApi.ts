import api from "@/api/axios";
import type { GetHoaDonParams } from "../types/hoaDon";

export const getDanhSachHoaDon = (params: GetHoaDonParams) => {
  return api.get("/hoa-don", { params });
};

export const getChiTietHoaDon = (idHoaDon: number) => {
  return api.get(`/hoa-don/${idHoaDon}`);
};

export const getGiaoHangHoaDon = (idHoaDon: number) => {
  return api.get(`/hoa-don/${idHoaDon}/giao-hang`);
};

export const lamMoiTrangThaiGhn = (idHoaDon: number) => {
  return api.get(`/hoa-don/${idHoaDon}/giao-hang/trang-thai-ghn`);
};
