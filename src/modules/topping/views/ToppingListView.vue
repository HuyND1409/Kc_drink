<template>
  <a-card :bordered="false">

    <template #title>
      <span style="font-size:22px;font-weight:700">
        🧋 Quản lý Topping
      </span>
    </template>

    <div class="toolbar">

      <div class="toolbar-left">

        <a-input-search v-model:value="keyword" placeholder="Tìm theo tên topping..." allow-clear style="width:300px"
          @search="onSearch" />

        <a-select v-model:value="trangThai" placeholder="Trạng thái" allow-clear style="width:160px" @change="onSearch">
          <a-select-option :value="1">Hoạt động</a-select-option>
          <a-select-option :value="0">Đã khóa</a-select-option>
        </a-select>

        <a-tooltip title="Làm mới">
          <a-button shape="circle" @click="resetFilter">↻</a-button>
        </a-tooltip>

      </div>

      <!-- 🟢 CỤM NÚT THAO TÁC CỦA ADMIN -->
      <div style="display: flex; gap: 8px; align-items: center;">

        <!-- NÚT IMPORT EXCEL -->
        <a-button v-if="isAdmin" :loading="loadingImport" size="large"
          style="background-color: #217346; color: #fff; border-color: #217346;" @click="triggerFileInput">
          <template #icon>
            <FileExcelOutlined />
          </template>
          Import Excel
        </a-button>

        <!-- INPUT FILE ẨN -->
        <input ref="fileInputRef" type="file" accept=".xlsx, .xls" style="display: none" @change="handleFileUpload" />

        <!-- NÚT THÊM TOPPING -->
        <a-button v-if="isAdmin" type="primary" size="large" @click="onAdd">
          + Thêm Topping
        </a-button>

      </div>

    </div>

    <!-- Bảng danh sách topping -->
    <ToppingTable :data="dsTopping" :loading="loading" @viewLo="onViewLo" @edit="onEdit" @lock="onLock"
      @unlock="onUnlock" />

    <!-- Phân trang -->
    <div style="display:flex; justify-content:flex-end; margin-top:20px;">
      <a-pagination :current="currentPage" :pageSize="pageSize" :total="total" show-size-changer
        :show-total="(total: number) => `Tổng ${total} topping`" @change="onPageChange" />
    </div>

    <!-- Modal thêm/sửa topping -->
    <ToppingForm :open="openModal" :editData="editing" @close="handleCloseModal" @save="saveTopping" />

    <!-- Drawer xem lô hàng & nhập kho -->
    <LoToppingDrawer :open="openDrawer" :topping="selectedTopping" @close="openDrawer = false" @success="loadData" />

  </a-card>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from "vue";
import { message } from "ant-design-vue";
import type { AxiosError } from "axios";
import { FileExcelOutlined } from "@ant-design/icons-vue";

import ToppingTable from "../components/ToppingTable.vue";
import ToppingForm from "../components/ToppingForm.vue";
import LoToppingDrawer from "../components/LoToppingDrawer.vue";
import { onDataChanged } from "@/utils/appSync";

import {
  getTopping,
  createTopping,
  updateTopping,
  lockTopping,
  unlockTopping,
  importLoToppingApi,
} from "../api/toppingApi";

import type { Topping, ToppingRequest } from "../types/topping";
import { useAuthStore } from "@/modules/auth/store/authStore";

// ============================================================
// State
// ============================================================
const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.role === "ADMIN");
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

// State Import Excel
const fileInputRef = ref<HTMLInputElement | null>(null);
const loadingImport = ref(false);

