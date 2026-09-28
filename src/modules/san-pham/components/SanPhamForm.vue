<template>
  <a-modal :open="props.open" :title="props.editData ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'" width="600px"
    ok-text="Lưu" cancel-text="Hủy" :confirm-loading="loading"
    :style="{ top: '20px' }"
    :body-style="{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', paddingRight: '12px' }"
    @ok="handleSubmit" @cancel="handleClose">
    <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
      <!-- Ten san pham -->
      <a-form-item label="Tên sản phẩm" name="tenSanPham">
        <a-input v-model:value="form.tenSanPham" placeholder="VD: Trà sữa Matcha, Trà đào cam sả..." />
      </a-form-item>

      <!-- Gia goc -->
      <a-form-item label="Giá gốc (VNĐ)" name="gia">
        <a-input-number v-model:value="form.gia" placeholder="VD: 35000" style="width: 100%" :min="0" :step="1000"
          :formatter="(value: number) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
          :parser="(value: string) => value.replace(/,/g, '')" />
      </a-form-item>

      <!-- Mo ta -->
      <a-form-item label="Mô tả" name="moTa">
        <a-textarea v-model:value="form.moTa" placeholder="Mô tả ngắn về sản phẩm..." :rows="3" />
      </a-form-item>

      <!-- Hinh anh san pham -->
      <a-form-item label="Hình ảnh sản phẩm">
        <div style="display: flex; gap: 16px; align-items: flex-end;">
          <div
            style="width: 140px; height: 140px; border: 1px dashed #d9d9d9; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #fafafa;">
            <img v-if="previewUrl" :src="previewUrl" style="width: 100%; height: 100%; object-fit: cover;" />
            <div v-else style="color: #bfbfbf; font-size: 24px;">☕</div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <a-upload :before-upload="handleBeforeUpload" :show-upload-list="false" accept=".jpg,.jpeg,.png,.webp">
              <a-button>
                {{ previewUrl ? 'Thay ảnh' : 'Chọn ảnh' }}
              </a-button>
            </a-upload>

            <a-button v-if="previewUrl" danger @click="handleRemoveImage">
              Xóa ảnh
            </a-button>
            <span style="font-size: 12px; color: #8c8c8c;">Hỗ trợ JPG, PNG, WebP (Tối đa 5MB)</span>
          </div>
        </div>
      </a-form-item>

      <!-- Size ap dung -->
      <a-form-item name="sizeSection">
        <template #label>
          <div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
            <span style="font-weight:600;">Size áp dụng</span>
          </div>
        </template>

        <div v-if="loadingSize" style="padding: 8px 0;">
          <a-spin size="small" /> Đang tải size...
        </div>

        <!-- Danh sach size -->
        <div v-else style="display:flex;flex-direction:column;gap:8px;">
          <div v-for="s in allSizes" :key="s.idSize"
            style="border:1px solid #f0f0f0;border-radius:8px;padding:10px 12px;">
            <!-- Dong 1: checkbox + % + gia du kien -->
            <div style="display:flex;align-items:center;gap:12px;">
              <a-checkbox :checked="isChecked(s.idSize)" @change="(e: any) => toggleSize(s.idSize, e.target.checked)"
                style="min-width:80px;">
                <span style="font-weight:600;">{{ s.tenSize }}</span>
              </a-checkbox>

              <span style="color:#1677ff;font-weight:600;min-width:70px;">
                +{{ Number(s.tyLeTangGia ?? 0) }}%
              </span>

              <span v-if="form.gia != null && form.gia > 0" style="color:#595959;font-size:13px;">
                Giá dự kiến:
                <b>{{ formatMoney(tinhGiaDuKienTheoSize(s)) }}</b>
              </span>
            </div>

            <!-- Dong 2: Auto / Manual (chi hien khi size duoc tick) -->
            <div v-if="isChecked(s.idSize)" style="margin-top:10px;padding-left:4px;">
              <a-radio-group :value="tuDongTinhMap[s.idSize] !== false ? 'auto' : 'manual'"
                @change="(e: any) => handleChangePriceMode(s.idSize, e.target.value)"
                style="display:flex;flex-direction:column;gap:4px;">
                <a-radio value="auto">
                  <span>Tự động theo %</span>
                  <span v-if="form.gia != null && form.gia > 0 && tuDongTinhMap[s.idSize] !== false"
                    style="margin-left:8px;color:#8c8c8c;font-size:12px;">
                    — Giá dự kiến: {{ formatMoney(tinhGiaDuKienAuto(s)) }}
                  </span>
                </a-radio>
                <a-radio value="manual">
                  <span>Phụ thu tùy chỉnh</span>
                </a-radio>
              </a-radio-group>

              <!-- Input phu thu manual -->
              <div v-if="tuDongTinhMap[s.idSize] === false"
                style="margin-top:8px;padding-left:24px;display:flex;align-items:center;gap:12px;">
                <a-input-number :value="phuThuManualMap[s.idSize] ?? 0"
                  @update:value="(v: number | null) => handleManualPriceChange(s.idSize, v)" :min="0"
                  :precision="0" :step="1000"
                  :formatter="(value: number) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                  :parser="(value: string) => value.replace(/,/g, '')" style="width:160px;"
                  placeholder="Nhập phụ thu (VNĐ)" />
                <span v-if="form.gia != null && form.gia > 0" style="color:#595959;font-size:13px;">
                  Giá dự kiến:
                  <b>{{ formatMoney(tinhGiaDuKienManual(s.idSize)) }}</b>
                </span>
              </div>

              <!-- Loi validation manual -->
              <div v-if="manualErrors[s.idSize]" style="color:#ff4d4f;font-size:12px;margin-top:4px;padding-left:24px;">
                {{ manualErrors[s.idSize] }}
              </div>
            </div>
          </div>
        </div>
