<template>
  <a-modal :open="props.open" :title="props.editData ? 'Cập nhật Mã giảm giá' : 'Thêm mới Mã giảm giá'" width="800px"
    ok-text="Lưu lại" cancel-text="Hủy bỏ" :confirm-loading="loading" @ok="handleSubmit" @cancel="handleClose">

    <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="Mã Voucher (Code)" name="maVoucher">
            <a-input v-model:value="form.maVoucher" placeholder="VD: SALE88, CHAOHE2024..." :disabled="!!props.editData"
              style="text-transform: uppercase;" />
          </a-form-item>
        </a-col>

        <a-col :span="12">
          <a-form-item label="Tên chương trình khuyến mãi" name="tenVoucher">
            <a-input v-model:value="form.tenVoucher" placeholder="Nhập tên chương trình..." />
          </a-form-item>
        </a-col>

        <a-col :span="8">
          <a-form-item label="Hình thức giảm" name="loaiVoucher">
            <a-select v-model:value="form.loaiVoucher">
              <a-select-option value="PERCENT">Giảm theo %</a-select-option>
              <a-select-option value="FIXED">Giảm tiền mặt (VNĐ)</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>

        <a-col :span="8">
          <a-form-item label="Mức giảm" name="giaTriGiam">
            <a-input-number :key="form.loaiVoucher" v-model:value="form.giaTriGiam" :min="1" style="width: 100%"
              :formatter="(value: any) => value ? (form.loaiVoucher === 'PERCENT' ? `${value}%` : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')) : ''"
              :parser="(value: any) => String(value).replace(/\$\s?|(%|,)/g, '')" />
          </a-form-item>
        </a-col>

        <a-col :span="8">
          <a-form-item label="Số lượng mã" name="soLuong">
            <a-input-number v-model:value="form.soLuong" :min="1" style="width: 100%" placeholder="Nhập số lượng..." />
          </a-form-item>
        </a-col>

        <a-col :span="12">
          <a-form-item label="Điều kiện (Đơn tối thiểu - VNĐ)" name="dieuKien">
            <a-input-number v-model:value="form.dieuKien" :min="0" style="width: 100%"
              :formatter="(value: any) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
              :parser="(value: any) => String(value).replace(/\$\s?|(,*)/g, '')" />
          </a-form-item>
        </a-col>

        <a-col :span="12">
          <a-form-item label="Khách hàng được áp dụng" name="idKhachHang">
            <a-input-number v-model:value="form.idKhachHang" style="width: 100%"
              placeholder="Nhập ID Khách hàng (Bỏ trống = Mã dùng chung)" />
            <small style="color: #8c8c8c;">Để trống nếu muốn tung mã Public lên Website.</small>
          </a-form-item>
        </a-col>

        <a-col :span="12">
          <a-form-item label="Thời gian bắt đầu" name="ngayBatDau">
            <a-date-picker v-model:value="form.ngayBatDau" show-time format="DD/MM/YYYY HH:mm:ss" style="width:100%" />
          </a-form-item>
        </a-col>

        <a-col :span="12">
          <a-form-item label="Thời gian kết thúc" name="ngayKetThuc">
            <a-date-picker v-model:value="form.ngayKetThuc" show-time format="DD/MM/YYYY HH:mm:ss" style="width:100%" />
          </a-form-item>
        </a-col>

      </a-row>

    </a-form>

  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { FormInstance, Rule } from "ant-design-vue/es/form";
import type { Voucher, VoucherRequest } from "../types/voucher";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

const props = defineProps<{
  open: boolean;
  editData?: Voucher;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", data: VoucherRequest & { idVoucher?: number }): void;
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);

interface FormState {
  idVoucher: number | null;
  maVoucher: string;
  tenVoucher: string;
  loaiVoucher: string; // Đã sửa tên biến và kiểu dữ liệu
  giaTriGiam: number | null; // Đã sửa tên biến
  dieuKien: number;
  soLuong: number;
  idKhachHang: number | null;
  ngayBatDau: Dayjs | null;
  ngayKetThuc: Dayjs | null;
}

