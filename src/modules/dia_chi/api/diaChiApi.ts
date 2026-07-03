import axios from "@/api/axios";

import type {
  DiaChi,
  DiaChiRequest,
} from "../types/diaChi";

export interface PageResponse<T> {

  content: T[];

  page: number;

  size: number;

  totalElements: number;

  totalPages: number;

  last: boolean;

}

interface ApiResponse<T> {

  code: number;

  message: string;

  data: T;

}

export const getDiaChi = async (

  idKhachHang: number,

  page = 0,

  size = 10

) => {

  const res =
    await axios.get<
      ApiResponse<PageResponse<DiaChi>>
    >("/dia-chi", {

      params: {

        idKhachHang,

        page,

        size,

      },

    });

  return res.data.data;

};

export const getDiaChiById =
async (id: number) => {

  const res =
    await axios.get<
      ApiResponse<DiaChi>
    >(`/dia-chi/${id}`);

  return res.data.data;

};

export const createDiaChi =
async (
  data: DiaChiRequest
) => {

  return axios.post(
    "/dia-chi",
    data
  );

};

export const updateDiaChi =
async (
  id: number,
  data: DiaChiRequest
) => {

  return axios.put(
    `/dia-chi/${id}`,
    data
  );

};

export const lockDiaChi =
async (
  id: number
) => {

  return axios.patch(
    `/dia-chi/${id}/lock`
  );

};

export const unlockDiaChi =
async (
  id: number
) => {

  return axios.patch(
    `/dia-chi/${id}/unlock`
  );

};
export const setDefaultDiaChi = async (
  id: number
) => {

  return axios.patch(
    `/dia-chi/${id}/default`
  );

};
