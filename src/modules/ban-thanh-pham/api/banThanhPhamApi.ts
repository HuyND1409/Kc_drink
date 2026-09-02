import api from "@/api/axios";
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

export const createBanThanhPham = (data: BanThanhPhamRequest) =>
  api.post("/ban-thanh-pham", data);

export const updateBanThanhPham = (id: number, data: BanThanhPhamRequest) =>
  api.put(`/ban-thanh-pham/${id}`, data);

export const lockBanThanhPham = (id: number) =>
  api.patch(`/ban-thanh-pham/${id}/lock`);

export const unlockBanThanhPham = (id: number) =>
  api.patch(`/ban-thanh-pham/${id}/unlock`);

// ============================================================
// API: Cong Thuc Ban Thanh Pham
// ============================================================

export const getCongThucBanThanhPham = (idBanThanhPham: number) =>
  api.get(`/cong-thuc-ban-thanh-pham/ban-thanh-pham/${idBanThanhPham}`);

export const createCongThucBanThanhPham = (data: CongThucBanThanhPhamRequest) =>
  api.post("/cong-thuc-ban-thanh-pham", data);

export const updateCongThucBanThanhPham = (
  idCtBtp: number,
  data: CongThucBanThanhPhamRequest
) => api.put(`/cong-thuc-ban-thanh-pham/${idCtBtp}`, data);

export const deleteCongThucBanThanhPham = (idCtBtp: number) =>
  api.delete(`/cong-thuc-ban-thanh-pham/${idCtBtp}`);

// ============================================================
// API: Me Pha Che
// ============================================================

export const getMePhaCheList = () =>
  api.get("/me-pha-che");

export const getMePhaCheById = (id: number) =>
  api.get(`/me-pha-che/${id}`);

export const createMePhaChe = (data: TaoMePhaCheRequest) =>
  api.post("/me-pha-che", data);

// ============================================================
// API: Nguyen Lieu (dung cho dropdown cong thuc BTP)
// ============================================================

export const getNguyenLieuForBtp = () =>
  api.get("/nguyen-lieu", {
    params: { keyword: "", trangThai: 1, page: 0, size: 100 },
  });
