// ============================================================
// Types: San Pham
// ============================================================

export interface SanPham {
  idSanPham: number;
  tenSanPham: string;
  gia: number;
  moTa?: string | null;
  hinhAnh?: string | null;
  trangThai: number;
  idDanhMuc?: number | null;
}

export interface SanPhamRequest {
  tenSanPham: string;
  gia: number;
  moTa?: string | null;
  idDanhMuc?: number | null;
}

export interface SanPhamFormPayload {
  product: SanPhamRequest;
  selectedSizes: ProductSizeSelection[];
  imageFile: File | null;
  removeImage: boolean;
}

// ============================================================
// Types: Size (dung chung)
// ============================================================

export interface Size {
  idSize: number;
  tenSize: string;
  phuThu: number;
  thuTu: number;
}

export interface SizeRequest {
  tenSize: string;
  phuThu: number;
  thuTu: number;
}

// ============================================================
// Types: SanPhamSize (lien ket san pham voi size)
// ============================================================

export interface SanPhamSize {
  id: number;
  idSanPham: number;
  idSize: number;
  tenSize: string;
  phuThu: number;
  thuTu: number;
}

// Phu thu rieng theo san pham (dung trong form va save)
export interface ProductSizeSelection {
  idSize: number;
  phuThu: number;
}

// ============================================================
// Types: Nguyen Lieu (dung trong cong thuc)
// ============================================================

export interface NguyenLieuCongThuc {
  idNguyenLieu: number;
  tenNguyenLieu: string;
  donViTinh: string;
  trangThai: number;
  tongTonKho: number;
  nguongTonKho: number;
}

// ============================================================
// Types: Cong Thuc Nguyen Lieu Truc Tiep
// ============================================================

export interface CongThucNguyenLieu {
  idCtsp: number;
  idSanPham: number;
  idSize: number;
  nguyenLieu: NguyenLieuCongThuc;
  soLuongCanDung: number;
}

export interface CongThucNguyenLieuRequest {
  idSanPham: number;
  idSize: number;
  idNguyenLieu: number;
  soLuongCanDung: number;
}

// ============================================================
// Types: Ban Thanh Pham
// ============================================================

export interface BanThanhPham {
  idBanThanhPham: number;
  tenBanThanhPham: string;
  donViTinh: string;
  hanSuDungGio: number;
  trangThai: number;
  tongTon: number;
}

// ============================================================
// Types: Cong Thuc Ban Thanh Pham
// ============================================================

export interface CongThucBtp {
  id: number;
  idSanPham: number;
  idSize: number;
  idBanThanhPham: number;
  tenBanThanhPham: string;
  donViTinh: string;
  soLuongCanDung: number;
}

export interface CongThucBtpRequest {
  idSanPham: number;
  idSize: number;
  idBanThanhPham: number;
  soLuongCanDung: number;
}
