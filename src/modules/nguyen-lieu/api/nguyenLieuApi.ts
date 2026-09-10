import api from "@/api/axios";
import { notifyDataChanged } from "@/utils/appSync";
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

export const createNguyenLieu = async (data: NguyenLieuRequest) => {
  const res = await api.post("/nguyen-lieu", data);
  notifyDataChanged("NGUYEN_LIEU_UPDATED");
  return res;
};

export const lockNguyenLieu = async (id: number) => {
  const res = await api.patch(`/nguyen-lieu/${id}/lock`);
  notifyDataChanged("NGUYEN_LIEU_UPDATED");
  return res;
};

export const unlockNguyenLieu = async (id: number) => {
  const res = await api.patch(`/nguyen-lieu/${id}/unlock`);
  notifyDataChanged("NGUYEN_LIEU_UPDATED");
  return res;
};

// ============================================================
// API: Lô Nguyên Liệu (Kho - FEFO)
// ============================================================

// export const getLoNguyenLieu = (
//     idNguyenLieu: number,
//     page = 0,
//     size = 5
// ) => {
//     return api.get("/lo-nguyen-lieu", {
//         params: { idNguyenLieu, page, size },
//     });
// };
export const getLoNguyenLieu = (
  idNguyenLieu: number,
  page = 0,
  size = 5
) => {
  return api.get("/lo-nguyen-lieu", {
    params: {
      idNguyenLieu,
      page,
      size,
      sortBy: "hanSuDung", // BỔ SUNG: Sắp xếp theo hạn sử dụng
      direction: "asc"     // BỔ SUNG: HSD gần nhất lên trước (FEFO)
    },
  });
};

export const lockLoNguyenLieuApi = async (idLo: number) => {
  const res = await api.put(`/lo-nguyen-lieu/${idLo}/lock`);
  notifyDataChanged("INVENTORY_UPDATED");
  return res;
};

export const unlockLoNguyenLieuApi = async (idLo: number) => {
  const res = await api.put(`/lo-nguyen-lieu/${idLo}/unlock`);
  notifyDataChanged("INVENTORY_UPDATED");
  return res;
};
export const createLoNguyenLieu = async (data: LoNguyenLieuRequest) => {
  const res = await api.post("/lo-nguyen-lieu", data);
  notifyDataChanged("INVENTORY_UPDATED");
  return res;
};
// 📄 Import Excel Lô Nguyên Liệu
export const importLoNguyenLieuApi = async (formData: FormData) => {
  const res = await api.post("/lo-nguyen-lieu/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  notifyDataChanged("INVENTORY_UPDATED");
  return res;
};
