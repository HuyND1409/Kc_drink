export interface User {
    idTaiKhoan: number;
    username: string;
    email: string;
    role: string;
    tenNguoiDung: string | null;
    diemTichLuy?: number;
}
