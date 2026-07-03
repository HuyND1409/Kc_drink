export interface KhachHang {

  idKhachHang: number;

  tenKhachHang: string;

  sdt: string;

  email: string;

  // diaChi: string;

  diaChiMacDinh?: string;

  gioiTinh: boolean;

  ngaySinh: string;

  diemTichLuy: number;

  trangThai: number;

  idTaiKhoan?: number;

  username?: string;

}

export interface KhachHangRequest {

  tenKhachHang: string;

  sdt: string;

  email: string;

  // diaChi: string;

  diaChiMacDinh?: string;

  gioiTinh: boolean;

  ngaySinh: string;


  idTaiKhoan?: number;

}

export interface PageResponse<T> {

  content: T[];

  page: number;

  size: number;

  totalElements: number;

  totalPages: number;

  last: boolean;

}
