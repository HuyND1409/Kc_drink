// ============================================================
// Types: POS Module
// ============================================================

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// ============================================================
// Sản phẩm
// ============================================================

export interface SanPham {
  idSanPham: number;
  tenSanPham: string;
  gia: number;
  moTa: string | null;
  hinhAnh: string | null;
  trangThai: number;
  idDanhMuc: number | null;
}

// ============================================================
// Sản phẩm - Size
// ============================================================

export interface SanPhamSize {
  id: number;
  idSanPham: number;
  idSize: number;
  tenSize: string;
  phuThu: number;
  thuTu: number;
}

// ============================================================
// Hóa đơn
// ============================================================

export interface HdctTopping {
  idHdctTopping: number;
  idTopping: number;
  tenTopping?: string | null;
  soLuong: number;
  donGia: number;
  thanhTien: number;
}

export interface ChiTietHoaDon {
  idHoaDonChiTiet: number;
  idSanPham: number;
  tenSanPham?: string;
  idSize: number;
  tenSize?: string;
  soLuong: number;
  donGia: number;
  thanhTien: number;
  toppingList: HdctTopping[];
  mucDuong?: number | null;
  mucDa?: number | null;
  ghiChu?: string | null;
}

export interface HoaDon {
  idHoaDon: number;
  maHoaDon: string;
  trangThai: string;
  tongTien: number;
  ghiChu: string | null;
  idKhachHang?: number | null;
  tenKhachHang?: string | null;
  sdtKhachHang?: string | null;
  giamGia?: number;
  phiVanChuyen?: number;
  thanhTien?: number;
  idVoucher?: number | null;
  maVoucher?: string | null;
  tenVoucher?: string | null;
  chiTiet: ChiTietHoaDon[];
  hinhThucThanhToan?: string | null;
  payosOrderCode?: number | null;
  payosPaymentLinkId?: string | null;
  payosStatus?: PayOSPaymentStatus | null;
}

export interface KhachHang {
  idKhachHang: number;
  tenKhachHang: string;
  sdt: string | null;
  email?: string | null;
  diemTichLuy?: number | null;
  trangThai: number;
}

// ============================================================
// Request bodies
// ============================================================

export interface TaoHoaDonRequest {
  idKhachHang: number | null;
  idNhanVien: number | null;
  ghiChu: string | null;
}

export interface ApDungVoucherRequest {
  maVoucher: string;
}

export interface ThemChiTietRequest {
  idSanPham: number;
  idSize: number;
  soLuong: number;
  mucDuong?: number;
  mucDa?: number;
  ghiChu?: string | null;
}

export interface CapNhatSoLuongRequest {
  soLuong: number;
}

export interface ThemToppingRequest {
  idTopping: number;
  soLuong: number;
  donGia: number;
}

export interface CapNhatToppingRequest {
  soLuong: number;
  donGia: number;
}

export interface ThanhToanRequest {
  hinhThucThanhToan: string;
}

// ============================================================
// Voucher khả dụng (dùng cho danh sách gợi ý trong POS)
// ============================================================

export interface VoucherKhaDung {
  idVoucher: number;
  maVoucher: string;
  tenVoucher: string;
  loaiVoucher: string;
  giaTriGiam: number;
  giamToiDa?: number | null;
  dieuKien?: number | null;
  soTienGiam: number;
  soLuong?: number | null;
  idKhachHang?: number | null;
  ngayKetThuc?: string | null;
}

export type PayOSPaymentStatus =
  | "PENDING"
  | "PAID"
  | "CANCELLED"
  | "EXPIRED";

export interface PayOSCreateResponse {
  orderCode: number;
  amount: number;
  description: string;
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId: string;
  status: PayOSPaymentStatus;
}

export interface PayOSPaymentStatusResponse {
  orderCode: number;
  amount: number;
  status: PayOSPaymentStatus;
}
