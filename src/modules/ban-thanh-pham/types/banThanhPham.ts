// ============================================================
// Types: Ban Thanh Pham
// ============================================================

export interface BanThanhPham {
  idBanThanhPham: number;
  tenBanThanhPham: string;
  donViTinh: string;
  hanSuDungGio?: number | null;
  trangThai: number;
  tongTon: number;
}

export interface BanThanhPhamRequest {
  tenBanThanhPham: string;
  donViTinh: string;
  hanSuDungGio?: number | null;
}

// ============================================================
// Types: Cong Thuc Ban Thanh Pham
// ============================================================

export interface CongThucBanThanhPham {
  idCtBtp: number;
  idBanThanhPham: number;
  tenBanThanhPham: string;
  donViThanhPham: string;
  idNguyenLieu: number;
  tenNguyenLieu: string;
  donViNguyenLieu: string;
  soLuongNguyenLieu: number;
  soLuongThanhPham: number;
}

export interface CongThucBanThanhPhamRequest {
  idBanThanhPham: number;
  idNguyenLieu: number;
  soLuongNguyenLieu: number;
  soLuongThanhPham: number;
}

// ============================================================
// Types: Me Pha Che
// ============================================================

export interface MePhaChe {
  idMePha: number;
  idBanThanhPham: number;
  tenBanThanhPham: string;
  donViTinh: string;
  idNhanVien?: number | null;
  tenNhanVien?: string | null;
  soLuongTaoRa: number;
  soLuongConLai: number;
  ngayPha: string;
  hanSuDung?: string | null;
  trangThai: number;
  ghiChu?: string | null;
}

export interface TaoMePhaCheRequest {
  idBanThanhPham: number;
  soLuongTaoRa: number;
  ghiChu?: string | null;
}

// ============================================================
// Types: Nguyen Lieu dropdown
// ============================================================

export interface NguyenLieuOption {
  idNguyenLieu: number;
  tenNguyenLieu: string;
  donViTinh: string;
  trangThai: number;
}
