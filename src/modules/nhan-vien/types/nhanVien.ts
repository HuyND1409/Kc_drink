export interface NhanVien {

    idNhanVien: number;

    tenNhanVien: string;

    sdt: string;

    email: string;

    chucVu: string;

    trangThai: number;

    username: string;

}

export interface NhanVienRequest {

    tenNhanVien: string;

    sdt: string;

    email: string;

    chucVu: string;

    username: string;

    password: string;

}

export interface PageResponse<T> {

    content: T[];

    page: number;

    size: number;

    totalElements: number;

    totalPages: number;

    last: boolean;

}
