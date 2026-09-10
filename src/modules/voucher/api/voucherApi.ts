import api from "@/api/axios";
import { notifyDataChanged } from "@/utils/appSync";
import type { VoucherRequest } from "../types/voucher";

export const getVoucher = (
  keyword = "",
  trangThai: number | undefined = undefined,
  page = 0,
  size = 5
) => {
  return api.get("/voucher", {
    params: {
      keyword,
      trangThai,
      page,
      size,
    },
  });
};

export const createVoucher = async (data: VoucherRequest) => {
  const res = await api.post("/voucher", data);
  notifyDataChanged("VOUCHER_UPDATED");
  return res;
};

export const updateVoucher = async (id: number, data: VoucherRequest) => {
  const res = await api.put(`/voucher/${id}`, data);
  notifyDataChanged("VOUCHER_UPDATED");
  return res;
};

// Chú ý: Nếu Backend Controller của Voucher bạn viết là @PutMapping thì để api.put
// Nếu bạn viết @PatchMapping (giống bên Khách hàng) thì đổi thành api.patch nhé
export const lockVoucher = async (id: number) => {
  const res = await api.put(`/voucher/${id}/lock`);
  notifyDataChanged("VOUCHER_UPDATED");
  return res;
};

export const unlockVoucher = async (id: number) => {
  const res = await api.put(`/voucher/${id}/unlock`);
  notifyDataChanged("VOUCHER_UPDATED");
  return res;
};

// Ném luôn cái hàm Quét Sinh Nhật vào đây cho chuẩn form
export const triggerBirthday = async () => {
  const res = await api.post("/voucher/trigger-birthday");
  notifyDataChanged("VOUCHER_UPDATED");
  return res;
};
