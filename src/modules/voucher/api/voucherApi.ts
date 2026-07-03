import api from "@/api/axios";
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

export const createVoucher = (data: VoucherRequest) => {
  return api.post("/voucher", data);
};

export const updateVoucher = (id: number, data: VoucherRequest) => {
  return api.put(`/voucher/${id}`, data);
};

// Chú ý: Nếu Backend Controller của Voucher bạn viết là @PutMapping thì để api.put
// Nếu bạn viết @PatchMapping (giống bên Khách hàng) thì đổi thành api.patch nhé
export const lockVoucher = (id: number) => {
  return api.put(`/voucher/${id}/lock`);
};

export const unlockVoucher = (id: number) => {
  return api.put(`/voucher/${id}/unlock`);
};

// Ném luôn cái hàm Quét Sinh Nhật vào đây cho chuẩn form
export const triggerBirthday = () => {
  return api.post("/voucher/trigger-birthday");
};
