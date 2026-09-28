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

export interface DashboardKinhDoanhData {
  soNgay: number;
  doanhThu: number;
  doanhThuTienMat: number;
  doanhThuChuyenKhoan: number;
  tongDon: number;
  donOnline: number;
  donPos: number;
  bieuDo: DashboardNgayData[];
  topSanPham: DashboardSanPhamData[];
}

export const getDashboardKinhDoanh = (days: 1 | 7 | 30) => {
  return api.get<ApiResponse<DashboardKinhDoanhData>>(
    `/dashboard/kinh-doanh?days=${days}`
  );
};
