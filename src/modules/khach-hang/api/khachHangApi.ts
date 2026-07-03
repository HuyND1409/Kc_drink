import api from "@/api/axios";
import type { KhachHangRequest } from "../types/khachHang";

export const getKhachHang = (
    keyword = "",
    trangThai: number | undefined = undefined,
    page = 0,
    size = 5
) => {
    return api.get("/khach-hang", {
        params: {
            keyword,
            trangThai,
            page,
            size,
        },
    });
};
export const createKhachHang = (
    data: KhachHangRequest
) => {
    return api.post("/khach-hang", data);
};
export const updateKhachHang = (
    id: number,
    data: KhachHangRequest
) => {
    return api.put(`/khach-hang/${id}`, data);
};
export const lockKhachHang = (
    id: number
) => {
    return api.patch(`/khach-hang/${id}/lock`);
};
export const unlockKhachHang = (
    id: number
) => {
    return api.patch(`/khach-hang/${id}/unlock`);
};
