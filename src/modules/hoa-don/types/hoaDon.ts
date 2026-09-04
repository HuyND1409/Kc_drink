export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface HoaDonListItem {
  idHoaDon: number;
  maHoaDon: string;
  loaiHoaDon: string;
  ngayTao: string;

  tongTien: number;
  giamGia: number;
  phiVanChuyen: number;
  thanhTien: number;

  hinhThucThanhToan: string | null;
  payosStatus: string | null;
  trangThai: string;

  idKhachHang: number | null;
  tenKhachHang: string | null;
  sdtKhachHang: string | null;

  idNhanVien: number | null;
  tenNhanVien: string | null;

  coGiaoHang: boolean;
  maVanDonGhn: string | null;
  trangThaiVanDon: string | null;
  trangThaiGhn: string | null;
  thoiGianGiaoDuKien: string | null;
}

export interface GetHoaDonParams {
  keyword?: string;
  trangThai?: string;
  loaiHoaDon?: string;
  hinhThucThanhToan?: string;
  coGiaoHang?: boolean;
  trangThaiGhn?: string;
  tuNgay?: string;
  denNgay?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: string;
}

import type {
  HoaDon as PosHoaDon,
  VanDonGhnResponse as PosVanDonGhnResponse,
} from "@/modules/pos/types/pos";

export interface HoaDonDetail extends PosHoaDon {
  ngayTao?: string;
  loaiHoaDon?: string;
  idNhanVien?: number | null;
  tenNhanVien?: string | null;
}

export type VanDonGhnResponse = PosVanDonGhnResponse;
