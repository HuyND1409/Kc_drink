import api from "@/api/axios";
import type { ApiResponse } from "@/types/auth";
import type { NhatKyHeThong, PageResponse } from "../types/nhatKy";

export const getNhatKy = (
  page: number,
  size: number,
  username?: string,
  hanhDong?: string,
  doiTuong?: string,
  tuNgay?: string,
  denNgay?: string
) => {
  return api.get<ApiResponse<PageResponse<NhatKyHeThong>>>(
    "/nhat-ky-he-thong",
    {
      params: {
        page,
        size,
        ...(username ? { username } : {}),
        ...(hanhDong ? { hanhDong } : {}),
        ...(doiTuong ? { doiTuong } : {}),
        ...(tuNgay ? { tuNgay } : {}),
        ...(denNgay ? { denNgay } : {}),
      }
    }
  );
};
