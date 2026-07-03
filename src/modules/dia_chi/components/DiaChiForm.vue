<template>
  <a-modal :open="open" :title="model ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'" width="700px" :confirmLoading="loading"
    ok-text="Lưu" cancel-text="Hủy" @ok="submit" @cancel="$emit('close')">
    <a-form layout="vertical" ref="formRef" :model="form">
      <a-row :gutter="16">

        <a-col :span="12">
          <a-form-item label="Tên người nhận" name="tenNguoiNhan" :rules="[
            { required: true, message: 'Nhập tên người nhận' }
          ]">
            <a-input v-model:value="form.tenNguoiNhan" />
          </a-form-item>
        </a-col>

        <a-col :span="12">
          <a-form-item label="Số điện thoại" name="sdtNguoiNhan" :rules="[
            { required: true, message: 'Nhập số điện thoại' },
            {
              pattern: /^(0[3|5|7|8|9])[0-9]{8}$/,
              message: 'Số điện thoại không hợp lệ'
            }
          ]">
            <a-input v-model:value="form.sdtNguoiNhan" />
          </a-form-item>
        </a-col>

      </a-row>

      <a-row :gutter="16">

        <a-col :span="12">

          <a-form-item label="Quận / Huyện">
            <a-select v-model:value="form.district" placeholder="Chọn quận" @change="changeDistrict">
              <a-select-option v-for="item in districts" :key="item.code" :value="item.code">
                {{ item.name }}
              </a-select-option>
            </a-select>
          </a-form-item>

        </a-col>

        <a-col :span="12">

          <a-form-item label="Phường / Xã">
            <a-select v-model:value="form.ward" placeholder="Chọn phường">
              <a-select-option v-for="item in wards" :key="item.code" :value="item.code">
                {{ item.name }}
              </a-select-option>
            </a-select>
          </a-form-item>

        </a-col>

      </a-row>

      <a-form-item label="Số nhà / Địa chỉ chi tiết">
        <a-input v-model:value="form.detail" placeholder="Ví dụ: Số 12 ngõ 5 Trần Phú" />
      </a-form-item>

      <a-form-item>
        <a-checkbox v-model:checked="form.macDinh">
          Đặt làm địa chỉ mặc định
        </a-checkbox>
      </a-form-item>

    </a-form>
  </a-modal>
</template>

<script setup lang="ts">

import {
  ref,
  reactive,
  watch,
  onMounted
} from "vue";

import type {
  FormInstance
} from "ant-design-vue";

import {
  getHaNoiDistricts,
  getWards
} from "../api/haNoiApi";

import type {
  DiaChi,
  DiaChiRequest
} from "../types/diaChi";

const props = defineProps<{

  open: boolean;

  idKhachHang: number;

  model?: DiaChi;

}>();

const emit = defineEmits<{

  (e: "close"): void;

  (e: "save", data: DiaChiRequest): void;

}>();

const loading = ref(false);

const formRef = ref<FormInstance>();

const districts = ref<any[]>([]);

const wards = ref<any[]>([]);

const form = reactive({

  idKhachHang: 0,

  tenNguoiNhan: "",

  sdtNguoiNhan: "",

  district: undefined as number | undefined,

  ward: undefined as number | undefined,

  detail: "",

  macDinh: false,

});
onMounted(async () => {

  districts.value = await getHaNoiDistricts();

});

const changeDistrict = async (
  code: number
) => {

  wards.value = await getWards(code);

};

watch(

  () => props.open,

  (value) => {

    if (!value) return;

    if (props.model) {

      form.idKhachHang =
        props.model.idKhachHang;

      form.tenNguoiNhan =
        props.model.tenNguoiNhan;

      form.sdtNguoiNhan =
        props.model.sdtNguoiNhan;

      form.macDinh =
        props.model.macDinh;

      // Khi sửa chỉ hiển thị lại địa chỉ cũ
      form.detail =
        props.model.diaChi;

    } else {

      form.idKhachHang =
        props.idKhachHang;

      form.tenNguoiNhan = "";

      form.sdtNguoiNhan = "";

      form.detail = "";

      form.district = undefined;

      form.ward = undefined;

      form.macDinh = false;

    }

  },

  {
    immediate: true
  }

);

const submit = async () => {

  await formRef.value?.validate();

  loading.value = true;

  try {

    const districtName =
      districts.value.find(
        x => x.code === form.district
      )?.name || "";

    const wardName =
      wards.value.find(
        x => x.code === form.ward
      )?.name || "";

    const request: DiaChiRequest = {

      idKhachHang:
        form.idKhachHang,

      tenNguoiNhan:
        form.tenNguoiNhan,

      sdtNguoiNhan:
        form.sdtNguoiNhan,

      diaChi:
        `${form.detail}, ${wardName}, ${districtName}, Hà Nội`,

      macDinh:
        form.macDinh,

    };

    emit(
      "save",
      request
    );

  } finally {

    loading.value = false;

  }

};

</script>

<style scoped>
:deep(.ant-modal-body) {

  padding-top: 18px;

}

:deep(.ant-form-item) {

  margin-bottom: 16px;

}

:deep(.ant-input) {

  border-radius: 8px;

}

:deep(.ant-select-selector) {

  border-radius: 8px !important;

}

:deep(.ant-btn) {

  border-radius: 8px;

}
</style>
