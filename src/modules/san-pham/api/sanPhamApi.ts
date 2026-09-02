import api from "@/api/axios";
import type {
  SanPhamRequest,
  SizeRequest,
  CongThucNguyenLieuRequest,
  CongThucBtpRequest,
} from "@/modules/san-pham/types/sanPham";

// ============================================================
// API: San Pham
// ============================================================

export const getSanPham = (
  keyword = "",
  trangThai: number | undefined = undefined,
  page = 0,
  size = 5,
  sortBy = "idSanPham",
  direction = "asc"
) => {
  return api.get("/san-pham/manage", {
    params: { keyword, trangThai, page, size, sortBy, direction },
  });
};

export const createSanPham = (data: SanPhamRequest) => {
  return api.post("/san-pham", data);
};

export const updateSanPham = (id: number, data: SanPhamRequest) => {
  return api.put(`/san-pham/${id}`, data);
};

export const lockSanPham = (id: number) => {
  return api.patch(`/san-pham/${id}/lock`);
};

export const unlockSanPham = (id: number) => {
  return api.patch(`/san-pham/${id}/unlock`);
};

// ============================================================
// API: Size dung chung
// ============================================================

export const getAllSize = () => {
  return api.get("/size");
};

export const createSize = (data: SizeRequest) => {
  return api.post("/size", data);
};

export const updateSize = (id: number, data: SizeRequest) => {
  return api.put(`/size/${id}`, data);
};

// ============================================================
// API: SanPhamSize (lien ket san pham <-> size)
// ============================================================

export const getSanPhamSizeByProduct = (idSanPham: number) => {
  return api.get(`/san-pham-size/san-pham/${idSanPham}`);
};

export const createSanPhamSize = (
  idSanPham: number,
  idSize: number,
  phuThu: number
) => {
  return api.post("/san-pham-size", { idSanPham, idSize, phuThu });
};

export const deleteSanPhamSize = (id: number) => {
  return api.delete(`/san-pham-size/${id}`);
};

export const updateSanPhamSize = (
  id: number,
  idSanPham: number,
  idSize: number,
  phuThu: number
) => {
  return api.put(`/san-pham-size/${id}`, { idSanPham, idSize, phuThu });
};

// ============================================================
// API: Cong thuc nguyen lieu truc tiep
// ============================================================

export const getCongThucNguyenLieu = (
  idSanPham: number,
  idSize: number,
  page = 0,
  size = 100
) => {
  return api.get("/cong-thuc/san-pham", {
    params: { idSanPham, idSize, page, size },
  });
};

export const createCongThucNguyenLieu = (
  data: CongThucNguyenLieuRequest
) => {
  return api.post("/cong-thuc/san-pham", data);
};

export const updateCongThucNguyenLieu = (
  id: number,
  data: CongThucNguyenLieuRequest
) => {
  return api.put(`/cong-thuc/san-pham/${id}`, data);
};

export const deleteCongThucNguyenLieu = (id: number) => {
  return api.delete(`/cong-thuc/san-pham/${id}`);
};

// ============================================================
// API: Danh sach nguyen lieu (dung cho dropdown cong thuc)
// ============================================================

export const getNguyenLieuForFormula = () => {
  return api.get("/nguyen-lieu", {
    params: {
      keyword: "",
      trangThai: 1,
      page: 0,
      size: 100,
    },
  });
};

// ============================================================
// API: Ban Thanh Pham
// ============================================================

export const getBanThanhPham = () => {
  return api.get("/ban-thanh-pham");
};

// ============================================================
// API: Cong thuc ban thanh pham
// ============================================================

export const getCongThucBtp = (
  idSanPham: number,
  idSize: number
) => {
  return api.get("/cong-thuc-san-pham-btp", {
    params: { idSanPham, idSize },
  });
};

export const createCongThucBtp = (data: CongThucBtpRequest) => {
  return api.post("/cong-thuc-san-pham-btp", data);
};

export const updateCongThucBtp = (
  id: number,
  data: CongThucBtpRequest
) => {
  return api.put(`/cong-thuc-san-pham-btp/${id}`, data);
};

export const deleteCongThucBtp = (id: number) => {
  return api.delete(`/cong-thuc-san-pham-btp/${id}`);
};
