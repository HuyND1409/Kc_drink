export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface SanPhamOnline {
  idSanPham: number;
  tenSanPham: string;
  idKm: number | null;
  tenKhuyenMai: string | null;
  tienGiamKhuyenMai: number;
  giaSauKhuyenMai: number;
  coKhuyenMai: boolean;
  gia: number;
  moTa: string | null;
  hinhAnh: string | null;
  trangThai: number;
  idDanhMuc: number | null;
}

export interface SizeOnline {
  id: number;
  idSanPham: number;
  idSize: number;
  tenSize: string;
  phuThu: number;
  thuTu: number;
}

export interface ToppingOnline {
  idTopping: number;
  tenTopping: string;
  giaTopping: number;
  tongTonKho: number;
  trangThai: number;
}

export interface ChiTietSanPhamOnline {
  sanPham: SanPhamOnline;
  sizes: SizeOnline[];
  toppings: ToppingOnline[];
}

export interface ToppingGioHangOnline {
  idTopping: number;
  tenTopping: string;
  giaTopping: number;
  soLuong: number;
}

export interface GioHangOnlineItem {
  id: string; // local cart item id
  idSanPham: number;
  tenSanPham: string;
  hinhAnh: string | null;
  idSize: number;
  tenSize: string;
  phuThu: number;
  soLuong: number;
  mucDuong: number;
  mucDa: number;
  ghiChu: string;
  giaSanPhamHienThi: number; // For UI base price per drink
  toppings: ToppingGioHangOnline[];
}

export interface DiaChiOnline {
  idDiaChi: number;
  idKhachHang: number;
  tenNguoiNhan: string;
  sdtNguoiNhan: string;
  diaChi: string;
  macDinh: boolean;
  trangThai: number;

  provinceId: number;
  districtId: number;
  wardCode: string;

  tenTinhThanh: string;
  tenQuanHuyen: string;
  tenPhuongXa: string;
}

export interface DiaChiOnlineRequest {
  tenNguoiNhan: string;
  sdtNguoiNhan: string;
  diaChi: string;
  macDinh?: boolean;

  provinceId: number;
  districtId: number;
  wardCode: string;

  tenTinhThanh: string;
  tenQuanHuyen: string;
  tenPhuongXa: string;
}

export interface VoucherOnline {
  idVoucher: number;
  maVoucher: string;
  tenVoucher: string;
  loaiVoucher: string;
  giaTriGiam: number;
  giamToiDa: number;
  dieuKien: number;
  soTienGiam?: number;
  ngayKetThuc?: string;
  idKhachHang?: number | null;
}

export interface CheckoutPreviewRequest {
  idDiaChi: number | null;
  idVoucher: number | null;
  items: {
    idSanPham: number;
    idSize: number;
    soLuong: number;
    mucDuong: number;
    mucDa: number;
    ghiChu: string;
    toppings: {
      idTopping: number;
      soLuong: number;
    }[];
  }[];
}

export interface CheckoutPreviewResponse {
  tamTinhSauKhuyenMai: number;
  tienGiamVoucher: number;
  phiVanChuyen: number;
  tongThanhToan: number;
  voucher?: VoucherOnline | null;
  items?: any[];
}

export interface TaoDonHangOnlineRequest {
  clientRequestId: string;
  idDiaChi: number;
  idVoucher: number | null;
  ghiChuDonHang: string;
  hinhThucThanhToan: 'CHUYEN_KHOAN' | 'TIEN_MAT';
  items: CheckoutPreviewRequest["items"];
}

export interface TaoDonHangOnlineResponse {
  idHoaDon: number;
  maHoaDon: string;
  trangThai: string;
  hinhThucThanhToan: string;
  payosOrderCode: number | null;
  taoMoi: boolean;
}

export interface PayOSCreateResponse {
  checkoutUrl: string;
  qrCode?: string;
  orderCode?: number | string;
  amount?: number;
  description?: string;
  payosExpiresAt?: string;
}

export interface TrangThaiThanhToanOnlineResponse {
  daThanhToan: boolean;
  trangThaiHoaDon?: string;
}

export interface ChiTietDonHangOnlineResponse {
  idHoaDon: number;
  maHoaDon: string;
  ngayTao: string;
  trangThai: string;
  hinhThucThanhToan: string;
  payosStatus: string | null;
  payosExpiresAt?: string | null;
  payosOrderCode: number | null;
  tongTien: number;
  giamGia: number;
  giamGiaKhuyenMai: number;
  phiVanChuyen: number;
  thanhTien: number;
  idVoucher: number | null;
  maVoucher: string | null;
  tenVoucher: string | null;
  ghiChu: string | null;
  idDiaChi: number | null;
  tenNguoiNhan: string | null;
  sdtNguoiNhan: string | null;
  diaChiGiaoHang: string | null;
  trangThaiVanDon: string | null;
  maVanDonGhn: string | null;
  trangThaiGhn: string | null;
  thoiGianGiaoDuKien: string | null;
  chiTiet: {
    idHoaDonChiTiet: number;
    idSanPham: number;
    tenSanPham: string;
    idSize: number;
    tenSize: string;
    soLuong: number;
    giaGoc: number;
    tienGiamKhuyenMai: number;
    idKm: number | null;
    tenKhuyenMai: string | null;
    donGia: number;
    thanhTien: number;
    mucDuong: number;
    mucDa: number;
    ghiChu: string | null;
    toppingList: {
      idHdctTopping: number;
      idTopping: number;
      tenTopping: string;
      soLuong: number;
      donGia: number;
      thanhTien: number;
    }[];
  }[];
}

export interface DonHangOnlineSummary {
  idHoaDon: number;
  maHoaDon: string;
  ngayTao: string;
  trangThai: string;
  payosStatus: string | null;
  tongTien: number;
  giamGia: number;
  phiVanChuyen: number;
  thanhTien: number;
  trangThaiVanDon: string | null;
  maVanDonGhn: string | null;
  trangThaiGhn: string | null;
}
