export interface User {
    idTaiKhoan: number;
    username: string;
    email: string;
    role: string;
    tenNguoiDung: string | null;
    diemTichLuy?: number;
    idNhanVien?: number;
    soNgayDongHanh?: number;
    gioiTinh?: boolean | null;
    ngaySinh?: string | null;
    sdt?: string;
}
