export interface Voucher {
  idVoucher: number;
  maVoucher: string;
  tenVoucher: string;

  // Các trường cũ (Thêm dấu ? để nó không bắt buộc)
  kieuGiamGia?: number;
  giamGia?: number;

  // 👉 THÊM 2 TRƯỜNG NÀY ĐỂ TYPESCRIPT HẾT BÁO LỖI ĐỎ
  loaiVoucher?: string;
  giaTriGiam?: number | null;

  dieuKien: number;
  soLuong: number;
  ngayBatDau: string;
  ngayKetThuc: string;
  idKhachHang: number | null;
  trangThai: number;
  ngayTao?: string;
  ngayCapNhat?: string;
}

export interface VoucherRequest {
  maVoucher: string;
  tenVoucher: string;
  kieuGiamGia?: number;
  giamGia?: number | null;
  dieuKien: number;
  soLuong: number;
  ngayBatDau: string | null;
  ngayKetThuc: string | null;
  idKhachHang?: number | null;
}
