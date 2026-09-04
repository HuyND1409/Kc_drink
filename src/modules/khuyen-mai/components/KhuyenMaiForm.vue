<template>
  <a-modal
    :open="open"
    :title="isEdit ? 'Cập nhật khuyến mãi' : 'Thêm khuyến mãi'"
    @ok="handleSubmit"
    @cancel="onCancel"
    :confirm-loading="submitting"
    width="700px"
    destroy-on-close
  >
    <a-form layout="vertical" :model="formState" :rules="rules" ref="formRef">
      <a-row :gutter="16">
        <a-col :span="24">
          <a-form-item label="Tên chương trình" name="tenKm">
            <a-input v-model:value="formState.tenKm" placeholder="Nhập tên chương trình KM" />
          </a-form-item>
        </a-col>

        <a-col :span="12">
          <a-form-item label="Loại giảm" name="loaiGiam">
            <a-select v-model:value="formState.loaiGiam" placeholder="Chọn loại giảm" @change="onLoaiGiamChange">
              <a-select-option value="PHAN_TRAM">Phần trăm (%)</a-select-option>
              <a-select-option value="SO_TIEN">Số tiền (VNĐ)</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>

        <a-col :span="12">
          <a-form-item label="Giá trị giảm" name="giaTriGiam">
            <a-input-number
              v-model:value="formState.giaTriGiam"
              style="width: 100%"
              :min="1"
              :formatter="formatNumber"
              :parser="parseNumber"
            />
          </a-form-item>
        </a-col>

        <a-col :span="12">
          <a-form-item label="Thời gian bắt đầu" name="ngayBatDau">
            <a-date-picker
              v-model:value="formState.ngayBatDau"
              show-time
              format="DD/MM/YYYY HH:mm:ss"
              valueFormat="YYYY-MM-DDTHH:mm:ss"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>

        <a-col :span="12">
          <a-form-item label="Thời gian kết thúc" name="ngayKetThuc">
            <a-date-picker
              v-model:value="formState.ngayKetThuc"
              show-time
              format="DD/MM/YYYY HH:mm:ss"
              valueFormat="YYYY-MM-DDTHH:mm:ss"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>

        <a-col :span="24">
          <a-form-item label="Sản phẩm áp dụng" name="idSanPham">
            <a-select
              v-model:value="formState.idSanPham"
              mode="multiple"
              placeholder="Chọn sản phẩm"
              :options="sanPhamOptions"
              :loading="loadingProducts"
              optionFilterProp="label"
              showSearch
            />
          </a-form-item>
        </a-col>

        <a-col :span="24">
          <a-form-item label="Mô tả" name="moTa">
            <a-textarea v-model:value="formState.moTa" :rows="3" />
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { message } from 'ant-design-vue';
import type { Rule } from 'ant-design-vue/es/form';
import dayjs from 'dayjs';
import { taoKhuyenMai, capNhatKhuyenMai, getChiTietKhuyenMai } from '../api/khuyenMaiApi';
import { getSanPham } from '@/modules/san-pham/api/sanPhamApi';
import type { KhuyenMaiRequest } from '../types/khuyenMai';

