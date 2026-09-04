import api from "@/api/axios";
import type { KhuyenMaiRequest, GetKhuyenMaiParams } from "../types/khuyenMai";

export const getDanhSachKhuyenMai = (params: GetKhuyenMaiParams) => {
  return api.get("/khuyen-mai", { params });
};

export const getChiTietKhuyenMai = (id: number) => {
  return api.get(`/khuyen-mai/${id}`);
};

export const taoKhuyenMai = (data: KhuyenMaiRequest) => {
  return api.post("/khuyen-mai", data);
};

export const capNhatKhuyenMai = (id: number, data: KhuyenMaiRequest) => {
  return api.put(`/khuyen-mai/${id}`, data);
};

export const khoaKhuyenMai = (id: number) => {
  return api.patch(`/khuyen-mai/${id}/lock`);
};

export const moKhoaKhuyenMai = (id: number) => {
  return api.patch(`/khuyen-mai/${id}/unlock`);
};
