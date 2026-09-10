import api from "@/api/axios";
import { notifyDataChanged } from "@/utils/appSync";
import type {
  BanThanhPhamRequest,
  CongThucBanThanhPhamRequest,
  TaoMePhaCheRequest,
} from "@/modules/ban-thanh-pham/types/banThanhPham";

// ============================================================
// API: Ban Thanh Pham
// ============================================================

export const getBanThanhPhamList = () =>
  api.get("/ban-thanh-pham");

export const getBanThanhPhamById = (id: number) =>
  api.get(`/ban-thanh-pham/${id}`);

export const createBanThanhPham = async (data: BanThanhPhamRequest) => {
  const res = await api.post("/ban-thanh-pham", data);
  notifyDataChanged("BAN_THANH_PHAM_UPDATED");
  return res;
};

export const updateBanThanhPham = async (id: number, data: BanThanhPhamRequest) => {
  const res = await api.put(`/ban-thanh-pham/${id}`, data);
  notifyDataChanged("BAN_THANH_PHAM_UPDATED");
  return res;
};

export const lockBanThanhPham = async (id: number) => {
  const res = await api.patch(`/ban-thanh-pham/${id}/lock`);
  notifyDataChanged("BAN_THANH_PHAM_UPDATED");
  return res;
};

export const unlockBanThanhPham = async (id: number) => {
  const res = await api.patch(`/ban-thanh-pham/${id}/unlock`);
  notifyDataChanged("BAN_THANH_PHAM_UPDATED");
  return res;
};

// ============================================================
// API: Cong Thuc Ban Thanh Pham
// ============================================================

export const getCongThucBanThanhPham = (idBanThanhPham: number) =>
  api.get(`/cong-thuc-ban-thanh-pham/ban-thanh-pham/${idBanThanhPham}`);

export const createCongThucBanThanhPham = async (data: CongThucBanThanhPhamRequest) => {
  const res = await api.post("/cong-thuc-ban-thanh-pham", data);
  notifyDataChanged("BAN_THANH_PHAM_UPDATED");
  return res;
};

export const updateCongThucBanThanhPham = async (
  idCtBtp: number,
  data: CongThucBanThanhPhamRequest
) => {
  const res = await api.put(`/cong-thuc-ban-thanh-pham/${idCtBtp}`, data);
  notifyDataChanged("BAN_THANH_PHAM_UPDATED");
  return res;
};

export const deleteCongThucBanThanhPham = async (idCtBtp: number) => {
  const res = await api.delete(`/cong-thuc-ban-thanh-pham/${idCtBtp}`);
  notifyDataChanged("BAN_THANH_PHAM_UPDATED");
  return res;
};

// ============================================================
// API: Me Pha Che
// ============================================================

export const getMePhaCheList = () =>
  api.get("/me-pha-che");

export const getMePhaCheById = (id: number) =>
  api.get(`/me-pha-che/${id}`);

export const createMePhaChe = async (data: TaoMePhaCheRequest) => {
  const res = await api.post("/me-pha-che", data);
  notifyDataChanged("INVENTORY_UPDATED");
  return res;
};

// ============================================================
// API: Nguyen Lieu (dung cho dropdown cong thuc BTP)
// ============================================================

export const getNguyenLieuForBtp = () =>
  api.get("/nguyen-lieu", {
    params: { keyword: "", trangThai: 1, page: 0, size: 100 },
  });
