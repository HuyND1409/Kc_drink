export interface DiaChi {

  idDiaChi: number;

  idKhachHang: number;

  tenNguoiNhan: string;

  sdtNguoiNhan: string;

  diaChi: string;

  macDinh: boolean;

  trangThai: number;

}

export interface DiaChiRequest {

  idKhachHang: number;

  tenNguoiNhan: string;

  sdtNguoiNhan: string;

  diaChi: string;

  macDinh: boolean;

}
