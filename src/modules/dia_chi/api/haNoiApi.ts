import axios from "@/api/axios";

export interface District {
  code: number;
  name: string;
}

export interface Ward {
  code: string;
  name: string;
}

interface GhnDistrictItem {
  DistrictID: number;
  DistrictName: string;
}

interface GhnWardItem {
  WardCode: string;
  WardName: string;
}

export const getHaNoiDistricts = async (): Promise<District[]> => {
  const res = await axios.get("/van-chuyen/districts");

  return res.data.data.data.map((item: GhnDistrictItem) => ({
    code: item.DistrictID,
    name: item.DistrictName,
  }));
};

export const getWards = async (
  districtId: number,
): Promise<Ward[]> => {
  const res = await axios.get(
    `/van-chuyen/wards/${districtId}`,
  );

  return res.data.data.data.map((item: GhnWardItem) => ({
    code: item.WardCode,
    name: item.WardName,
  }));
};
