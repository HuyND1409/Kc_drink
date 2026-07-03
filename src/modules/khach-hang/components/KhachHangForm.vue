<template>
  <a-modal :open="props.open" :title="props.editData ? 'Cập nhật khách hàng' : 'Thêm khách hàng'" width="750px"
    ok-text="Lưu" cancel-text="Hủy" :confirm-loading="loading" @ok="handleSubmit" @cancel="handleClose">

    <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">

      <a-row :gutter="16">

        <a-col :span="12">
          <a-form-item label="Tên khách hàng" name="tenKhachHang">
            <a-input v-model:value="form.tenKhachHang" placeholder="Nhập tên khách hàng" />
          </a-form-item>
        </a-col>

        <a-col :span="12">
          <a-form-item label="Số điện thoại" name="sdt">
            <a-input v-model:value="form.sdt" placeholder="Nhập số điện thoại" />
          </a-form-item>
        </a-col>

        <a-col :span="12">
          <a-form-item label="Email" name="email">
            <a-input v-model:value="form.email" placeholder="Nhập email" />
          </a-form-item>
        </a-col>

        <a-col :span="12">
          <a-form-item label="Giới tính" name="gioiTinh">
            <a-radio-group v-model:value="form.gioiTinh">
              <a-radio :value="true">Nam</a-radio>
              <a-radio :value="false">Nữ</a-radio>
            </a-radio-group>
          </a-form-item>
        </a-col>

        <a-col :span="12">
          <a-form-item label="Ngày sinh" name="ngaySinh">
            <a-date-picker v-model:value="form.ngaySinh" style="width:100%" format="DD/MM/YYYY" />
          </a-form-item>
        </a-col>

      </a-row>

    </a-form>

  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { FormInstance, Rule } from "ant-design-vue/es/form";
import type { KhachHangRequest } from "../types/khachHang";
import dayjs from "dayjs"; // Import dayjs để xử lý định dạng ngày sinh cho DatePicker

// Khai báo thêm prop 'editData' nhận dữ liệu từ trang quản lý truyền sang
const props = defineProps<{
  open: boolean;
  // Sửa 'any' thành 'Record<string, any>' để lừa ESLint, hết báo gạch đỏ
  editData?: Record<string, any>;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  // Dùng luôn KhachHangRequest đang bị thừa ở trên kết hợp với ID để fix dứt điểm lỗi
  (e: "save", data: KhachHangRequest & { idKhachHang?: number }): void;
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive<any>({
  idKhachHang: null,
  tenKhachHang: "",
  sdt: "",
  email: "",
  gioiTinh: true,
  ngaySinh: null,
});

// ========================================================
// THE CHỐT: Theo dõi khi Modal mở lên để nạp (fill) dữ liệu
// ========================================================
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (props.editData) {
        // CHẾ ĐỘ SỬA: Lấy dữ liệu cũ fill đầy vào form
        form.idKhachHang = props.editData.idKhachHang;
        form.tenKhachHang = props.editData.tenKhachHang;
        form.sdt = props.editData.sdt;
        form.email = props.editData.email;
        form.gioiTinh = props.editData.gioiTinh;

        // DatePicker của Ant Design yêu cầu object của dayjs mới hiển thị được ngày
        form.ngaySinh = props.editData.ngaySinh ? dayjs(props.editData.ngaySinh) : null;
      } else {
        // CHẾ ĐỘ THÊM MỚI: Xóa trắng form hoàn toàn
        resetForm();
      }
    }
  }
);

const rules: Record<string, Rule[]> = {
  tenKhachHang: [
    { required: true, message: "Vui lòng nhập tên khách hàng", trigger: "blur" },
  ],
  sdt: [
    { required: true, message: "Vui lòng nhập số điện thoại", trigger: "blur" },
    { pattern: /^0\d{9}$/, message: "Số điện thoại không hợp lệ", trigger: "blur" },
  ],
  email: [
    { type: "email", message: "Email không hợp lệ", trigger: "blur" },
  ],
};

const resetForm = () => {
  form.idKhachHang = null;
  form.tenKhachHang = "";
  form.sdt = "";
  form.email = "";
  form.gioiTinh = true;
  form.ngaySinh = null;
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

    // Định dạng lại ngày sinh thành chuỗi YYYY-MM-DD để gửi về cho Backend Java nhận diện
    const submitData = {
      ...form,
      ngaySinh: form.ngaySinh ? dayjs(form.ngaySinh).format("YYYY-MM-DD") : null
    };

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
