<template>
  <a-card :bordered="false">

    <template #title>
      <span style="font-size:22px;font-weight:700">
        🧪 Quản lý kho & Nguyên liệu
      </span>
    </template>

    <div class="toolbar">

      <div class="toolbar-left">

        <a-input-search
          v-model:value="keyword"
          placeholder="Tìm theo tên nguyên liệu..."
          allow-clear
          style="width:300px"
          @search="onSearch"
        />

        <a-select
          v-model:value="trangThai"
          placeholder="Trạng thái"
          allow-clear
          style="width:160px"
          @change="onSearch"
        >
          <a-select-option :value="1">Hoạt động</a-select-option>
          <a-select-option :value="0">Đã khóa</a-select-option>
        </a-select>

        <a-select
          v-model:value="sortBy"
          placeholder="Sắp xếp theo"
          style="width:170px"
          @change="loadData"
        >
          <a-select-option value="idNguyenLieu">Mã NL</a-select-option>
          <a-select-option value="tenNguyenLieu">Tên NL</a-select-option>
          <a-select-option value="tongTonKho">Tồn kho</a-select-option>
        </a-select>

        <a-select
          v-model:value="direction"
          style="width:120px"
          @change="loadData"
        >
          <a-select-option value="asc">Tăng dần</a-select-option>
          <a-select-option value="desc">Giảm dần</a-select-option>
        </a-select>

        <a-tooltip title="Làm mới">
          <a-button shape="circle" @click="resetFilter">↻</a-button>
        </a-tooltip>

      </div>

      <a-button v-if="userRole === 'ADMIN'" type="primary" size="large" @click="openModal = true">
        + Thêm nguyên liệu
      </a-button>

    </div>

    <!-- Bảng danh sách nguyên liệu -->
    <NguyenLieuTable
      :data="dsNguyenLieu"
      :loading="loading"
      @viewLo="onViewLo"
      @lock="onLock"
      @unlock="onUnlock"
    />

    <!-- Phân trang -->
    <div style="display:flex; justify-content:flex-end; margin-top:20px;">
      <a-pagination
        :current="currentPage"
        :pageSize="pageSize"
        :total="total"
        show-size-changer
        :show-total="(total: number) => `Tổng ${total} nguyên liệu`"
        @change="onPageChange"
      />
    </div>

    <!-- Modal thêm nguyên liệu -->
    <NguyenLieuForm
      :open="openModal"
      @close="openModal = false"
      @save="saveNguyenLieu"
    />

    <!-- Drawer xem lô hàng & nhập kho -->
    <LoNguyenLieuDrawer
      :open="openDrawer"
      :nguyenLieu="selectedNguyenLieu"
      @close="openDrawer = false"
      @success="loadData"
    />

  </a-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import type { AxiosError } from "axios";

import NguyenLieuTable from "../components/NguyenLieuTable.vue";
import NguyenLieuForm from "../components/NguyenLieuForm.vue";
import LoNguyenLieuDrawer from "../components/LoNguyenLieuDrawer.vue";

import { getNguyenLieu, createNguyenLieu, lockNguyenLieu, unlockNguyenLieu } from "@/modules/nguyen-lieu/api/nguyenLieuApi";
import type { NguyenLieu, NguyenLieuRequest } from "../types/nguyenLieu";

// ============================================================
// State
// ============================================================
const userRole = ref<string>('');
const dsNguyenLieu = ref<NguyenLieu[]>([]);
const loading = ref(false);

const keyword = ref("");
const trangThai = ref<number>();
const sortBy = ref("idNguyenLieu");
const direction = ref("asc");
const currentPage = ref(1);
const pageSize = ref(5);
const total = ref(0);

const openModal = ref(false);

// Drawer
const openDrawer = ref(false);
const selectedNguyenLieu = ref<NguyenLieu>();

// ============================================================
// Load danh sách nguyên liệu
// ============================================================
const loadData = async () => {
  loading.value = true;
  try {
    const res = await getNguyenLieu(
      keyword.value,
      trangThai.value,
      currentPage.value - 1,
      pageSize.value,
      sortBy.value,
      direction.value
    );
    dsNguyenLieu.value = res.data.data.content;
    total.value = res.data.data.totalElements;
  } finally {
    loading.value = false;
  }
};

const onSearch = () => {
  currentPage.value = 1;
  loadData();
};

const resetFilter = () => {
  keyword.value = "";
  trangThai.value = undefined;
  sortBy.value = "idNguyenLieu";
  direction.value = "asc";
  currentPage.value = 1;
  loadData();
};

const onPageChange = (page: number, size: number) => {
  currentPage.value = page;
  pageSize.value = size;
  loadData();
};

// ============================================================
// Thêm nguyên liệu
// ============================================================
const saveNguyenLieu = async (data: NguyenLieuRequest) => {
  try {
    await createNguyenLieu(data);
    message.success("Thêm nguyên liệu thành công!");
    openModal.value = false;
    await loadData();
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    message.error(err.response?.data?.message || "Có lỗi xảy ra");
  }
};

// ============================================================
// Mở Drawer xem lô hàng
// ============================================================
const onViewLo = (record: NguyenLieu) => {
  selectedNguyenLieu.value = record;
  openDrawer.value = true;
};

// ============================================================
// Init
// ============================================================
onMounted(() => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      userRole.value = user.role;
    } catch (e) {}
  }
  loadData();
});

// ============================================================
// Khóa / Mở khóa
// ============================================================
const onLock = async (id: number) => {
  try {
    await lockNguyenLieu(id);
    message.success("Đã khóa nguyên liệu");
    loadData();
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    if (err.response?.status === 403) {
      message.error(err.response?.data?.message || "Bạn không có quyền thực hiện hành động này");
    } else {
      message.error(err.response?.data?.message || "Có lỗi xảy ra");
    }
  }
};

const onUnlock = async (id: number) => {
  try {
    await unlockNguyenLieu(id);
    message.success("Đã mở khóa nguyên liệu");
    loadData();
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    if (err.response?.status === 403) {
      message.error(err.response?.data?.message || "Bạn không có quyền thực hiện hành động này");
    } else {
      message.error(err.response?.data?.message || "Có lỗi xảy ra");
    }
  }
};
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.ant-card {
  border-radius: 12px;
}
</style>
