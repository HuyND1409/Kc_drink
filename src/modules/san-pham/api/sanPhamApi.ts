import api from "@/api/axios";
import { notifyDataChanged } from "@/utils/appSync";
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

export const createSanPham = async (data: SanPhamRequest) => {
  const res = await api.post("/san-pham", data);
  notifyDataChanged("PRODUCT_UPDATED");
  return res;
};

export const updateSanPham = async (id: number, data: SanPhamRequest) => {
  const res = await api.put(`/san-pham/${id}`, data);
  notifyDataChanged("PRODUCT_UPDATED");
  return res;
};

export const lockSanPham = async (id: number) => {
  const res = await api.patch(`/san-pham/${id}/lock`);
  notifyDataChanged("PRODUCT_UPDATED");
  return res;
};

export const unlockSanPham = async (id: number) => {
  const res = await api.patch(`/san-pham/${id}/unlock`);
  notifyDataChanged("PRODUCT_UPDATED");
  return res;
};

// ============================================================
// API: Hinh Anh San Pham
// ============================================================

export const uploadSanPhamImage = (
  idSanPham: number,
  file: File
) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post(
    `/san-pham/${idSanPham}/hinh-anh`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};
export const deleteSanPhamImage = async (idSanPham: number) => {
  const res = await api.delete(`/san-pham/${idSanPham}/hinh-anh`);
  notifyDataChanged("PRODUCT_UPDATED");
  return res;
};

export const getSanPhamImageUrl = (path: string | null | undefined): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const baseURL = api.defaults.baseURL || window.location.origin;
  try {
    const origin = new URL(baseURL, window.location.origin).origin;
    return `${origin}${path.startsWith('/') ? path : '/' + path}`;
  } catch {
    return path;
  }
};

// ============================================================
// API: Size dung chung
// ============================================================

export const getAllSize = () => {
  return api.get("/size");
};

export const createSize = async (data: SizeRequest) => {
  const res = await api.post("/size", data);
  notifyDataChanged("SIZE_UPDATED");
  return res;
};

export const updateSize = async (id: number, data: SizeRequest) => {
  const res = await api.put(`/size/${id}`, data);
  notifyDataChanged("SIZE_UPDATED");
  return res;
};

// ============================================================
// API: SanPhamSize (lien ket san pham <-> size)
// ============================================================

export const getSanPhamSizeByProduct = (idSanPham: number) => {
  return api.get(`/san-pham-size/san-pham/${idSanPham}`);
};

export const createSanPhamSize = async (
  idSanPham: number,
  idSize: number,
  phuThu: number
) => {
  const res = await api.post("/san-pham-size", { idSanPham, idSize, phuThu });
  notifyDataChanged("PRODUCT_UPDATED");
  return res;
};

export const deleteSanPhamSize = async (id: number) => {
  const res = await api.delete(`/san-pham-size/${id}`);
  notifyDataChanged("PRODUCT_UPDATED");
  return res;
};

export const updateSanPhamSize = async (
  id: number,
  idSanPham: number,
  idSize: number,
  phuThu: number
) => {
  const res = await api.put(`/san-pham-size/${id}`, { idSanPham, idSize, phuThu });
  notifyDataChanged("PRODUCT_UPDATED");
  return res;
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