// ============================================================
// Logic Import Excel Batch
// ============================================================
const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  const idNhanVien = authStore.user?.idNhanVien ?? 1;
  formData.append("idNhanVien", idNhanVien.toString());

  loadingImport.value = true;
  try {
    const res = await importLoToppingApi(formData);
    message.success(res.data?.message || "Import danh sách lô Topping thành công!");

    // Reset về trang 1 và load lại danh sách
    listSession++;
    currentPage.value = 1;
    await loadData();
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || "Có lỗi xảy ra khi import file Excel!";
    message.error(errorMsg);
  } finally {
    loadingImport.value = false;
    target.value = ""; // Reset input file
  }
};

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
let listSession = 0;
let fetchTimeout: ReturnType<typeof setTimeout> | null = null;
let isFetching = false;
let pendingRequests: Array<{ isBackground: boolean, resolve: () => void }> = [];
let pollingInterval: ReturnType<typeof setInterval> | null = null;
let unsubSync: (() => void) | null = null;
let isUnmounted = false;

const loadData = (isBackground = false): Promise<void> => {
  if (isUnmounted) return Promise.resolve();

  return new Promise((resolve) => {
    if (isFetching) {
      pendingRequests.push({ isBackground, resolve });
      return;
    }
    isFetching = true;
    executeFetch(isBackground).then(() => {
      resolve();
      consumePending();
    });
  });
};

const executeFetch = async (isBackground: boolean) => {
  const sessionForThisRun = listSession;

  if (!isBackground) loading.value = true;
  try {
    const response = await getTopping(
      keyword.value,
      trangThai.value,
      currentPage.value - 1,
      pageSize.value
    );
    if (sessionForThisRun !== listSession || isUnmounted) return;
    dsTopping.value = response.data.data.content;
    total.value = response.data.data.totalElements;
  } catch (error: any) {
    if (sessionForThisRun === listSession && !isUnmounted && !isBackground) {
      console.error(error);
    }
  } finally {
    if (sessionForThisRun === listSession && !isUnmounted) {
      const nextIsForeground = pendingRequests.some(r => !r.isBackground);
      if (!isBackground && !nextIsForeground) {
        loading.value = false;
      }
    }
  }
};

const consumePending = () => {
  if (isUnmounted) {
    pendingRequests.forEach(req => req.resolve());
    pendingRequests = [];
    isFetching = false;
    return;
  }
  if (pendingRequests.length > 0) {
    const isBackground = pendingRequests.every(req => req.isBackground);
    if (isBackground && document.visibilityState !== 'visible') {
      isFetching = false;
      return;
    }
    const requestsToProcess = pendingRequests;
    pendingRequests = [];
    isFetching = true;
    executeFetch(isBackground).then(() => {
      requestsToProcess.forEach(req => req.resolve());
      consumePending();
    });
  } else {
    isFetching = false;
  }
};

const triggerRefresh = () => {
  if (isUnmounted) return;
  if (fetchTimeout) clearTimeout(fetchTimeout);
  fetchTimeout = setTimeout(() => {
    if (document.visibilityState === 'visible') {
      loadData(true);
    }
  }, 300);
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
    listSession++;
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
    listSession++;
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
    listSession++;
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
  listSession++;
  currentPage.value = 1;
  loadData();
};

const onPageChange = (page: number, size: number) => {
  listSession++;
  currentPage.value = page;
  pageSize.value = size;
  loadData();
};

const resetFilter = () => {
  listSession++;
  keyword.value = "";
  trangThai.value = undefined;
  currentPage.value = 1;
  loadData();
};

// ============================================================
// Init
// ============================================================
onMounted(() => {
  loadData();

  unsubSync = onDataChanged((type) => {
    if (['TOPPING_UPDATED', 'INVENTORY_UPDATED', 'APP_REVALIDATE'].includes(type)) {
      triggerRefresh();
    }
  });

  pollingInterval = setInterval(() => {
    triggerRefresh();
  }, 10000);
});

onUnmounted(() => {
  isUnmounted = true;
  listSession++;
  if (unsubSync) unsubSync();
  if (pollingInterval) clearInterval(pollingInterval);
  if (fetchTimeout) clearTimeout(fetchTimeout);
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
