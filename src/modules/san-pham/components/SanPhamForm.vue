<template>
  <a-modal
    :open="props.open"
    :title="props.editData ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'"
    width="600px"
    ok-text="Lưu"
    cancel-text="Hủy"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleClose"
  >
    <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
      <!-- Ten san pham -->
      <a-form-item label="Tên sản phẩm" name="tenSanPham">
        <a-input
          v-model:value="form.tenSanPham"
          placeholder="VD: Trà sữa Matcha, Trà đào cam sả..."
        />
      </a-form-item>

      <!-- Gia goc -->
      <a-form-item label="Giá gốc (VNĐ)" name="gia">
        <a-input-number
          v-model:value="form.gia"
          placeholder="VD: 35000"
          style="width: 100%"
          :min="0"
          :step="1000"
          :formatter="(value: number) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
          :parser="(value: string) => value.replace(/,/g, '')"
        />
      </a-form-item>

      <!-- Mo ta -->
      <a-form-item label="Mô tả" name="moTa">
        <a-textarea
          v-model:value="form.moTa"
          placeholder="Mô tả ngắn về sản phẩm..."
          :rows="3"
        />
      </a-form-item>

      <!-- Hinh anh san pham -->
      <a-form-item label="Hình ảnh sản phẩm">
        <div style="display: flex; gap: 16px; align-items: flex-end;">
          <div
            style="width: 140px; height: 140px; border: 1px dashed #d9d9d9; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #fafafa;"
          >
            <img v-if="previewUrl" :src="previewUrl" style="width: 100%; height: 100%; object-fit: cover;" />
            <div v-else style="color: #bfbfbf; font-size: 24px;">☕</div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <a-upload
              :before-upload="handleBeforeUpload"
              :show-upload-list="false"
              accept=".jpg,.jpeg,.png,.webp"
            >
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

      <!-- Size ap dung voi phu thu rieng -->
      <a-form-item name="sizeSection">
        <template #label>
          <div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
            <span style="font-weight:600;">Size áp dụng</span>
          </div>
        </template>

        <div v-if="loadingSize" style="padding: 8px 0;">
          <a-spin size="small" /> Đang tải size...
        </div>

        <!-- Danh sach size: checkbox + input phu thu -->
        <div v-else style="display:flex;flex-direction:column;gap:10px;">
          <div
            v-for="s in allSizes"
            :key="s.idSize"
            style="display:flex;align-items:center;gap:12px;"
          >
            <a-checkbox
              :checked="isChecked(s.idSize)"
              @change="(e: any) => toggleSize(s.idSize, e.target.checked)"
              style="min-width:60px;"
            >
              <span style="font-weight:600;">{{ s.tenSize }}</span>
            </a-checkbox>

            <span style="color:#8c8c8c;font-size:13px;white-space:nowrap;">Phụ thu</span>

            <a-input-number
              :value="getPhuThu(s.idSize)"
              :disabled="!isChecked(s.idSize)"
              :min="0"
              :precision="0"
              :step="1000"
              style="width:140px;"
              :formatter="(v: number) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
              :parser="(v: string) => v.replace(/,/g, '')"
              @change="(v: number | null) => setPhuThu(s.idSize, v)"
            />

            <span style="color:#8c8c8c;font-size:13px;">₫</span>
          </div>
        </div>

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
  // editSanPhamSizes: SanPhamSize hien tai (co phuThu rieng)
  editSanPhamSizes?: { idSize: number; phuThu: number }[];
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

// Map: idSize -> phuThu (chi luu nhung size duoc tick)
const phuThuMap = ref<Record<number, number>>({});
// Set cac size duoc tick
const checkedSizeIds = ref<Set<number>>(new Set());

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

const getPhuThu = (idSize: number): number => phuThuMap.value[idSize] ?? 0;

const setPhuThu = (idSize: number, v: number | null) => {
  phuThuMap.value[idSize] = v ?? 0;
};

const toggleSize = (idSize: number, checked: boolean) => {
  if (checked) {
    checkedSizeIds.value.add(idSize);
    if (!(idSize in phuThuMap.value)) {
      phuThuMap.value[idSize] = 0;
    }
  } else {
    checkedSizeIds.value.delete(idSize);
  }
  sizeError.value = false;
};

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

        // Load phuThu rieng tu editSanPhamSizes
        const newChecked = new Set<number>();
        const newPhuThu: Record<number, number> = {};
        for (const s of props.editSanPhamSizes ?? []) {
          newChecked.add(s.idSize);
          newPhuThu[s.idSize] = s.phuThu;
        }
        checkedSizeIds.value = newChecked;
        phuThuMap.value = newPhuThu;
      } else {
        resetForm();
      }
      sizeError.value = false;
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
  phuThuMap.value = {};
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

    loading.value = true;

    const product: SanPhamRequest = {
      tenSanPham: form.tenSanPham.trim(),
      gia: form.gia as number,
      moTa: form.moTa.trim() || null,
      idDanhMuc: props.editData?.idDanhMuc ?? null,
    };

    const selectedSizes: ProductSizeSelection[] = Array.from(checkedSizeIds.value).map(
      (idSize) => ({
        idSize,
        phuThu: phuThuMap.value[idSize] ?? 0,
      })
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
