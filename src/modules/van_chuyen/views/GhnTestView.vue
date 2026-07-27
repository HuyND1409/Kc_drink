<template>
  <div class="ghn-test-page">
    <a-card title="Test vận chuyển GHN theo địa chỉ khách hàng">
      <a-form layout="vertical">
        <a-form-item label="Khách hàng">
          <a-select v-model:value="selectedKhachHangId" placeholder="Chọn khách hàng" :loading="loadingKhachHang"
            show-search allow-clear :filter-option="filterKhachHang" @change="handleKhachHangChange">
            <a-select-option v-for="item in khachHangs" :key="item.idKhachHang" :value="item.idKhachHang">
              {{ item.tenKhachHang }} - {{ item.sdt }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="Địa chỉ giao hàng">
          <a-select v-model:value="selectedDiaChiId" placeholder="Chọn địa chỉ giao hàng" :loading="loadingDiaChi"
            :disabled="!selectedKhachHangId" allow-clear @change="handleDiaChiChange">
            <a-select-option v-for="item in diaChis" :key="item.idDiaChi" :value="item.idDiaChi">
              {{ formatDiaChi(item) }}
              {{ item.macDinh ? " - Mặc định" : "" }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-alert v-if="diaChiDaChon" type="info" show-icon class="address-info">
          <template #message>
            Thông tin địa chỉ được gửi sang GHN
          </template>

          <template #description>
            <div class="address-detail">
              <div>
                Người nhận:
                <strong>{{ diaChiDaChon.tenNguoiNhan }}</strong>
              </div>

              <div>
                Số điện thoại:
                <strong>{{ diaChiDaChon.sdtNguoiNhan }}</strong>
              </div>

              <div>
                Địa chỉ:
                <strong>{{ formatDiaChi(diaChiDaChon) }}</strong>
              </div>

              <div>
                District ID:
                <strong>{{ diaChiDaChon.districtId }}</strong>
              </div>

              <div>
                Ward Code:
                <strong>{{ diaChiDaChon.wardCode }}</strong>
              </div>
            </div>
          </template>
        </a-alert>

        <a-button type="primary" :loading="loadingFee" :disabled="!diaChiDaChon" @click="handleCalculateFee">
          Tính phí vận chuyển
        </a-button>
      </a-form>

      <a-divider />

      <a-result v-if="phiVanChuyen !== null" status="success" title="Tính phí thành công">
        <template #subTitle>
          <div class="fee-result">
            <div>
              Phí vận chuyển:
              <strong>{{ formatCurrency(phiVanChuyen) }}</strong>
            </div>

            <div>
              Phí dịch vụ:
              <strong>{{ formatCurrency(phiDichVu) }}</strong>
            </div>

            <div>
              Phí bảo hiểm:
              <strong>{{ formatCurrency(phiBaoHiem) }}</strong>
            </div>

            <div v-if="thoiGianDuKien !== null">
              Thời gian giao dự kiến:
              <strong>{{ formatLeadTime(thoiGianDuKien) }}</strong>
            </div>

            <div v-else-if="leadTimeError" class="lead-time-error">
              Chưa lấy được thời gian giao dự kiến
            </div>
          </div>
        </template>
      </a-result>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import axios from "@/api/axios";

import { getKhachHang } from "@/modules/khach-hang/api/khachHangApi";
import type { KhachHang } from "@/modules/khach-hang/types/khachHang";

import { getDiaChi } from "@/modules/dia_chi/api/diaChiApi";
import type { DiaChi } from "@/modules/dia_chi/types/diaChi";

interface PhiVanChuyenData {
  phiVanChuyen: number;
  phiDichVu: number;
  phiBaoHiem: number;
}

interface LeadTimeData {
  leadtime: number;
  order_date?: number;
}

const khachHangs = ref<KhachHang[]>([]);
const diaChis = ref<DiaChi[]>([]);

const selectedKhachHangId = ref<number>();
const selectedDiaChiId = ref<number>();

const loadingKhachHang = ref(false);
const loadingDiaChi = ref(false);
const loadingFee = ref(false);

const phiVanChuyen = ref<number | null>(null);
const phiDichVu = ref(0);
const phiBaoHiem = ref(0);

const thoiGianDuKien = ref<number | null>(null);
const leadTimeError = ref(false);

const diaChiDaChon = computed(() => {
  return diaChis.value.find(
    (item) => item.idDiaChi === selectedDiaChiId.value,
  );
});

const resetResult = () => {
  phiVanChuyen.value = null;
  phiDichVu.value = 0;
  phiBaoHiem.value = 0;
  thoiGianDuKien.value = null;
  leadTimeError.value = false;
};

const loadKhachHangs = async () => {
  try {
    loadingKhachHang.value = true;

    const response = await getKhachHang(
      "",
      1,
      0,
      100,
    );

    khachHangs.value = response.data.data.content;
  } catch {
    message.error("Không thể tải danh sách khách hàng");
  } finally {
    loadingKhachHang.value = false;
  }
};

const handleKhachHangChange = async (
  idKhachHang?: number,
) => {
  selectedDiaChiId.value = undefined;
  diaChis.value = [];
  resetResult();

  if (!idKhachHang) {
    return;
  }

  try {
    loadingDiaChi.value = true;

    const pageData = await getDiaChi(
      idKhachHang,
      0,
      100,
    );

    diaChis.value = pageData.content.filter(
      (item) => item.trangThai === 1,
    );

    const diaChiMacDinh = diaChis.value.find(
      (item) => item.macDinh,
    );

    if (diaChiMacDinh) {
      selectedDiaChiId.value =
        diaChiMacDinh.idDiaChi;
    }

    if (diaChis.value.length === 0) {
      message.warning(
        "Khách hàng chưa có địa chỉ đang hoạt động",
      );
    }
  } catch {
    message.error(
      "Không thể tải danh sách địa chỉ của khách hàng",
    );
  } finally {
    loadingDiaChi.value = false;
  }
};

const handleDiaChiChange = () => {
  resetResult();
};

const handleCalculateFee = async () => {
  const diaChi = diaChiDaChon.value;

  if (!diaChi) {
    message.warning("Vui lòng chọn địa chỉ giao hàng");
    return;
  }

  if (!diaChi.districtId || !diaChi.wardCode) {
    message.error(
      "Địa chỉ chưa có districtId hoặc wardCode của GHN",
    );
    return;
  }

  try {
    loadingFee.value = true;
    resetResult();

    const response = await axios.post(
      "/van-chuyen/fee",
      {
        districtId: diaChi.districtId,
        wardCode: diaChi.wardCode,
      },
    );

    const data: PhiVanChuyenData =
      response.data.data;

    phiVanChuyen.value = data.phiVanChuyen;
    phiDichVu.value = data.phiDichVu;
    phiBaoHiem.value = data.phiBaoHiem;

    try {
      const leadTimeResponse = await axios.post(
        "/van-chuyen/lead-time",
        {
          districtId: diaChi.districtId,
          wardCode: diaChi.wardCode,
        },
      );

      const leadTimeData: LeadTimeData =
        leadTimeResponse.data.data;

      thoiGianDuKien.value =
        leadTimeData.leadtime;
    } catch {
      leadTimeError.value = true;
      thoiGianDuKien.value = null;
    }

    message.success(
      "Tính phí vận chuyển thành công",
    );
  } catch {
    resetResult();
    message.error(
      "Không thể tính phí vận chuyển",
    );
  } finally {
    loadingFee.value = false;
  }
};

const filterKhachHang = (
  input: string,
  option: {
    children?: unknown[];
  },
) => {
  const text = String(option.children ?? "")
    .toLowerCase();

  return text.includes(input.toLowerCase());
};

const formatDiaChi = (item: DiaChi) => {
  return [
    item.diaChi,
    item.tenPhuongXa,
    item.tenQuanHuyen,
    item.tenTinhThanh,
  ]
    .filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        value.trim() !== "",
    )
    .join(", ");
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const formatLeadTime = (value: number) => {
  return new Date(
    value * 1000,
  ).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

onMounted(() => {
  loadKhachHangs();
});
</script>

<style scoped>
.ghn-test-page {
  padding: 24px;
}

.address-info {
  margin-bottom: 24px;
}

.address-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.address-detail strong {
  margin-left: 6px;
}

.fee-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 16px;
}

.fee-result strong {
  margin-left: 8px;
}

.lead-time-error {
  color: #fa8c16;
}
</style>
