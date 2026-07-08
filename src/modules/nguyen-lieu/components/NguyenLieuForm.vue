<template>
  <a-modal
    :open="open"
    title="Thêm nguyên liệu mới"
    width="520px"
    ok-text="Lưu"
    cancel-text="Hủy"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleClose"
  >
    <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">

      <a-form-item label="Tên nguyên liệu" name="tenNguyenLieu">
        <a-input
          v-model:value="form.tenNguyenLieu"
          placeholder="VD: Đường cát trắng, Sữa tươi nguyên chất..."
        />
      </a-form-item>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="Đơn vị tính" name="donViTinh">
            <a-select
              v-model:value="form.donViTinh"
              placeholder="Chọn đơn vị tính"
              allow-clear
              style="width: 100%"
            >
              <a-select-option value="kg">kg (kilogram)</a-select-option>
              <a-select-option value="g">g (gram)</a-select-option>
              <a-select-option value="l">l (lít)</a-select-option>
              <a-select-option value="ml">ml (mililit)</a-select-option>
              <a-select-option value="gói">gói</a-select-option>
              <a-select-option value="hộp">hộp</a-select-option>
              <a-select-option value="chai">chai</a-select-option>
              <a-select-option value="lon">lon</a-select-option>
              <a-select-option value="thùng">thùng</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>

        <a-col :span="12">
          <a-form-item label="Ngưỡng tồn kho cảnh báo" name="nguongTonKho">
            <a-input-number
              v-model:value="form.nguongTonKho"
              placeholder="VD: 100"
              style="width: 100%"
              :min="0"
              :step="10"
            />
          </a-form-item>
        </a-col>
      </a-row>

    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { FormInstance, Rule } from "ant-design-vue/es/form";
import type { NguyenLieuRequest } from "../types/nguyenLieu";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", data: NguyenLieuRequest): void;
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive<NguyenLieuRequest>({
  tenNguyenLieu: "",
  donViTinh: "",
  nguongTonKho: null as unknown as number,
});

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      resetForm();
    }
  }
);

const rules: Record<string, Rule[]> = {
  tenNguyenLieu: [
    { required: true, message: "Vui lòng nhập tên nguyên liệu", trigger: "blur" },
    { min: 2, message: "Tên nguyên liệu tối thiểu 2 ký tự", trigger: "blur" },
  ],
  donViTinh: [
    { required: true, message: "Vui lòng chọn đơn vị tính", trigger: "change" },
  ],
  nguongTonKho: [
    { required: true, message: "Vui lòng nhập ngưỡng tồn kho", trigger: "blur" },
    { type: "number", min: 0, message: "Ngưỡng tồn kho phải ≥ 0", trigger: "blur" },
  ],
};

const resetForm = () => {
  form.tenNguyenLieu = "";
  form.donViTinh = "";
  form.nguongTonKho = null as unknown as number;
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
    emit("save", { ...form });
    resetForm();
  } catch (error) {
    console.error("Validate thất bại:", error);
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
}

:deep(.ant-input),
:deep(.ant-select-selector),
:deep(.ant-picker),
:deep(.ant-input-number) {
  border-radius: 8px !important;
}

:deep(.ant-btn) {
  border-radius: 8px;
}
</style>
