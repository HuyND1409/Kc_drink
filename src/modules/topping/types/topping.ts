export interface Topping {
  idTopping: number;
  tenTopping: string;
  giaTopping: number;
  tongTonKho: number;
  trangThai: number; // 1: Active, 0: Inactive
}

export interface ToppingRequest {
  tenTopping: string;
  giaTopping: number;
  tongTonKho: number;
  trangThai: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ToppingResponse {
  data: PageResponse<Topping>;
  message: string;
  status: number;
}

// ============================================================
// Types: Lô Topping
// ============================================================

export interface LoTopping {
  idLoTopping: number;
  maLo: string;
  idTopping: number;
  tenTopping: string;
  soLuongNhap: number;
  soLuongTon: number;
  hanSuDung: string; // YYYY-MM-DD
  ngayNhap: string; // YYYY-MM-DDTHH:mm:ss
  tenNhanVien: string;
  trangThai: number;
}

export interface LoToppingRequest {
  maLo: string;
  idTopping: number;
  soLuongNhap: number;
  hanSuDung: string; // YYYY-MM-DD
  idNhanVien: number;
}
