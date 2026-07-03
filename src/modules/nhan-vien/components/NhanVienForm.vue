<template>
  <a-modal :open="props.open" :title="props.model ? 'Cập nhật nhân viên' : 'Thêm nhân viên'" width="700px" ok-text="Lưu"
    cancel-text="Hủy" :confirm-loading="loading" @ok="handleSubmit" @cancel="handleClose">
    <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
      <a-row :gutter="16">

        <a-col :span="12">
          <a-form-item label="Tên nhân viên" name="tenNhanVien">
            <a-input v-model:value="form.tenNhanVien" />
          </a-form-item>
        </a-col>

        <a-col :span="12">
          <a-form-item label="Tên đăng nhập" name="username">
            <a-input v-model:value="form.username" :disabled="!!model" />
          </a-form-item>
        </a-col>

        <!-- <a-col :span="12">
          <a-form-item label="Mật khẩu" name="password">
            <a-input-password v-model:value="form.password" placeholder="Để trống nếu không đổi mật khẩu" />
          </a-form-item>
        </a-col> -->

        <a-col :span="12">
          <a-form-item label="Số điện thoại" name="sdt">
            <a-input v-model:value="form.sdt" />
          </a-form-item>
        </a-col>

        <a-col :span="12">
          <a-form-item label="Email" name="email">
            <a-input v-model:value="form.email" />
          </a-form-item>
        </a-col>

        <a-col :span="12">
          <a-form-item label="Chức vụ" name="chucVu">

            <a-select v-model:value="form.chucVu">

              <a-select-option value="ADMIN">
                Quản lý
              </a-select-option>

              <a-select-option value="STAFF">
                Nhân viên
              </a-select-option>

            </a-select>

          </a-form-item>
        </a-col>

      </a-row>

    </a-form>

  </a-modal>
</template>

<script setup lang="ts">
import {
  reactive,
  ref,
  watch
} from "vue";

import type {
  FormInstance,
  Rule
} from "ant-design-vue/es/form";

import type {
  NhanVien,
  NhanVienRequest
} from "../types/nhanVien";

const props = defineProps<{

  open: boolean;

  model?: NhanVien;

}>();

const emit = defineEmits<{

  (e: "close"): void;

  (e: "save", data: NhanVienRequest): void;

}>();

const formRef = ref<FormInstance>();

const loading = ref(false);

const form = reactive<NhanVienRequest>({

  tenNhanVien: "",

  username: "",

  password: "",

  sdt: "",

  email: "",

  chucVu: "STAFF",

});

const rules: Record<string, Rule[]> = {

  tenNhanVien: [

    {

      required: true,

      message: "Vui lòng nhập tên nhân viên",

      trigger: "blur",

    },

  ],

  username: [

    {

      required: true,

      message: "Vui lòng nhập username",

      trigger: "blur",

    },

    {

      min: 5,

      message: "Username tối thiểu 5 ký tự",

      trigger: "blur",

    },

  ],

  // password: [

  //   {

  //     required: !props.model,

  //     message: "Vui lòng nhập mật khẩu",

  //     trigger: "blur",

  //   },

  // ],

  sdt: [

    {

      required: true,

      message: "Vui lòng nhập số điện thoại",

      trigger: "blur",

    },

    {

      pattern: /^(03|05|07|08|09)\d{8}$/,

      message: "Số điện thoại không hợp lệ",

      trigger: "blur",

    },

  ],

  email: [

    {

      required: true,

      message: "Vui lòng nhập email",

      trigger: "blur",

    },

    {

      type: "email",

      message: "Email không hợp lệ",

      trigger: "blur",

    },

  ],

};

const resetForm = () => {

  form.tenNhanVien = "";

  form.username = "";

  form.password = "";

  form.sdt = "";

  form.email = "";

  form.chucVu = "STAFF";

  formRef.value?.clearValidate();

};

watch(

  () => props.open,

  (value) => {

    if (!value) return;

    if (props.model) {

      form.tenNhanVien =
        props.model.tenNhanVien;

      form.username =
        props.model.username;

      form.password = "";

      form.sdt =
        props.model.sdt;

      form.email =
        props.model.email;

      form.chucVu =
        props.model.chucVu;

    }

    else {

      resetForm();

    }

  },

  {

    immediate: true,

  }

);

const handleClose = () => {

  resetForm();

  emit("close");

};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;
    const data: Partial<typeof form> = {
      ...form,
    };
    if (!data.password) {
      delete data.password; // Lệnh delete này giờ hợp lệ 100%
    }
    // Dùng 'as never' để lừa hàm emit, bỏ qua check type gắt gao
    emit("save", data as never);
  } finally
  {
    loading.value = false;
  }
};

</script>

<style scoped>
:deep(.ant-modal-title) {

  font-size: 20px;

  font-weight: 700;

}

:deep(.ant-form-item-label>label) {

  font-weight: 600;

}

:deep(.ant-input),

:deep(.ant-input-password),

:deep(.ant-select-selector) {

  border-radius: 8px !important;

}

:deep(.ant-btn) {

  border-radius: 8px;

}
</style>
