import api from "@/api/axios";
import type { ToppingRequest, LoToppingRequest } from "../types/topping";

// ============================================================
// API: Topping
// ============================================================

export const getTopping = (
    keyword = "",
    trangThai: number | undefined = undefined,
    page = 0,
    size = 5
) => {
    return api.get("/topping", {
        params: {
            keyword,
            trangThai,
            page,
            size,
        },
    });
};

export const createTopping = (data: ToppingRequest) => {
    return api.post("/topping", data);
};

export const updateTopping = (id: number, data: ToppingRequest) => {
    return api.put(`/topping/${id}`, data);
};

export const lockTopping = (id: number) => {
    return api.patch(`/topping/${id}/lock`);
};

export const unlockTopping = (id: number) => {
    return api.patch(`/topping/${id}/unlock`);
};

// ============================================================
// API: Lô Topping (Kho - FEFO)
// ============================================================

export const getLoTopping = (
    idTopping: number,
    page = 0,
    size = 10
) => {
    return api.get("/lo-topping", {
        params: { idTopping, page, size },
    });
};

export const createLoTopping = (data: LoToppingRequest) => {
    return api.post("/lo-topping", data);
};