const props = defineProps<{
  open: boolean;
  editId?: number | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const formRef = ref();
const submitting = ref(false);
const loadingProducts = ref(false);

const formState = reactive<KhuyenMaiRequest>({
  tenKm: '',
  loaiGiam: 'PHAN_TRAM',
  giaTriGiam: 0,
  ngayBatDau: '',
  ngayKetThuc: '',
  moTa: '',
  idSanPham: [],
});

const isEdit = ref(false);

const sanPhamOptions = ref<{ value: number; label: string }[]>([]);

const formatNumber = (value: any) => {
  if (formState.loaiGiam === 'SO_TIEN') {
    return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  return value;
};

const parseNumber = (value: unknown) =>
  Number(String(value ?? "").replace(/,/g, "")) || 0;

const onLoaiGiamChange = () => {
  if (formRef.value) formRef.value.validateFields(['giaTriGiam']);
};

const fetchProducts = async () => {
  loadingProducts.value = true;
  try {
    const res = await getSanPham("", undefined, 0, 1000); // Lấy nhiều SP để chọn
    const data = res.data?.data ?? res.data;
    if (data && data.content) {
      sanPhamOptions.value = data.content
        .filter((sp: any) => sp.trangThai === 1) // Chỉ lấy sản phẩm đang bán
        .map((sp: any) => ({
          value: sp.idSanPham,
          label: sp.tenSanPham,
        }));
    }
  } catch (err) {
    message.error("Lỗi khi tải danh sách sản phẩm");
  } finally {
    loadingProducts.value = false;
  }
};

const resetForm = () => {
  formState.tenKm = '';
  formState.loaiGiam = 'PHAN_TRAM';
  formState.giaTriGiam = 0;
  formState.ngayBatDau = '';
  formState.ngayKetThuc = '';
  formState.moTa = '';
  formState.idSanPham = [];
  if (formRef.value) formRef.value.clearValidate();
};

const loadDetail = async (id: number) => {
  try {
    const res = await getChiTietKhuyenMai(id);
    const data = res.data?.data ?? res.data;
    formState.tenKm = data.tenKm;
    formState.loaiGiam = data.loaiGiam;
    formState.giaTriGiam = data.giaTriGiam;
    formState.ngayBatDau = data.ngayBatDau;
    formState.ngayKetThuc = data.ngayKetThuc;
    formState.moTa = data.moTa || '';
    formState.idSanPham = (data.sanPhamApDung || []).map((sp: any) => sp.idSanPham);
  } catch (err: any) {
    message.error(err.response?.data?.message || "Lỗi tải chi tiết");
    emit('close');
  }
};

watch(
  () => [props.open, props.editId] as const,
  async ([isOpen, editId]) => {
    if (isOpen) {
      resetForm();
      if (sanPhamOptions.value.length === 0) {
        await fetchProducts();
      }
      if (editId) {
        isEdit.value = true;
        await loadDetail(editId);
      } else {
        isEdit.value = false;
      }
    }
  }
);

const checkGiaTriGiam = async (_rule: Rule, value: number) => {
  if (!value || value <= 0) {
    return Promise.reject("Giá trị giảm phải lớn hơn 0");
  }
  if (formState.loaiGiam === 'PHAN_TRAM' && value > 100) {
    return Promise.reject("Phần trăm giảm không được vượt quá 100%");
  }
  return Promise.resolve();
};

const checkNgayKetThuc = async (_rule: Rule, value: string) => {
  if (!value) return Promise.reject("Vui lòng chọn ngày kết thúc");
  if (
    formState.ngayBatDau &&
    !dayjs(value).isAfter(dayjs(formState.ngayBatDau))
  ) {
    return Promise.reject("Ngày kết thúc phải sau ngày bắt đầu");
  }
  return Promise.resolve();
};

const rules: Record<string, Rule[]> = {
  tenKm: [{ required: true, message: 'Vui lòng nhập tên CTKM', trigger: 'blur' }],
  loaiGiam: [{ required: true, message: 'Vui lòng chọn loại giảm', trigger: 'change' }],
  giaTriGiam: [{ required: true, validator: checkGiaTriGiam, trigger: 'change' }],
  ngayBatDau: [{ required: true, message: 'Vui lòng chọn ngày bắt đầu', trigger: 'change' }],
  ngayKetThuc: [{ required: true, validator: checkNgayKetThuc, trigger: 'change' }],
  idSanPham: [{ required: true, message: 'Vui lòng chọn ít nhất 1 sản phẩm', type: 'array', min: 1, trigger: 'change' }],
};

const handleSubmit = () => {
  formRef.value.validate().then(async () => {
    submitting.value = true;
    try {
      if (isEdit.value && props.editId) {
        await capNhatKhuyenMai(props.editId, formState);
        message.success("Cập nhật thành công");
      } else {
        await taoKhuyenMai(formState);
        message.success("Thêm mới thành công");
      }
      emit('success');
      emit('close');
    } catch (err: any) {
      message.error(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      submitting.value = false;
    }
  }).catch(() => {});
};

const onCancel = () => {
  emit('close');
};
</script>
