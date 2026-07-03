<template>
  <a-modal :open="open" width="1000px" title="Quản lý địa chỉ" :footer="null" @cancel="$emit('update:open', false)">
    <div class="header">
      <div>
        <h3>{{ khachHang?.tenKhachHang }}</h3>
        <span>{{ khachHang?.sdt }}</span>
      </div>

      <a-button type="primary" @click="onCreate">
        + Thêm địa chỉ
      </a-button>
    </div>

    <DiaChiTable v-if="dsDiaChi.length" :data="dsDiaChi" :loading="loading" @edit="onEdit" @default="onDefault" />

    <a-empty v-else description="Chưa có địa chỉ" />

    <DiaChiForm :open="openForm" :model="editing" :idKhachHang="khachHang!.idKhachHang" @close="openForm = false"
      @save="saveDiaChi" />

  </a-modal>
</template>

<script setup lang="ts">

import {
  ref,
  watch
} from "vue";

import { message } from "ant-design-vue";

import DiaChiTable from "./DiaChiTable.vue";

import DiaChiForm from "./DiaChiForm.vue";

import {

  getDiaChi,

  createDiaChi,

  updateDiaChi,

  setDefaultDiaChi,

} from "../api/diaChiApi";

import type {

  DiaChi,

  DiaChiRequest,

} from "../types/diaChi";

import type {

  KhachHang

} from "@/modules/khach-hang/types/khachHang";

const props = defineProps<{

  open: boolean;

  khachHang?: KhachHang;

}>();

const emit = defineEmits<{

  (e: "update:open", value: boolean): void;

  (
    e: "update-default",
    idKhachHang: number,
    diaChi: string
  ): void;

}>();
const loading = ref(false);

const openForm = ref(false);

const editing = ref<DiaChi>();

const dsDiaChi = ref<DiaChi[]>([]);

const loadDiaChi = async () => {

  if (!props.khachHang) return;

  loading.value = true;

  try {

    const page = await getDiaChi(

      props.khachHang.idKhachHang

    );

    dsDiaChi.value = page.content;

  }

  catch {

    message.error("Không tải được địa chỉ");

  }

  finally {

    loading.value = false;

  }

};

const onCreate = () => {

  editing.value = undefined;

  openForm.value = true;

};

const onEdit = (record: DiaChi) => {

  editing.value = record;

  openForm.value = true;

};
const saveDiaChi = async (
  data: DiaChiRequest
) => {

  try {

    if (editing.value) {

      await updateDiaChi(
        editing.value.idDiaChi,
        data
      );

      message.success(
        "Cập nhật địa chỉ thành công"
      );

    } else {

      await createDiaChi(data);

      message.success(
        "Thêm địa chỉ thành công"
      );

    }

    openForm.value = false;

    editing.value = undefined;

    await loadDiaChi();

  } catch {

    message.error(
      "Lưu địa chỉ thất bại"
    );

  }

};

const onDefault = async (
  record: DiaChi
) => {

  try {

    await setDefaultDiaChi(
      record.idDiaChi
    );

    message.success(
      "Đặt mặc định thành công"
    );

    await loadDiaChi();
    emit(
      "update-default",
      props.khachHang!.idKhachHang,
      record.diaChi
    );

  } catch {

    message.error(
      "Đặt mặc định thất bại"
    );

  }

};

watch(

  () => props.open,

  (value) => {

    if (value) {

      loadDiaChi();

    }

  }

);

</script>

<style scoped>
.header {

  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-bottom: 18px;

}

.header h3 {

  margin: 0;

  font-size: 18px;

  font-weight: 700;

}

.header span {

  color: #888;

}

:deep(.ant-modal-body) {

  padding-top: 16px;

}

:deep(.ant-btn) {

  border-radius: 8px;

}
</style>
