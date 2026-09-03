import api from "@/api/axios";
import type {
  TaoHoaDonRequest,
  ThemChiTietRequest,
  CapNhatSoLuongRequest,
  ThemToppingRequest,
  CapNhatToppingRequest,
  ThanhToanRequest,
  ApDungVoucherRequest,
} from "../types/pos";

// ============================================================
// API: Sản phẩm
// ============================================================

export const getSanPham = (
  page = 0,
  size = 12,
  sortBy = "idSanPham",
  direction = "asc",
  keyword = ""
) => {
  return api.get("/san-pham", {
    params: { page, size, sortBy, direction, keyword: keyword || undefined },
  });
};

// ============================================================
// API: Khách hàng
// ============================================================
export const getKhachHang = (keyword: string, page = 0, size = 10) => {
  return api.get("/khach-hang", {
    params: {
      keyword: keyword || undefined,
      trangThai: 1,
      page,
      size,
      sortBy: "idKhachHang",
      direction: "asc",
    },
  });
};

export const taoKhachHang = (body: { tenKhachHang: string; sdt: string }) => {
  return api.post("/khach-hang", body);
};

// ============================================================
// API: Sản phẩm - Size
// ============================================================

export const getSanPhamSize = (idSanPham: number) => {
  return api.get(`/san-pham-size/san-pham/${idSanPham}`);
};

// ============================================================
// API: Hóa đơn
// ============================================================

export const taoHoaDon = (body: TaoHoaDonRequest) => {
  return api.post("/hoa-don/offline", body);
};

export const getHoaDonById = (idHoaDon: number) => {
  return api.get(`/hoa-don/${idHoaDon}`);
};

export const huyHoaDon = (idHoaDon: number) => {
  return api.patch(`/hoa-don/${idHoaDon}/huy`);
};

export const apDungVoucher = (idHoaDon: number, body: ApDungVoucherRequest) => {
  return api.patch(`/hoa-don/${idHoaDon}/voucher`, body);
};

export const boVoucher = (idHoaDon: number) => {
  return api.delete(`/hoa-don/${idHoaDon}/voucher`);
};

export const capNhatKhachHangHoaDon = (idHoaDon: number, idKhachHang: number | null) => {
  return api.patch(`/hoa-don/${idHoaDon}/khach-hang`, { idKhachHang });
};

export const themChiTiet = (idHoaDon: number, body: ThemChiTietRequest) => {
  return api.post(`/hoa-don/${idHoaDon}/chi-tiet`, body);
};

export const capNhatSoLuong = (idChiTiet: number, body: CapNhatSoLuongRequest) => {
  return api.patch(`/hoa-don/chi-tiet/${idChiTiet}/so-luong`, body);
};

export const xoaChiTiet = (idChiTiet: number) => {
  return api.delete(`/hoa-don/chi-tiet/${idChiTiet}`);
};

// ============================================================
// API: Topping của chi tiết hóa đơn
// ============================================================

export const themToppingChiTiet = (idChiTiet: number, body: ThemToppingRequest) => {
  return api.post(`/hoa-don/chi-tiet/${idChiTiet}/topping`, body);
};

export const capNhatTopping = (idHdctTopping: number, body: CapNhatToppingRequest) => {
  return api.put(`/hoa-don/topping/${idHdctTopping}`, body);
};

export const xoaTopping = (idHdctTopping: number) => {
  return api.delete(`/hoa-don/topping/${idHdctTopping}`);
};

// ============================================================
// API: Thanh toán
// ============================================================

export const thanhToan = (idHoaDon: number, body: ThanhToanRequest) => {
  return api.post(`/hoa-don/${idHoaDon}/thanh-toan`, body);
};

export const taoThanhToanPayOS = (idHoaDon: number) => {
  return api.post(`/hoa-don/${idHoaDon}/payos`);
};

export const layTrangThaiPayOS = (idHoaDon: number) => {
  return api.get(`/hoa-don/${idHoaDon}/payos/status`);
};

export const huyThanhToanPayOS = (idHoaDon: number) => {
  return api.post(`/hoa-don/${idHoaDon}/payos/cancel`);
};

// ============================================================
// API: Voucher khả dụng cho hóa đơn
// ============================================================

export const getVoucherKhaDung = (
  idHoaDon: number,
  page = 0,
  size = 5
) => {
  return api.get(
    `/hoa-don/${idHoaDon}/voucher-kha-dung`,
    { params: { page, size } }
  );
};

