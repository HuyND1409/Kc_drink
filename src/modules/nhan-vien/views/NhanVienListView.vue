<template>
  <a-card :bordered="false" class="custom-card">

    <template #title>
      <span class="card-title">
        👨‍💼 Quản lý nhân viên
      </span>
    </template>

    <a-row justify="space-between" align="middle" :gutter="[16, 16]" class="filter-row">

      <a-col :xs="24" :sm="12" :md="8" :lg="6">
        <a-input-search v-model:value="keyword" placeholder="Nhập tên hoặc SĐT..." allow-clear enter-button size="large"
          @search="onSearch" />
      </a-col>

      <a-col :xs="12" :sm="6" :md="4" :lg="4">
        <a-select v-model:value="chucVu" placeholder="Chức vụ" allow-clear style="width:100%" size="large"
          @change="loadData">
          <a-select-option value="Quản lý">Quản lý</a-select-option>
          <a-select-option value="Nhân viên">Nhân viên</a-select-option>
        </a-select>
      </a-col>

      <a-col :xs="12" :sm="6" :md="4" :lg="4">
        <a-select v-model:value="trangThai" placeholder="Trạng thái" allow-clear style="width:100%" size="large"
          @change="loadData">
          <a-select-option :value="1">Đang làm</a-select-option>
          <a-select-option :value="0">Đã khóa</a-select-option>
        </a-select>
      </a-col>

      <a-col>
        <a-tooltip title="Làm mới bộ lọc">
          <a-button type="default" shape="circle" size="large" @click="resetFilter" class="btn-reload">
            <template #icon>
              <ReloadOutlined />
            </template>
          </a-button>
        </a-tooltip>
      </a-col>

      <a-col flex="auto" style="text-align: right">
        <a-button type="primary" size="large" class="btn-add-emp" @click="onCreate">
          <template #icon>
            <PlusOutlined />
          </template>

          Thêm nhân viên
        </a-button>
      </a-col>

    </a-row>

    <NhanVienTable :data="dsNhanVien" :loading="loading" :currentUserId="authStore.user?.idTaiKhoan" @edit="onEdit"
      @lock="onLock" @unlock="onUnlock" />

    <div class="pagination-wrapper">
      <a-pagination :current="currentPage" :pageSize="pageSize" :total="total" show-size-changer
        :show-total="(total: number) => `Tổng số: ${total} nhân viên`" @change="onPageChange" />
    </div>

    <NhanVienForm :open="openModal" :model="editing" @close="openModal = false" @save="saveNhanVien" />

  </a-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import { ReloadOutlined, PlusOutlined } from '@ant-design/icons-vue'; // Import thêm PlusOutlined chuẩn icon
import { useAuthStore } from "@/modules/auth/store/authStore";
import NhanVienForm from "../components/NhanVienForm.vue";
import NhanVienTable from "../components/NhanVienTable.vue";

import {
  getNhanVien,
  createNhanVien,
  updateNhanVien,
  lockNhanVien,
  unlockNhanVien,
} from "../api/nhanVienApi";
import type {
  NhanVien,
  NhanVienRequest,
} from "../types/nhanVien";

const dsNhanVien = ref<NhanVien[]>([]);
const loading = ref(false);
const openModal = ref(false);
const editing = ref<NhanVien>();
const keyword = ref("");
const chucVu = ref<string | undefined>();
const trangThai = ref<number | undefined>();
const currentPage = ref(1);
const pageSize = ref(5);
const total = ref(0);
const authStore = useAuthStore();

const onCreate = () => {

  editing.value = undefined;

  openModal.value = true;

};

const loadData = async () => {
  loading.value = true;
  try {
    const response = await getNhanVien(
      keyword.value,
      chucVu.value,
      trangThai.value,
      currentPage.value - 1,
      pageSize.value
    );
    dsNhanVien.value = response.data.data.content;
    total.value = response.data.data.totalElements;
  } finally {
    loading.value = false;
  }
};

const saveNhanVien = async (
  data: NhanVienRequest
) => {

  try {

    if (editing.value) {

      await updateNhanVien(

        editing.value.idNhanVien,

        data

      );

      message.success(
        "Cập nhật nhân viên thành công"
      );

    } else {

      await createNhanVien(data);

      message.success(
        "Thêm nhân viên thành công"
      );

    }

    editing.value = undefined;

    openModal.value = false;

    await loadData();

  } catch {

    message.error(
      editing.value
        ? "Cập nhật thất bại"
        : "Thêm thất bại"
    );

  }

};

const onSearch = () => {
  currentPage.value = 1;
  loadData();
};

const onPageChange = (page: number, size: number) => {
  currentPage.value = page;
  pageSize.value = size;
  loadData();
};

const onEdit = (record: NhanVien) => {

  editing.value = {
    ...record,
    // password: "",
  };

  openModal.value = true;

};

const onLock = async (id: number) => {
  await lockNhanVien(id);
  message.success("Đã khóa nhân viên");
  await loadData();
};

const onUnlock = async (id: number) => {
  await unlockNhanVien(id);
  message.success("Đã mở khóa nhân viên");
  loadData();
};

const resetFilter = () => {
  keyword.value = "";
  chucVu.value = undefined;
  trangThai.value = undefined;
  currentPage.value = 1;
  loadData();
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
/* Thêm bóng mờ nhẹ giúp card nhìn sang trọng và nổi bật hơn */
.custom-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  background: #ffffff;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f1f1f;
  letter-spacing: -0.5px;
}

.filter-row {
  margin-bottom: 24px;
}

/* Hiệu ứng chuyển động mượt cho nút reload */
.btn-reload {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-reload:hover {
  color: #1890ff;
  border-color: #1890ff;
  transform: rotate(180deg);
  /* Xoay nhẹ icon reload khi hover tạo cảm giác dynamic */
}

/* Làm nút thêm mới bo góc đồng bộ, đổ bóng nhẹ */
.btn-add-emp {
  border-radius: 6px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}
</style>
