<template>
  <a-modal
    :open="props.open"
    :title="props.editData ? 'Cập nhật topping' : 'Thêm topping mới'"
    width="500px"
    ok-text="Lưu"
    cancel-text="Hủy"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleClose"
  >
    <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
      <a-form-item label="Tên Topping" name="tenTopping">
        <a-input
          v-model:value="form.tenTopping"
          placeholder="VD: Trân châu đen, Thạch dừa, Pudding..."
        />
      </a-form-item>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="Giá (VNĐ)" name="giaTopping">
            <a-input-number
              v-model:value="form.giaTopping"
              placeholder="VD: 5000"
              style="width: 100%"
              :min="1"
              :step="500"
              :formatter="(value: number) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
              :parser="(value: string) => value.replace(/,/g, '')"
            />
          </a-form-item>
        </a-col>

        <a-col :span="12">
          <a-form-item label="Tổng Tồn Kho" name="tongTonKho">
            <a-input-number
              v-model:value="form.tongTonKho"
              placeholder="VD: 100"
              style="width: 100%"
              :min="0"
              :step="10"
            />
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item label="Trạng thái" name="trangThai">
        <div style="display: flex; align-items: center; gap: 10px;">
          <a-switch
            :checked="form.trangThai === 1"
            checked-children="Đang bán"
            un-checked-children="Ngừng bán"
            @change="(checked: boolean) => form.trangThai = checked ? 1 : 0"
          />
          <span style="font-size: 13px; color: #8c8c8c;">
            {{ form.trangThai === 1 ? 'Hiển thị trên menu bán hàng' : 'Ẩn khỏi menu bán hàng' }}
          </span>
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { FormInstance, Rule } from "ant-design-vue/es/form";
import type { Topping, ToppingRequest } from "../types/topping";

const props = defineProps<{
  open: boolean;
  editData?: Topping;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", data: ToppingRequest & { idTopping?: number }): void;
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive<ToppingRequest & { idTopping?: number | null }>({
  idTopping: null,
  tenTopping: "",
  giaTopping: null as unknown as number,
  tongTonKho: 0,
  trangThai: 1,
});

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (props.editData) {
        form.idTopping = props.editData.idTopping;
        form.tenTopping = props.editData.tenTopping;
        form.giaTopping = props.editData.giaTopping;
        form.tongTonKho = props.editData.tongTonKho ?? 0;
        form.trangThai = props.editData.trangThai ?? 1;
      } else {
        resetForm();
      }
    }
  }
);

const rules: Record<string, Rule[]> = {
  tenTopping: [
    { required: true, message: "Vui lòng nhập tên topping", trigger: "blur" },
    { min: 2, message: "Tên topping tối thiểu 2 ký tự", trigger: "blur" },
  ],
  giaTopping: [
    { required: true, message: "Vui lòng nhập giá topping", trigger: "blur" },
    {
      type: "number",
      min: 1,
      message: "Giá phải lớn hơn 0",
      trigger: "blur",
    },
  ],
  tongTonKho: [
    { required: true, message: "Vui lòng nhập tổng tồn kho", trigger: "blur" },
    {
      type: "number",
      min: 0,
      message: "Tổng tồn kho phải lớn hơn hoặc bằng 0",
      trigger: "blur",
    },
  ],
};

const resetForm = () => {
  form.idTopping = null;
  form.tenTopping = "";
  form.giaTopping = null as unknown as number;
  form.tongTonKho = 0;
  form.trangThai = 1;
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

    const submitData: ToppingRequest & { idTopping?: number } = {
      tenTopping: form.tenTopping,
      giaTopping: form.giaTopping,
      tongTonKho: form.tongTonKho,
      trangThai: form.trangThai,
    };
    if (form.idTopping) {
      submitData.idTopping = form.idTopping;
    }

    emit("save", submitData);
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
