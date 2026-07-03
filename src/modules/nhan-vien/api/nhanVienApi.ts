import api from "@/api/axios";
import type { NhanVienRequest } from "../types/nhanVien";

export const getNhanVien = (
  keyword = "",
  chucVu = "",
  trangThai: number | undefined = undefined,
  page = 0,
  size = 5
) => {

  return api.get("/nhan-vien", {
    params: {
      keyword,
      chucVu,
      trangThai,
      page,
      size,
    },
  });

};

export const createNhanVien = (
  data: NhanVienRequest
) => {

  return api.post("/nhan-vien", data);

};
export const updateNhanVien = (
  id: number,
  data: NhanVienRequest
) => {
  return api.put(`/nhan-vien/${id}`, data);
};
export const lockNhanVien = (
  id: number
) => {
  return api.patch(`/nhan-vien/${id}/lock`);

};
export const unlockNhanVien = (
  id: number
) => {
  return api.patch(`/nhan-vien/${id}/unlock`);

};
