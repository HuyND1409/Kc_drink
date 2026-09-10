import api from "@/api/axios";
import type { ApiResponse } from "@/types/auth";

export interface DashboardNgayData {
  ngay: string;
  doanhThu: number;
  donOnline: number;
  donOffline: number;
}

export interface DashboardSanPhamData {
  idSanPham: number;
  tenSanPham: string;
  soLuongBan: number;
  doanhThu: number;
}

export interface DashboardNhanVien {
  idNhanVien: number;
  tenNhanVien: string;
  soDon: number;
  doanhThu: number;
}

export interface DashboardData {
  tongKhachHang: number;
  tongNhanVien: number;
  voucherDangHoatDong: number;
  toppingDangBan: number;
  nguyenLieuDangHoatDong: number;
  loToppingSapHetHan: number;
  loNguyenLieuSapHetHan: number;
  nguyenLieuDuoiNguong: number;
  doanhThuHomNay: number;
  donOnlineHomNay: number;
  donOfflineHomNay: number;
  donDaThanhToanHomNay: number;
  donDaHuyHomNay: number;
  donChoTiepNhan: number;
  donDaTiepNhan: number;
  donDangGiao: number;
  donDaGiao: number;
  bieuDo7Ngay: DashboardNgayData[];
  topSanPham7Ngay: DashboardSanPhamData[];
  thongKeNhanVien7Ngay: DashboardNhanVien[];
}

export const getDashboard = () => {
  return api.get<ApiResponse<DashboardData>>("/dashboard");
};
