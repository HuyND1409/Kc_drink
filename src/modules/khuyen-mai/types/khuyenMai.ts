import type { SanPham } from "@/modules/san-pham/types/sanPham";

export interface KhuyenMai {
  idKm: number;
  tenKm: string;
  loaiGiam: "PHAN_TRAM" | "SO_TIEN";
  giaTriGiam: number;
  ngayBatDau: string;
  ngayKetThuc: string;
  trangThai: number;
  trangThaiHienThi: string;
  moTa: string | null;
  soLuongSanPham?: number;
  sanPhamApDung?: SanPham[];
}

export interface KhuyenMaiRequest {
  tenKm: string;
  loaiGiam: "PHAN_TRAM" | "SO_TIEN";
  giaTriGiam: number;
  ngayBatDau: string;
  ngayKetThuc: string;
  moTa: string | null;
  idSanPham: number[];
}

export interface GetKhuyenMaiParams {
  keyword?: string;
  trangThai?: number;
  page?: number;
  size?: number;
}
