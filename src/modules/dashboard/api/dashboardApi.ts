import api from "@/api/axios";
import type { ApiResponse } from "@/types/auth";

export interface DashboardData {
  tongKhachHang: number;
  tongNhanVien: number;
  voucherDangHoatDong: number;
  toppingDangBan: number;
  nguyenLieuDangHoatDong: number;
  loToppingSapHetHan: number;
  loNguyenLieuSapHetHan: number;
  nguyenLieuDuoiNguong: number;
}

export const getDashboard = () => {
  return api.get<ApiResponse<DashboardData>>("/dashboard");
};