const form = reactive<FormState>({
  idVoucher: null,
  maVoucher: "",
  tenVoucher: "",
  loaiVoucher: "PERCENT", // Set mặc định là giảm theo %
  giaTriGiam: null,
  dieuKien: 0,
  soLuong: 1,
  idKhachHang: null,
  ngayBatDau: null,
  ngayKetThuc: null,
});

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (props.editData) {
        form.idVoucher = props.editData.idVoucher;
        form.maVoucher = props.editData.maVoucher;
        form.tenVoucher = props.editData.tenVoucher;

        // Đã map đúng tên biến từ Database nhả lên
        form.loaiVoucher = props.editData.loaiVoucher || "PERCENT";
        form.giaTriGiam = props.editData.giaTriGiam;

        form.dieuKien = props.editData.dieuKien;
        form.soLuong = props.editData.soLuong;
        form.idKhachHang = props.editData.idKhachHang;

        form.ngayBatDau = props.editData.ngayBatDau ? dayjs(props.editData.ngayBatDau) : null;
        form.ngayKetThuc = props.editData.ngayKetThuc ? dayjs(props.editData.ngayKetThuc) : null;
      } else {
        resetForm();
      }
    }
  }
);

const rules: Record<string, Rule[]> = {
  maVoucher: [
    { required: true, message: "Vui lòng nhập Mã Voucher", trigger: "blur" },
  ],
  tenVoucher: [
    { required: true, message: "Vui lòng nhập Tên chương trình", trigger: "blur" },
  ],
  // Đã sửa rule validation theo tên biến mới
  giaTriGiam: [
    { required: true, message: "Vui lòng nhập Mức giảm", trigger: "change" },
  ],
  soLuong: [
    { required: true, message: "Vui lòng nhập Số lượng", trigger: "change" },
  ],
  ngayBatDau: [
    { required: true, message: "Vui lòng chọn thời gian bắt đầu", trigger: "change" },
  ],
  ngayKetThuc: [
    { required: true, message: "Vui lòng chọn thời gian kết thúc", trigger: "change" },
  ]
};

const resetForm = () => {
  form.idVoucher = null;
  form.maVoucher = "";
  form.tenVoucher = "";
  form.loaiVoucher = "PERCENT"; // Reset về mặc định
  form.giaTriGiam = null; // Đã đổi tên biến
  form.dieuKien = 0;
  form.soLuong = 1;
  form.idKhachHang = null;
  form.ngayBatDau = null;
  form.ngayKetThuc = null;
  formRef.value?.clearValidate();
};

const handleClose = () => {
  resetForm();
  emit("close");
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();

    if (form.ngayBatDau && form.ngayKetThuc && form.ngayBatDau.isAfter(form.ngayKetThuc)) {
      throw new Error("Thời gian kết thúc phải sau thời gian bắt đầu");
    }

    loading.value = true;

    // TẠO GÓI DỮ LIỆU GỬI VỀ BACKEND CŨ
    const submitData = {
      ...form,
      maVoucher: form.maVoucher.toUpperCase(),
      ngayBatDau: form.ngayBatDau ? dayjs(form.ngayBatDau).format("YYYY-MM-DDTHH:mm:ss") : null,
      ngayKetThuc: form.ngayKetThuc ? dayjs(form.ngayKetThuc).format("YYYY-MM-DDTHH:mm:ss") : null,

      // ========================================================
      // TRICK LỎ: Dịch ngược dữ liệu để chiều lòng Backend cũ
      // ========================================================
      kieuGiamGia: form.loaiVoucher === 'PERCENT' ? 0 : 1,
      giamGia: form.giaTriGiam
    };

    emit("save", submitData as any); // Thêm 'as any' để Typescript không báo lỗi sai khác cấu trúc
    resetForm();
  } catch (error: any) {
    if (error.message) {
      import("ant-design-vue").then(m => m.message.error(error.message));
    }
    console.error("Validate thất bại:", error);
  } finally {
    loading.value = false;
  }
};
</script>hs

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
