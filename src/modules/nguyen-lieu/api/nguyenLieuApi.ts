import api from "@/api/axios";
import type { NguyenLieuRequest, LoNguyenLieuRequest } from "@/modules/nguyen-lieu/types/nguyenLieu";

// ============================================================
// API: Nguyên Liệu
// ============================================================

export const getNguyenLieu = (
    keyword = "",
    trangThai: number | undefined = undefined,
    page = 0,
    size = 5,
    sortBy = "idNguyenLieu",
    direction = "asc"
) => {
    return api.get("/nguyen-lieu", {
        params: { keyword, trangThai, page, size, sortBy, direction },
    });
};

export const createNguyenLieu = (data: NguyenLieuRequest) => {
    return api.post("/nguyen-lieu", data);
};

export const lockNguyenLieu = (id: number) => {
    return api.patch(`/nguyen-lieu/${id}/lock`);
};

export const unlockNguyenLieu = (id: number) => {
    return api.patch(`/nguyen-lieu/${id}/unlock`);
};

// ============================================================
// API: Lô Nguyên Liệu (Kho - FEFO)
// ============================================================

export const getLoNguyenLieu = (
    idNguyenLieu: number,
    page = 0,
    size = 5
) => {
    return api.get("/lo-nguyen-lieu", {
        params: { idNguyenLieu, page, size },
    });
};

export const createLoNguyenLieu = (data: LoNguyenLieuRequest) => {
    return api.post("/lo-nguyen-lieu", data);
};
