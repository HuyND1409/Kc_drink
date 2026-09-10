import api from "@/api/axios";
import { notifyDataChanged } from "@/utils/appSync";
import type { KhuyenMaiRequest, GetKhuyenMaiParams } from "../types/khuyenMai";

export const getDanhSachKhuyenMai = (params: GetKhuyenMaiParams) => {
  return api.get("/khuyen-mai", { params });
};

export const getChiTietKhuyenMai = (id: number) => {
  return api.get(`/khuyen-mai/${id}`);
};

export const taoKhuyenMai = async (data: KhuyenMaiRequest) => {
  const res = await api.post("/khuyen-mai", data);
  notifyDataChanged("KHUYEN_MAI_UPDATED");
  return res;
};

export const capNhatKhuyenMai = async (id: number, data: KhuyenMaiRequest) => {
  const res = await api.put(`/khuyen-mai/${id}`, data);
  notifyDataChanged("KHUYEN_MAI_UPDATED");
  return res;
};

export const khoaKhuyenMai = async (id: number) => {
  const res = await api.patch(`/khuyen-mai/${id}/lock`);
  notifyDataChanged("KHUYEN_MAI_UPDATED");
  return res;
};

export const moKhoaKhuyenMai = async (id: number) => {
  const res = await api.patch(`/khuyen-mai/${id}/unlock`);
  notifyDataChanged("KHUYEN_MAI_UPDATED");
  return res;
};
