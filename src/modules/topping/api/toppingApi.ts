import api from "@/api/axios";
import { notifyDataChanged } from "@/utils/appSync";
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

export const createTopping = async (data: ToppingRequest) => {
    const res = await api.post("/topping", data);
    notifyDataChanged("TOPPING_UPDATED");
    return res;
};

export const updateTopping = async (id: number, data: ToppingRequest) => {
    const res = await api.put(`/topping/${id}`, data);
    notifyDataChanged("TOPPING_UPDATED");
    return res;
};

export const lockTopping = async (id: number) => {
    const res = await api.patch(`/topping/${id}/lock`);
    notifyDataChanged("TOPPING_UPDATED");
    return res;
};

export const unlockTopping = async (id: number) => {
    const res = await api.patch(`/topping/${id}/unlock`);
    notifyDataChanged("TOPPING_UPDATED");
    return res;
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
// 🔒 Khóa Lô Topping
export const lockLoToppingApi = async (id: number) => {
    const res = await api.put(`/lo-topping/${id}/lock`);
    notifyDataChanged("INVENTORY_UPDATED");
    return res;
};

// 🔓 Mở khóa Lô Topping
export const unlockLoToppingApi = async (id: number) => {
    const res = await api.put(`/lo-topping/${id}/unlock`);
    notifyDataChanged("INVENTORY_UPDATED");
    return res;
};

export const createLoTopping = async (data: LoToppingRequest) => {
    const res = await api.post("/lo-topping", data);
    notifyDataChanged("INVENTORY_UPDATED");
    return res;
};
// 📄 Import Excel Lô Topping
export const importLoToppingApi = async (formData: FormData) => {
  const res = await api.post("/lo-topping/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  notifyDataChanged("INVENTORY_UPDATED");
  return res;
};
