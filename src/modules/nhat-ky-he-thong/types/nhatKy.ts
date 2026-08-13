export interface NhatKyHeThong {
  idNhatKy: number;
  idTaiKhoan?: number | null;
  username?: string | null;
  role?: string | null;
  hanhDong: string;
  doiTuong?: string | null;
  idDoiTuong?: number | null;
  noiDung?: string | null;
  thoiGian: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
