export interface NhanVien {

    idNhanVien: number;

    tenNhanVien: string;

    sdt: string;

    email: string;

    chucVu: string;

    trangThai: number;

    username: string;

    gioiTinh?: boolean | null;

    ngaySinh?: string | null;

}

export interface NhanVienRequest {

    tenNhanVien: string;

    sdt: string;

    email: string;

    chucVu: string;

    username: string;

    password: string;

    gioiTinh?: boolean | null;

    ngaySinh?: string | null;

}

export interface PageResponse<T> {

    content: T[];

    page: number;

    size: number;

    totalElements: number;

    totalPages: number;

    last: boolean;

}