<!-- 
        <div style="color:#8c8c8c;font-size:12px;margin-top:8px;font-style:italic;">
          Giá size được hệ thống tự tính từ giá gốc và tỷ lệ tăng giá. Giá thực tế được Backend xác nhận khi lưu.
        </div> -->

        <div v-if="sizeError" style="color: #ff4d4f; font-size: 13px; margin-top: 6px;">
          Vui lòng chọn ít nhất 1 size
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onUnmounted } from "vue";
import { message } from "ant-design-vue";
import type { FormInstance, Rule } from "ant-design-vue/es/form";
import type { AxiosError } from "axios";
import type { SanPham, SanPhamRequest, Size, ProductSizeSelection, SanPhamFormPayload } from "../types/sanPham";
import { getAllSize, getSanPhamImageUrl } from "../api/sanPhamApi";

const props = defineProps<{
  open: boolean;
  editData?: SanPham;
  // editSanPhamSizes: SanPhamSize hien tai (co phuThu va tuDongTinh rieng)
  editSanPhamSizes?: { idSize: number; phuThu: number; tuDongTinh?: boolean }[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", payload: SanPhamFormPayload): void;
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);
const loadingSize = ref(false);
const sizeError = ref(false);
const allSizes = ref<Size[]>([]);

// Set cac size duoc tick
const checkedSizeIds = ref<Set<number>>(new Set());

// Map idSize -> tuDongTinh (true = Auto, false = Manual)
const tuDongTinhMap = ref<Record<number, boolean>>({});

// Map idSize -> phuThu khi Manual
const phuThuManualMap = ref<Record<number, number>>({});

// Map idSize -> thong bao loi validation manual
const manualErrors = ref<Record<number, string>>({});

const handleChangePriceMode = (
  idSize: number,
  mode: "auto" | "manual"
) => {
  const isAuto = mode === "auto";

  tuDongTinhMap.value[idSize] = isAuto;

  if (!isAuto && phuThuManualMap.value[idSize] == null) {
    phuThuManualMap.value[idSize] = 0;
  }

  if (manualErrors.value[idSize]) {
    delete manualErrors.value[idSize];
  }
};

const handleManualPriceChange = (
  idSize: number,
  value: number | null
) => {
  const newValue = value == null ? 0 : Number(value);

  phuThuManualMap.value = {
    ...phuThuManualMap.value,
    [idSize]: newValue,
  };

  if (manualErrors.value[idSize]) {
    const nextErrors = { ...manualErrors.value };
    delete nextErrors[idSize];
    manualErrors.value = nextErrors;
  }
};

const form = reactive<{
  tenSanPham: string;
  gia: number | null;
  moTa: string;
}>({
  tenSanPham: "",
  gia: null,
  moTa: "",
});

// Image state
const imageFile = ref<File | null>(null);
const removeImage = ref(false);
const previewUrl = ref<string>("");

const cleanupPreviewUrl = () => {
  if (previewUrl.value && previewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl.value);
  }
};

