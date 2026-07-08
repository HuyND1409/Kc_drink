<template>
  <a-card :bordered="false">

    <template #title>
      <span style="font-size:22px;font-weight:700">
        🧋 Quản lý Topping
      </span>
    </template>

    <div class="toolbar">

      <div class="toolbar-left">

        <a-input-search
          v-model:value="keyword"
          placeholder="Tìm theo tên topping..."
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

        <a-tooltip title="Làm mới">
          <a-button shape="circle" @click="resetFilter">↻</a-button>
        </a-tooltip>

      </div>

      <a-button v-if="userRole === 'ADMIN'" type="primary" size="large" @click="onAdd">
        + Thêm Topping
      </a-button>

    </div>

    <!-- Bảng danh sách topping -->
    <ToppingTable
      :data="dsTopping"
      :loading="loading"
      @viewLo="onViewLo"
      @edit="onEdit"
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
        :show-total="(total: number) => `Tổng ${total} topping`"
        @change="onPageChange"
      />
    </div>

    <!-- Modal thêm/sửa topping -->
    <ToppingForm
      :open="openModal"
      :editData="editing"
      @close="handleCloseModal"
      @save="saveTopping"
    />

    <!-- Drawer xem lô hàng & nhập kho -->
    <LoToppingDrawer
      :open="openDrawer"
      :topping="selectedTopping"
      @close="openDrawer = false"
      @success="loadData"
    />

  </a-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import type { AxiosError } from "axios";

import ToppingTable from "../components/ToppingTable.vue";
import ToppingForm from "../components/ToppingForm.vue";
import LoToppingDrawer from "../components/LoToppingDrawer.vue";

import {
  getTopping,
  createTopping,
  updateTopping,
  lockTopping,
  unlockTopping,
} from "../api/toppingApi";

import type { Topping, ToppingRequest } from "../types/topping";

// ============================================================
// State
// ============================================================
const userRole = ref<string>('');
const dsTopping = ref<Topping[]>([]);
const loading = ref(false);
const openModal = ref(false);

const keyword = ref("");
const trangThai = ref<number>();
const currentPage = ref(1);
const pageSize = ref(5);
const total = ref(0);

// Biến kiểm soát trạng thái sửa dữ liệu
const editing = ref<Topping>();

// Drawer
const openDrawer = ref(false);
const selectedTopping = ref<Topping>();

// ============================================================
// Đóng / Mở Modal
// ============================================================

const onAdd = () => {
  editing.value = undefined;
  openModal.value = true;
};

const onEdit = (record: Topping) => {
  editing.value = { ...record };
  openModal.value = true;
};

const handleCloseModal = () => {
  editing.value = undefined;
  openModal.value = false;
};

// ============================================================
// Mở Drawer xem lô hàng
// ============================================================
const onViewLo = (record: Topping) => {
  selectedTopping.value = record;
  openDrawer.value = true;
};

// ============================================================
// Load dữ liệu
// ============================================================
const loadData = async () => {
  loading.value = true;
  try {
    const response = await getTopping(
      keyword.value,
      trangThai.value,
      currentPage.value - 1,
      pageSize.value
    );
    dsTopping.value = response.data.data.content;
    total.value = response.data.data.totalElements;
  } finally {
    loading.value = false;
  }
};

// ============================================================
// Lưu (Thêm / Sửa)
// ============================================================
const saveTopping = async (data: ToppingRequest & { idTopping?: number }) => {
  try {
    if (editing.value) {
      await updateTopping(editing.value.idTopping, {
        tenTopping: data.tenTopping,
        giaTopping: data.giaTopping,
        tongTonKho: data.tongTonKho,
        trangThai: data.trangThai,
      });
      message.success("Cập nhật topping thành công");
    } else {
      await createTopping({
        tenTopping: data.tenTopping,
        giaTopping: data.giaTopping,
        tongTonKho: data.tongTonKho,
        trangThai: data.trangThai,
      });
      message.success("Thêm topping thành công");
    }

    editing.value = undefined;
    openModal.value = false;
    await loadData();
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    message.error(err.response?.data?.message || "Có lỗi xảy ra");
  }
};

// ============================================================
// Khóa / Mở khóa
// ============================================================
const onLock = async (id: number) => {
  try {
    await lockTopping(id);
    message.success("Đã khóa topping");
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
    await unlockTopping(id);
    message.success("Đã mở khóa topping");
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

// ============================================================
// Tìm kiếm & Phân trang
// ============================================================
const onSearch = () => {
  currentPage.value = 1;
  loadData();
};

const onPageChange = (page: number, size: number) => {
  currentPage.value = page;
  pageSize.value = size;
  loadData();
};

const resetFilter = () => {
  keyword.value = "";
  trangThai.value = undefined;
  currentPage.value = 1;
  loadData();
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
