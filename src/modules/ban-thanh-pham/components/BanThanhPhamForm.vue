<template>
  <a-modal
    :open="props.open"
    :title="props.editData ? 'Cập nhật bán thành phẩm' : 'Thêm bán thành phẩm mới'"
    width="500px"
    ok-text="Lưu"
    cancel-text="Hủy"
    :confirm-loading="loading"
    :ok-button-props="{ disabled: loading }"
    @ok="handleSubmit"
    @cancel="handleClose"
  >
    <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
      <!-- Ten -->
      <a-form-item label="Tên bán thành phẩm" name="tenBanThanhPham">
        <a-input
          v-model:value="form.tenBanThanhPham"
          placeholder="VD: Cốt trà đen, Cốt trà nhài..."
        />
      </a-form-item>

      <!-- Don vi tinh -->
      <a-form-item label="Đơn vị tính" name="donViTinh">
        <a-auto-complete
          v-model:value="form.donViTinh"
          :options="donViOptions"
          placeholder="VD: ml, l, g, kg..."
          style="width:100%"
          :filter-option="(input: string, opt: any) => opt.value.toLowerCase().includes(input.toLowerCase())"
        />
      </a-form-item>

      <!-- Han su dung -->
      <a-form-item label="Hạn sử dụng (giờ)" name="hanSuDungGio">
        <a-input-number
          v-model:value="form.hanSuDungGio"
          style="width:100%"
          :min="1"
          :precision="0"
          placeholder="VD: 24"
        />
        <div style="color:#8c8c8c;font-size:12px;margin-top:4px;">
          Để trống nếu không giới hạn thời gian
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { FormInstance, Rule } from "ant-design-vue/es/form";
import type { BanThanhPham, BanThanhPhamRequest } from "../types/banThanhPham";

const props = defineProps<{
  open: boolean;
  editData?: BanThanhPham;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", data: BanThanhPhamRequest): void;
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);

const donViOptions = [
  { value: "ml" },
  { value: "l" },
  { value: "g" },
  { value: "kg" },
];

const form = reactive<{
  tenBanThanhPham: string;
  donViTinh: string;
  hanSuDungGio: number | null;
}>({
  tenBanThanhPham: "",
  donViTinh: "",
  hanSuDungGio: null,
});

const rules: Record<string, Rule[]> = {
  tenBanThanhPham: [
    { required: true, message: "Vui lòng nhập tên bán thành phẩm", trigger: "blur" },
    { min: 2, message: "Tên tối thiểu 2 ký tự", trigger: "blur" },
  ],
  donViTinh: [
    { required: true, message: "Vui lòng nhập đơn vị tính", trigger: "blur" },
  ],
  hanSuDungGio: [
    {
      validator: (_: unknown, value: number | null) => {
        if (value !== null && value !== undefined && value < 1) {
          return Promise.reject("Hạn sử dụng phải >= 1 giờ");
        }
        return Promise.resolve();
      },
      trigger: "change",
    },
  ],
};

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (props.editData) {
        form.tenBanThanhPham = props.editData.tenBanThanhPham;
        form.donViTinh = props.editData.donViTinh;
        form.hanSuDungGio = props.editData.hanSuDungGio ?? null;
      } else {
        resetForm();
      }
    }
  }
);

const resetForm = () => {
  form.tenBanThanhPham = "";
  form.donViTinh = "";
  form.hanSuDungGio = null;
  formRef.value?.clearValidate();
};

const handleClose = () => {
  resetForm();
  emit("close");
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;
    const data: BanThanhPhamRequest = {
      tenBanThanhPham: form.tenBanThanhPham.trim(),
      donViTinh: form.donViTinh.trim(),
      hanSuDungGio: form.hanSuDungGio ?? null,
    };
    emit("save", data);
  } catch {
    // validation failed
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
:deep(.ant-modal-title) { font-size: 18px; font-weight: 700; }
:deep(.ant-form-item-label > label) { font-weight: 600; }
:deep(.ant-input), :deep(.ant-input-number), :deep(.ant-select-selector) {
  border-radius: 8px !important;
}
</style>