const handleBeforeUpload = (file: File) => {
  const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp";
  if (!isJpgOrPng) {
    message.error("Bạn chỉ có thể upload file JPG, PNG hoặc WebP!");
    return false;
  }
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    message.error("Kích thước ảnh không được vượt quá 5MB!");
    return false;
  }

  cleanupPreviewUrl();
  imageFile.value = file;
  removeImage.value = false;
  previewUrl.value = URL.createObjectURL(file);
  return false;
};

const handleRemoveImage = () => {
  cleanupPreviewUrl();
  imageFile.value = null;
  removeImage.value = true;
  previewUrl.value = "";
};

onUnmounted(() => {
  cleanupPreviewUrl();
});

// ============================================================
// Helpers
// ============================================================
const isChecked = (idSize: number) => checkedSizeIds.value.has(idSize);

const toggleSize = (idSize: number, checked: boolean) => {
  if (checked) {
    checkedSizeIds.value.add(idSize);
    // Mac dinh: size moi tick => Auto, phuThu manual = 0 (neu chua co)
    if (tuDongTinhMap.value[idSize] === undefined) {
      tuDongTinhMap.value[idSize] = true;
    }
    if (phuThuManualMap.value[idSize] === undefined) {
      phuThuManualMap.value[idSize] = 0;
    }
  } else {
    checkedSizeIds.value.delete(idSize);
    // Xoa loi manual khi bo tick
    delete manualErrors.value[idSize];
  }
  sizeError.value = false;
};

// ============================================================
// Tinh gia du kien (chi de hien thi - khong gui len Backend)
// ============================================================

// Auto: tinh theo % HALF_UP lam tron 1000, khop voi Backend BigDecimal
const tinhGiaDuKienAuto = (size: Size): number => {
  const giaGoc = Math.round(Number(form.gia ?? 0));
  if (giaGoc <= 0) return 0;

  const tyLeBasisPoint = Math.round(Number(size.tyLeTangGia ?? 0) * 100);
  const numerator = giaGoc * (10000 + tyLeBasisPoint);

  return Math.floor((numerator + 5_000_000) / 10_000_000) * 1000;
};

// Manual: giaGoc + phuThu tuy chinh
const tinhGiaDuKienManual = (idSize: number): number => {
  const giaGoc = Number(form.gia ?? 0);
  if (giaGoc <= 0) return 0;
  return giaGoc + Number(phuThuManualMap.value[idSize] ?? 0);
};

// Ham tinh gia du kien theo mode hien tai cua size (dung trong dong row tong quat)
const tinhGiaDuKienTheoSize = (size: Size): number => {
  const giaGoc = Number(form.gia ?? 0);
  if (giaGoc <= 0) return 0;
  const isAuto = tuDongTinhMap.value[size.idSize] !== false;
  if (!isAuto) {
    return tinhGiaDuKienManual(size.idSize);
  }
  return tinhGiaDuKienAuto(size);
};

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

// ============================================================
// Load sizes
// ============================================================
const loadSizes = async () => {
  loadingSize.value = true;
  try {
    const res = await getAllSize();
    const data = res.data.data;
    allSizes.value = Array.isArray(data)
      ? [...data].sort((a: Size, b: Size) => a.thuTu - b.thuTu)
      : [];
  } catch {
    allSizes.value = [];
  } finally {
    loadingSize.value = false;
  }
};

