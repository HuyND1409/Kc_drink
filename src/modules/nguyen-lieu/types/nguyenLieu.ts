// ============================================================
// Types: Nguyên Liệu
// ============================================================

export interface NguyenLieu {
    idNguyenLieu: number;
    tenNguyenLieu: string;
    donViTinh: string;
    tongTonKho: number;
    nguongTonKho: number;
    trangThai: number;
}

export interface NguyenLieuRequest {
    tenNguyenLieu: string;
    donViTinh: string;
    nguongTonKho: number;
}

// ============================================================
// Types: Lô Nguyên Liệu
// ============================================================

export interface LoNguyenLieu {
    idLo: number;
    maLo: string;
    idNguyenLieu: number;
    soLuongTon: number;
    hanSuDung: string; // ISO date string "YYYY-MM-DD"
    ngayNhap: string;  // ISO datetime string
    tenNhanVien: string; // Tên nhân viên nhập kho
}

export interface LoNguyenLieuRequest {
    maLo: string;
    idNguyenLieu: number;
    soLuongTon: number;
    hanSuDung: string; // "YYYY-MM-DD"
    idNhanVien: number; // ID nhân viên nhập kho
}
