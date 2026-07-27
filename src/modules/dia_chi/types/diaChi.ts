export interface DiaChi {

  idDiaChi: number;

  idKhachHang: number;

  tenNguoiNhan: string;

  sdtNguoiNhan: string;

  diaChi: string;

  macDinh: boolean;

  trangThai: number;

  provinceId: number;

  districtId: number;

  wardCode: string;

  tenTinhThanh: string;

  tenQuanHuyen: string;

  tenPhuongXa: string;

}

export interface DiaChiRequest {

  idKhachHang: number;

  tenNguoiNhan: string;

  sdtNguoiNhan: string;

  diaChi: string;

  macDinh: boolean;

  provinceId: number;

  districtId: number;

  wardCode: string;

  tenTinhThanh: string;

  tenQuanHuyen: string;

  tenPhuongXa: string;

}