// ============================================================
// Watch props.open
// ============================================================
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      await loadSizes();
      cleanupPreviewUrl();
      imageFile.value = null;
      removeImage.value = false;

      if (props.editData) {
        form.tenSanPham = props.editData.tenSanPham;
        form.gia = props.editData.gia;
        form.moTa = props.editData.moTa ?? "";
        previewUrl.value = getSanPhamImageUrl(props.editData.hinhAnh);

        // Load idSize, tuDongTinh, phuThu manual tu editSanPhamSizes
        const newChecked = new Set<number>();
        const newTuDongTinh: Record<number, boolean> = {};
        const newPhuThuManual: Record<number, number> = {};

        for (const s of props.editSanPhamSizes ?? []) {
          newChecked.add(s.idSize);
          // backend tra false => Manual; true hoac undefined => Auto
          newTuDongTinh[s.idSize] = s.tuDongTinh !== false;
          newPhuThuManual[s.idSize] = Number(s.phuThu ?? 0);
        }

        checkedSizeIds.value = newChecked;
        tuDongTinhMap.value = newTuDongTinh;
        phuThuManualMap.value = newPhuThuManual;
      } else {
        resetForm();
      }
      sizeError.value = false;
      manualErrors.value = {};
    }
  }
);

// ============================================================
// Rules
// ============================================================
const rules: Record<string, Rule[]> = {
  tenSanPham: [
    { required: true, message: "Vui lòng nhập tên sản phẩm", trigger: "blur" },
    { min: 2, message: "Tên sản phẩm tối thiểu 2 ký tự", trigger: "blur" },
  ],
  gia: [
    { required: true, message: "Vui lòng nhập giá gốc", trigger: "blur" },
    { type: "number", min: 0, message: "Giá phải >= 0", trigger: "blur" },
  ],
};

const resetForm = () => {
  form.tenSanPham = "";
  form.gia = null;
  form.moTa = "";
  previewUrl.value = "";
  imageFile.value = null;
  removeImage.value = false;
  checkedSizeIds.value = new Set();
  tuDongTinhMap.value = {};
  phuThuManualMap.value = {};
  manualErrors.value = {};
  sizeError.value = false;
  formRef.value?.clearValidate();
};

const handleClose = () => {
  resetForm();
  emit("close");
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();

    if (checkedSizeIds.value.size === 0) {
      sizeError.value = true;
      return;
    }

    // Validation manual phuThu
    const newManualErrors: Record<number, string> = {};
    let hasManualError = false;

    for (const idSize of checkedSizeIds.value) {
      const isAuto = tuDongTinhMap.value[idSize] !== false;
      if (!isAuto) {
        const val = phuThuManualMap.value[idSize];
        if (val === null || val === undefined) {
          newManualErrors[idSize] = "Vui lòng nhập phụ thu tùy chỉnh";
          hasManualError = true;
        } else if (Number(val) < 0) {
          newManualErrors[idSize] = "Phụ thu không được nhỏ hơn 0";
          hasManualError = true;
        }
      }
    }

    manualErrors.value = newManualErrors;

    if (hasManualError) {
      return;
    }

    loading.value = true;

    const product: SanPhamRequest = {
      tenSanPham: form.tenSanPham.trim(),
      gia: form.gia as number,
      moTa: form.moTa.trim() || null,
      idDanhMuc: props.editData?.idDanhMuc ?? null,
    };

    // Tao selectedSizes voi tuDongTinh va phuThu dung
    const selectedSizes: ProductSizeSelection[] = Array.from(checkedSizeIds.value).map(
      (idSize) => {
        const tuDongTinh = tuDongTinhMap.value[idSize] !== false;
        return {
          idSize,
          tuDongTinh,
          // Auto: gui phuThu = 0 (Backend tu tinh)
          // Manual: gui dung so nguoi dung nhap
          phuThu: tuDongTinh
            ? 0
            : Number(phuThuManualMap.value[idSize] ?? 0),
        };
      }
    );

    const payload: SanPhamFormPayload = {
      product,
      selectedSizes,
      imageFile: imageFile.value,
      removeImage: removeImage.value
    };

    emit("save", payload);
  } catch {
    // form validation failed
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
:deep(.ant-modal-title) {
  font-size: 20px;
  font-weight: 700;
}

:deep(.ant-form-item-label > label) {
  font-weight: 600;
  width: 100%;
}

:deep(.ant-input),
:deep(.ant-select-selector),
:deep(.ant-input-number),
:deep(.ant-input-textarea) {
  border-radius: 8px !important;
}

:deep(.ant-btn) {
  border-radius: 8px;
}
</style>
