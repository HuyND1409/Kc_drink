<template>
  <div class="pos-delivery-section">
    <div class="delivery-header-row">
      <span class="delivery-label">📦 Hình thức nhận hàng</span>
    </div>

    <a-radio-group
      v-model:value="deliveryMode"
      :disabled="props.disabled || loading"
      class="delivery-radio-group"
      button-style="solid"
      @change="onDeliveryModeChange"
    >
      <a-radio-button value="AT_STORE" class="delivery-radio-btn">Nhận tại quầy</a-radio-button>
      <a-radio-button value="DELIVERY" class="delivery-radio-btn">Giao hàng</a-radio-button>
    </a-radio-group>

    <!-- Tóm tắt giao hàng -->
    <template v-if="deliveryMode === 'DELIVERY'">
      <div class="delivery-summary">
        <template v-if="currentVanDon">
          <div class="summary-address" :title="currentVanDon.diaChiGiaoHang">
            {{ currentVanDon.diaChiGiaoHang }}
          </div>
          <div class="summary-fee" v-if="phiVanChuyenHienThi > 0">
            Phí: <span class="fee-value">{{ formatVND(phiVanChuyenHienThi) }}</span>
          </div>
        </template>
        <template v-else>
          <div class="summary-address" style="font-style: italic; color: #bfbfbf">Chưa thiết lập giao hàng</div>
        </template>
        <a-button type="link" size="small" @click="openModal" :disabled="props.disabled || loading" style="padding: 0; flex-shrink: 0;">
          {{ currentVanDon ? 'Thay đổi' : 'Thiết lập' }}
        </a-button>
      </div>
    </template>

    <!-- Modal thiết lập giao hàng - Khách có tài khoản -->
    <a-modal
      v-model:open="modalOpen"
      title="Thông tin giao hàng"
      :width="520"
      :footer="null"
      :maskClosable="false"
      v-if="!isKhachLe"
    >
      <div class="delivery-form" v-if="deliveryMode === 'DELIVERY'">
        <a-form layout="vertical">
          <a-form-item label="Địa chỉ nhận hàng" class="mb-2">
            <a-select
              v-model:value="selectedDiaChiId"
              :loading="loadingDiaChi"
              :disabled="loading"
              placeholder="Chọn địa chỉ"
              style="width: 100%"
            >
              <a-select-option
                v-for="dc in diaChis"
                :key="dc.idDiaChi"
                :value="dc.idDiaChi"
              >
                {{ formatDiaChi(dc) }} {{ dc.macDinh ? '(Mặc định)' : '' }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <div v-if="diaChiDaChon" class="delivery-info-box">
            <div class="info-row">
              <span class="info-label">Người nhận:</span>
              <span class="info-value">{{ diaChiDaChon.tenNguoiNhan }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Điện thoại:</span>
              <span class="info-value">{{ diaChiDaChon.sdtNguoiNhan }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Địa chỉ:</span>
              <span class="info-value">{{ formatDiaChi(diaChiDaChon) }}</span>
            </div>
            <div class="info-row" v-if="phiVanChuyenHienThi > 0">
              <span class="info-label">Phí giao hàng:</span>
              <span class="info-value fee-value">{{ formatVND(phiVanChuyenHienThi) }}</span>
            </div>
          </div>

          <a-form-item label="Ghi chú giao hàng" class="mb-2">
            <a-textarea
              v-model:value="ghiChu"
              :disabled="loading"
              placeholder="Nhập ghi chú cho shipper..."
              :rows="2"
            />
          </a-form-item>

          <a-button
            type="primary"
            size="small"
            :loading="loading"
            :disabled="!selectedDiaChiId"
            @click="onUpdateDelivery"
            block
          >
            Cập nhật giao hàng
          </a-button>
        </a-form>
      </div>
    </a-modal>

    <!-- Modal thiết lập giao hàng - Khách lẻ -->
    <a-modal
      v-model:open="modalOpen"
      title="Thông tin giao hàng khách lẻ"
      :width="520"
      :footer="null"
      :maskClosable="false"
      v-else
    >
      <div class="delivery-form" v-if="deliveryMode === 'DELIVERY'">
        <a-form layout="vertical">
          <a-form-item label="Tên người nhận" class="mb-2">
            <a-input
              v-model:value="khachLeForm.tenNguoiNhan"
              :disabled="loading"
              placeholder="Khách lẻ"
            />
          </a-form-item>

          <a-form-item class="mb-2">
            <template #label>
              Số điện thoại <span style="color: #ff4d4f; margin-left: 2px;">*</span>
            </template>
            <a-input
              v-model:value="khachLeForm.sdtNguoiNhan"
              :disabled="loading"
              placeholder="Nhập số điện thoại người nhận"
            />
          </a-form-item>

          <a-form-item label="Tỉnh/Thành" class="mb-2">
            <a-input value="Hà Nội" disabled />
          </a-form-item>

          <a-form-item class="mb-2">
            <template #label>
              Quận/Huyện <span style="color: #ff4d4f; margin-left: 2px;">*</span>
            </template>
            <a-select
              v-model:value="khachLeForm.districtId"
              :loading="loadingDistricts"
              :disabled="loading"
              placeholder="Chọn quận/huyện"
              style="width: 100%"
              @change="onKhachLeDistrictChange"
            >
              <a-select-option
                v-for="item in districts"
                :key="item.code"
                :value="item.code"
              >
                {{ item.name }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item class="mb-2">
            <template #label>
              Phường/Xã <span style="color: #ff4d4f; margin-left: 2px;">*</span>
            </template>
            <a-select
              v-model:value="khachLeForm.wardCode"
              :loading="loadingWards"
              :disabled="loading || !khachLeForm.districtId"
              placeholder="Chọn phường/xã"
              style="width: 100%"
            >
              <a-select-option
                v-for="item in wards"
                :key="item.code"
                :value="item.code"
              >
                {{ item.name }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item class="mb-2">
            <template #label>
              Địa chỉ cụ thể <span style="color: #ff4d4f; margin-left: 2px;">*</span>
            </template>
            <a-input
              v-model:value="khachLeForm.diaChi"
              :disabled="loading"
              placeholder="Ví dụ: Số 10 đường ABC"
            />
          </a-form-item>

          <a-form-item label="Ghi chú" class="mb-2">
            <a-textarea
              v-model:value="khachLeForm.ghiChu"
              :disabled="loading"
              placeholder="Nhập ghi chú cho shipper..."
              :rows="2"
            />
          </a-form-item>

          <a-button
            type="primary"
            size="small"
            :loading="loading"
            @click="onUpdateDeliveryKhachLe"
            block
          >
            Cập nhật giao hàng
          </a-button>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, reactive } from "vue";
import { message } from "ant-design-vue";
import type { HoaDon, VanDonGhnResponse, ThietLapGiaoHangRequest } from "../types/pos";
import type { DiaChi } from "@/modules/dia_chi/types/diaChi";
import { getDiaChi } from "@/modules/dia_chi/api/diaChiApi";
import { getHaNoiDistricts, getWards } from "@/modules/dia_chi/api/haNoiApi";
import type { District, Ward } from "@/modules/dia_chi/api/haNoiApi";
import {
  getHoaDonById,
  getGiaoHangHoaDon,
  thietLapGiaoHangHoaDon,
  boGiaoHangHoaDon,
} from "../api/posApi";

const props = defineProps<{
  hoaDon: HoaDon;
  disabled: boolean;
}>();

const emit = defineEmits<{
  (e: "updated", payload: HoaDon): void;
  (e: "delivery-change", payload: VanDonGhnResponse | null): void;
  (e: "loading-change", payload: boolean): void;
}>();

const loading = ref(false);
const loadingDiaChi = ref(false);

const deliveryMode = ref<"AT_STORE" | "DELIVERY">("AT_STORE");
const diaChis = ref<DiaChi[]>([]);
const selectedDiaChiId = ref<number | null>(null);
const ghiChu = ref<string>("");
const currentVanDon = ref<VanDonGhnResponse | null>(null);

const modalOpen = ref(false);
let activeSequence = 0;

// ── Khách lẻ ──────────────────────────────────────────────────
const districts = ref<District[]>([]);
const wards = ref<Ward[]>([]);
const loadingDistricts = ref(false);
const loadingWards = ref(false);

const khachLeForm = reactive({
  tenNguoiNhan: "",
  sdtNguoiNhan: "",
  districtId: undefined as number | undefined,
  wardCode: undefined as string | undefined,
  diaChi: "",
  ghiChu: "",
});

const isKhachLe = computed(() => !props.hoaDon?.idKhachHang);

const onKhachLeDistrictChange = async (code: number) => {
  khachLeForm.wardCode = undefined;
  wards.value = [];
  if (!code) return;
  loadingWards.value = true;
  try {
    wards.value = await getWards(code);
  } catch (err: any) {
    message.error(err.response?.data?.message || err.message || "Lỗi tải phường/xã");
  } finally {
    loadingWards.value = false;
  }
};

const loadDistrictsIfNeeded = async () => {
  if (districts.value.length > 0) return;
  loadingDistricts.value = true;
  try {
    districts.value = await getHaNoiDistricts();
  } catch (err: any) {
    message.error(err.response?.data?.message || err.message || "Lỗi tải quận/huyện");
  } finally {
    loadingDistricts.value = false;
  }
};

const resetKhachLeForm = () => {
  khachLeForm.tenNguoiNhan = "";
  khachLeForm.sdtNguoiNhan = "";
  khachLeForm.districtId = undefined;
  khachLeForm.wardCode = undefined;
  khachLeForm.diaChi = "";
  khachLeForm.ghiChu = "";
  wards.value = [];
};
// ──────────────────────────────────────────────────────────────

const diaChiDaChon = computed(() => {
  return diaChis.value.find((dc) => dc.idDiaChi === selectedDiaChiId.value) || null;
});

const phiVanChuyenHienThi = computed(() => {
  return currentVanDon.value?.phiVanChuyen ?? props.hoaDon?.phiVanChuyen ?? 0;
});

const formatVND = (val: number) => {
  return val.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

const formatDiaChi = (item: DiaChi) => {
  return [item.diaChi, item.tenPhuongXa, item.tenQuanHuyen, item.tenTinhThanh]
    .filter((value) => value !== null && value !== undefined && value.trim() !== "")
    .join(", ");
};

const setLoading = (val: boolean) => {
  loading.value = val;
  emit("loading-change", val);
};

const normalizeHoaDon = (raw: any): HoaDon => ({
  ...raw,
  chiTiet: raw?.chiTiet ?? [],
});

const loadAddresses = async (idKhachHang: number): Promise<DiaChi[]> => {
  loadingDiaChi.value = true;
  try {
    const res = await getDiaChi(idKhachHang, 0, 100);
    return (res.content || []).filter((dc) => dc.trangThai === 1);
  } catch (err: any) {
    message.error(err.response?.data?.message || err.message || "Lỗi tải địa chỉ khách hàng");
    return [];
  } finally {
    loadingDiaChi.value = false;
  }
};

const refreshHoaDon = async (idHoaDon: number): Promise<HoaDon> => {
  const res = await getHoaDonById(idHoaDon);
  return normalizeHoaDon(res.data?.data ?? res.data);
};

const setDeliveryData = async () => {
  if (!selectedDiaChiId.value) return;
  const hd = props.hoaDon;
  if (!hd) return;

  const currentSeq = ++activeSequence;
  setLoading(true);
  try {
    const req: ThietLapGiaoHangRequest = {
      idDiaChi: selectedDiaChiId.value,
      ghiChu: ghiChu.value || null,
    };
    const res = await thietLapGiaoHangHoaDon(hd.idHoaDon, req);
    if (currentSeq !== activeSequence || hd.idHoaDon !== props.hoaDon?.idHoaDon) return;

    const vanDon = res.data?.data ?? res.data;
    currentVanDon.value = vanDon;
    emit("delivery-change", vanDon);

    const hoaDonMoi = await refreshHoaDon(hd.idHoaDon);
    if (currentSeq !== activeSequence || hd.idHoaDon !== props.hoaDon?.idHoaDon) return;
    emit("updated", hoaDonMoi);

    message.success("Đã cập nhật thông tin giao hàng");
    modalOpen.value = false;
  } catch (err: any) {
    if (currentSeq !== activeSequence || hd.idHoaDon !== props.hoaDon?.idHoaDon) return;
    message.error(err.response?.data?.message || err.message || "Lỗi thiết lập giao hàng");
  } finally {
    if (currentSeq === activeSequence && hd.idHoaDon === props.hoaDon?.idHoaDon) {
      setLoading(false);
    }
  }
};

const onUpdateDeliveryKhachLe = async () => {
  // Validate FE cho khách lẻ
  if (!khachLeForm.sdtNguoiNhan?.trim()) {
    message.warning("Vui lòng nhập số điện thoại người nhận");
    return;
  }
  if (!khachLeForm.districtId) {
    message.warning("Vui lòng chọn Quận/Huyện");
    return;
  }
  if (!khachLeForm.wardCode) {
    message.warning("Vui lòng chọn Phường/Xã");
    return;
  }
  if (!khachLeForm.diaChi?.trim()) {
    message.warning("Vui lòng nhập địa chỉ cụ thể");
    return;
  }

  const hd = props.hoaDon;
  if (!hd) return;

  const currentSeq = ++activeSequence;
  setLoading(true);

  try {
    const districtName = districts.value.find((d) => d.code === khachLeForm.districtId)?.name || "";
    const wardName = wards.value.find((w) => w.code === khachLeForm.wardCode)?.name || "";

    const req: ThietLapGiaoHangRequest = {
      idDiaChi: null,
      tenNguoiNhan: khachLeForm.tenNguoiNhan?.trim() || "Khách lẻ",
      sdtNguoiNhan: khachLeForm.sdtNguoiNhan.trim(),
      diaChi: khachLeForm.diaChi.trim(),
      provinceId: 201,
      districtId: khachLeForm.districtId,
      wardCode: khachLeForm.wardCode,
      tenTinhThanh: "Hà Nội",
      tenQuanHuyen: districtName,
      tenPhuongXa: wardName,
      ghiChu: khachLeForm.ghiChu?.trim() || null,
    };

    const res = await thietLapGiaoHangHoaDon(hd.idHoaDon, req);
    if (currentSeq !== activeSequence || hd.idHoaDon !== props.hoaDon?.idHoaDon) return;

    const vanDon = res.data?.data ?? res.data;
    currentVanDon.value = vanDon;
    emit("delivery-change", vanDon);

    const hoaDonMoi = await refreshHoaDon(hd.idHoaDon);
    if (currentSeq !== activeSequence || hd.idHoaDon !== props.hoaDon?.idHoaDon) return;
    emit("updated", hoaDonMoi);

    message.success("Đã cập nhật thông tin giao hàng");
    modalOpen.value = false;
  } catch (err: any) {
    if (currentSeq !== activeSequence || hd.idHoaDon !== props.hoaDon?.idHoaDon) return;
    message.error(err.response?.data?.message || err.message || "Lỗi thiết lập giao hàng");
  } finally {
    if (currentSeq === activeSequence && hd.idHoaDon === props.hoaDon?.idHoaDon) {
      setLoading(false);
    }
  }
};

const onDeliveryModeChange = async (e: any) => {
  const mode = e.target.value;
  const hd = props.hoaDon;
  if (!hd) return;

  const currentSeq = ++activeSequence;

  if (mode === "DELIVERY") {
    if (!hd.idKhachHang) {
      // Khách lẻ: mở modal nhập thông tin, không cần tải địa chỉ
      if (currentVanDon.value) {
        // Đã có van don rồi, chỉ mở modal để thay đổi
        await loadDistrictsIfNeeded();
        // Pre-fill form nếu đã có van don
        prefillKhachLeFormFromVanDon();
        modalOpen.value = true;
        return;
      }
      await loadDistrictsIfNeeded();
      resetKhachLeForm();
      modalOpen.value = true;
      return;
    }

    if (currentVanDon.value) {
      return;
    }

    setLoading(true);
    const addressList = await loadAddresses(hd.idKhachHang);

    if (currentSeq !== activeSequence || hd.idHoaDon !== props.hoaDon?.idHoaDon) return;

    diaChis.value = addressList;

    if (diaChis.value.length === 0) {
      message.warning("Khách hàng không có địa chỉ nhận hàng khả dụng");
      deliveryMode.value = "AT_STORE";
      setLoading(false);
      return;
    }

    const defaultAddress = diaChis.value.find((dc) => dc.macDinh) || diaChis.value[0];
    if (defaultAddress) {
      selectedDiaChiId.value = defaultAddress.idDiaChi;
    }

    setLoading(false);
    modalOpen.value = true;
  } else {
    setLoading(true);
    try {
      if (currentVanDon.value || hd.phiVanChuyen) {
        await boGiaoHangHoaDon(hd.idHoaDon);
      }
      if (currentSeq !== activeSequence || hd.idHoaDon !== props.hoaDon?.idHoaDon) return;

      currentVanDon.value = null;
      selectedDiaChiId.value = null;
      ghiChu.value = "";
      resetKhachLeForm();
      emit("delivery-change", null);

      const hoaDonMoi = await refreshHoaDon(hd.idHoaDon);
      if (currentSeq !== activeSequence || hd.idHoaDon !== props.hoaDon?.idHoaDon) return;
      emit("updated", hoaDonMoi);

      message.success("Đã chuyển sang nhận tại quầy");
    } catch (err: any) {
      if (currentSeq !== activeSequence || hd.idHoaDon !== props.hoaDon?.idHoaDon) return;
      deliveryMode.value = "DELIVERY";
      message.error(err.response?.data?.message || err.message || "Lỗi hủy giao hàng");
    } finally {
      if (currentSeq === activeSequence && hd.idHoaDon === props.hoaDon?.idHoaDon) {
        setLoading(false);
      }
    }
  }
};

/**
 * Tách phần địa chỉ cụ thể từ diaChiGiaoHang đã gồm địa giới.
 * BE khách lẻ luôn lưu: "địa chỉ cụ thể, phường/xã, quận/huyện, tỉnh"
 * Ví dụ: "số 8, Xã Tự Nhiên, Huyện Thường Tín, Hà Nội" → "số 8"
 * Nếu không đủ điều kiện thì giữ nguyên fullAddress, không phá dữ liệu.
 */
const extractDiaChiCuThe = (fullAddress: string, vd: VanDonGhnResponse): string => {
  if (!fullAddress?.trim()) return "";

  const parts = fullAddress
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  // BE khách lẻ luôn lưu:
  // địa chỉ cụ thể + phường/xã + quận/huyện + tỉnh
  if (
    parts.length >= 4 &&
    vd.tenPhuongXa &&
    vd.tenQuanHuyen &&
    vd.tenTinhThanh
  ) {
    return parts.slice(0, -3).join(", ");
  }

  return fullAddress.trim();
};

const prefillKhachLeFormFromVanDon = () => {
  if (!currentVanDon.value) return;
  const vd = currentVanDon.value;
  khachLeForm.tenNguoiNhan = vd.tenNguoiNhan || "";
  khachLeForm.sdtNguoiNhan = vd.sdtNguoiNhan || "";
  khachLeForm.diaChi = extractDiaChiCuThe(vd.diaChiGiaoHang || "", vd);
  khachLeForm.districtId = vd.districtId || undefined;
  khachLeForm.wardCode = vd.wardCode || undefined;
  khachLeForm.ghiChu = vd.ghiChu || "";
  // Nếu đã có districtId thì cần load wards tương ứng
  if (vd.districtId) {
    loadingWards.value = true;
    getWards(vd.districtId)
      .then((w) => { wards.value = w; })
      .catch(() => {})
      .finally(() => { loadingWards.value = false; });
  }
};

const openModal = async () => {
  const hd = props.hoaDon;
  if (!hd) return;

  if (!hd.idKhachHang) {
    // Khách lẻ
    await loadDistrictsIfNeeded();
    if (currentVanDon.value) {
      prefillKhachLeFormFromVanDon();
    } else {
      resetKhachLeForm();
    }
    modalOpen.value = true;
    return;
  }

  // Khách có tài khoản - giữ nguyên flow cũ
  modalOpen.value = true;

  if (diaChis.value.length === 0) {
    setLoading(true);
    try {
      const addressList = await loadAddresses(hd.idKhachHang);
      diaChis.value = addressList;
    } finally {
      setLoading(false);
    }
  }
};

const onUpdateDelivery = async () => {
  await setDeliveryData();
};

const resetState = () => {
  deliveryMode.value = "AT_STORE";
  diaChis.value = [];
  selectedDiaChiId.value = null;
  ghiChu.value = "";
  currentVanDon.value = null;
  resetKhachLeForm();
};

const initTab = async () => {
  const hd = props.hoaDon;
  const currentSeq = ++activeSequence;
  resetState();
  if (!hd) return;

  if ((hd.phiVanChuyen ?? 0) > 0) {
    deliveryMode.value = "DELIVERY";
    setLoading(true);
    try {
      const res = await getGiaoHangHoaDon(hd.idHoaDon);
      if (currentSeq !== activeSequence || hd.idHoaDon !== props.hoaDon?.idHoaDon) return;

      const vanDon: VanDonGhnResponse = res.data?.data ?? res.data;
      currentVanDon.value = vanDon;
      emit("delivery-change", vanDon);

      // Chỉ load địa chỉ khách hàng nếu không phải khách lẻ
      if (hd.idKhachHang) {
        const addressList = await loadAddresses(hd.idKhachHang);
        if (currentSeq !== activeSequence || hd.idHoaDon !== props.hoaDon?.idHoaDon) return;
        diaChis.value = addressList;
        selectedDiaChiId.value = vanDon.idDiaChi;
        ghiChu.value = vanDon.ghiChu || "";
      }
    } catch (err: any) {
      if (currentSeq !== activeSequence || hd.idHoaDon !== props.hoaDon?.idHoaDon) return;
      console.error("Lỗi lấy thông tin giao hàng:", err);
      deliveryMode.value = "AT_STORE";
    } finally {
      if (currentSeq === activeSequence && hd.idHoaDon === props.hoaDon?.idHoaDon) {
        setLoading(false);
      }
    }
  } else {
    deliveryMode.value = "AT_STORE";
    emit("delivery-change", null);
  }
};

watch(
  () => props.hoaDon?.idHoaDon,
  (newId, oldId) => {
    if (newId !== oldId && newId) {
      initTab();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.pos-delivery-section {
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
  border-bottom: 1px solid #f0f0f0;
}

.delivery-header-row {
  display: flex;
  align-items: center;
}

.delivery-label {
  font-size: 11px;
  color: #8c8c8c;
  text-transform: uppercase;
  font-weight: 500;
}

.delivery-radio-group {
  display: flex;
  width: 100%;
}

.delivery-radio-btn {
  flex: 1;
  text-align: center;
}

.delivery-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  background: #fafafa;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px dashed #d9d9d9;
  max-height: 55px;
}

.summary-address {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #595959;
}

.summary-fee {
  white-space: nowrap;
  color: #595959;
  font-size: 12px;
}

.delivery-form {
  padding: 4px 0;
}

.mb-2 {
  margin-bottom: 8px;
}

.delivery-info-box {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 8px 10px;
  margin-bottom: 8px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-row {
  display: flex;
  justify-content: space-between;
}

.info-label {
  color: #8c8c8c;
}

.info-value {
  color: #262626;
  font-weight: 500;
  text-align: right;
  max-width: 70%;
  word-break: break-word;
}

.fee-value {
  color: #ff4d4f;
  font-weight: 600;
}
</style>
