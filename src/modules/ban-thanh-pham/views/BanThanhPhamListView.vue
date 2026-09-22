<template>
  <a-card :bordered="false">
    <template #title>
      <span style="font-size:22px;font-weight:700;">🫖 Quản lý bán thành phẩm</span>
    </template>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <a-input-search
          v-model:value="keyword"
          placeholder="Tìm theo tên cốt..."
          allow-clear
          style="width:280px"
          @search="onSearch"
          @change="onSearch"
        />
        <a-select
          v-model:value="filterTrangThai"
          placeholder="Trạng thái"
          allow-clear
          style="width:150px"
          @change="onSearch"
        >
          <a-select-option :value="1">Đang dùng</a-select-option>
          <a-select-option :value="0">Ngừng dùng</a-select-option>
        </a-select>
        <a-tooltip title="Làm mới">
          <a-button shape="circle" @click="resetFilter">↻</a-button>
        </a-tooltip>
      </div>
      <a-button v-if="isAdmin" type="primary" size="large" @click="onAdd">
        + Thêm bán thành phẩm
      </a-button>
    </div>

    <!-- Table -->
    <a-table
      :columns="columns"
      :data-source="filteredList"
      :loading="loading"
      :pagination="{ pageSize: 10, showTotal: (t: number) => `Tổng ${t} bán thành phẩm` }"
      row-key="idBanThanhPham"
      bordered
    >
      <template #bodyCell="{ column, record }">
        <!-- Han su dung -->
        <template v-if="column.key === 'hanSuDungGio'">
          {{ record.hanSuDungGio != null ? `${record.hanSuDungGio} giờ` : '—' }}
        </template>

        <!-- Ton -->
        <template v-if="column.key === 'tongTon'">
          <span :style="record.tongTon <= 0 ? 'color:#ff4d4f;font-weight:700;' : 'font-weight:600;color:#389e0d;'">
            {{ formatNumber(record.tongTon) }} {{ record.donViTinh }}
          </span>
        </template>

        <!-- Trang thai -->
        <template v-if="column.key === 'trangThai'">
          <a-tag :color="record.trangThai === 1 ? 'success' : 'error'">
            {{ record.trangThai === 1 ? 'Đang dùng' : 'Ngừng dùng' }}
          </a-tag>
        </template>

        <!-- Hanh dong -->
        <template v-if="column.key === 'action'">
          <a-dropdown placement="bottomRight">
            <a-button size="small" style="width:40px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;margin:0 auto;">
              <MoreOutlined />
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item v-if="canPhaChe" @click="openCongThuc(record)">Công thức</a-menu-item>
                <a-menu-item @click="openMePha(record)">Mẻ pha</a-menu-item>
                <template v-if="isAdmin">
                  <a-menu-item @click="onEdit(record)">Sửa</a-menu-item>
                  <a-menu-divider />
                  <a-menu-item v-if="record.trangThai === 1" danger @click="confirmLock(record)">
                    Khóa
                  </a-menu-item>
                  <a-menu-item v-else style="color:#52c41a;" @click="confirmUnlock(record)">
                    Mở
                  </a-menu-item>
                </template>
              </a-menu>
            </template>
          </a-dropdown>
        </template>
      </template>
    </a-table>

    <!-- Modal them/sua -->
    <BanThanhPhamForm
      :open="openModal"
      :editData="editing"
      @close="handleCloseModal"
      @save="onSave"
    />

    <!-- Drawer cong thuc -->
    <CongThucBanThanhPhamDrawer
      :open="openCongThucDrawer"
      :btp="selectedBtp"
      @close="openCongThucDrawer = false"
    />

    <!-- Drawer me pha -->
    <MePhaCheDrawer
      :open="openMePhaDrawer"
      :btp="selectedBtp"
      @close="openMePhaDrawer = false"
      @reloadBtp="loadData"
    />
  </a-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { message, Modal } from "ant-design-vue";
import { MoreOutlined } from "@ant-design/icons-vue";
import type { AxiosError } from "axios";
import { useAuthStore } from "@/modules/auth/store/authStore";

import BanThanhPhamForm from "../components/BanThanhPhamForm.vue";
import CongThucBanThanhPhamDrawer from "../components/CongThucBanThanhPhamDrawer.vue";
import MePhaCheDrawer from "../components/MePhaCheDrawer.vue";

import {
  getBanThanhPhamList,
  createBanThanhPham,
  updateBanThanhPham,
  lockBanThanhPham,
  unlockBanThanhPham,
} from "../api/banThanhPhamApi";
import type { BanThanhPham, BanThanhPhamRequest } from "../types/banThanhPham";
import { onDataChanged } from "@/utils/appSync";

// ============================================================
// Auth
// ============================================================
const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.role === "ADMIN");
const canPhaChe = computed(() => authStore.user?.role === "ADMIN" || authStore.user?.role === "STAFF");

// ============================================================
// Helpers
// ============================================================
const formatNumber = (v: number) => new Intl.NumberFormat("vi-VN").format(v);

// ============================================================
// State
// ============================================================
const loading = ref(false);
const allList = ref<BanThanhPham[]>([]);

const keyword = ref("");
const filterTrangThai = ref<number | undefined>(undefined);

// Filter client-side vi BE tra List, khong co pagination
const filteredList = computed(() => {
  let list = allList.value;
  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase();
    list = list.filter((b) => b.tenBanThanhPham.toLowerCase().includes(kw));
  }
  if (filterTrangThai.value !== undefined) {
    list = list.filter((b) => b.trangThai === filterTrangThai.value);
  }
  return list;
});

// ============================================================
// Columns
// ============================================================
const columns = [
  { title: "Tên bán thành phẩm", dataIndex: "tenBanThanhPham", ellipsis: true },
  { title: "Đơn vị", dataIndex: "donViTinh", width: 100, align: "center" as const },
  { title: "Hạn SD", key: "hanSuDungGio", width: 120, align: "center" as const },
  { title: "Tồn hiện tại", key: "tongTon", width: 160, align: "right" as const },
  { title: "Trạng thái", key: "trangThai", width: 130, align: "center" as const },
  { title: "Thao tác", key: "action", width: 90, align: "center" as const },
];

// ============================================================
// Load data
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
    const res = await getBanThanhPhamList();
    if (sessionForThisRun !== listSession || isUnmounted) return;
    allList.value = res.data.data ?? [];
  } catch (error: any) {
    if (sessionForThisRun === listSession && !isUnmounted && !isBackground) {
      console.error(error);
      const e = error as AxiosError<{ message: string }>;
      message.error(e.response?.data?.message || "Không thể tải danh sách bán thành phẩm");
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

const onSearch = () => {
  // filter la computed, khong can goi lai API
};

const resetFilter = () => {
  listSession++;
  keyword.value = "";
  filterTrangThai.value = undefined;
  loadData();
};

onMounted(() => {
  loadData();

  unsubSync = onDataChanged((type) => {
    if (['BAN_THANH_PHAM_UPDATED', 'INVENTORY_UPDATED', 'APP_REVALIDATE'].includes(type)) {
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

// ============================================================
// Modal them/sua
// ============================================================
const openModal = ref(false);
const editing = ref<BanThanhPham | undefined>(undefined);

const onAdd = () => {
  editing.value = undefined;
  openModal.value = true;
};

const onEdit = (record: BanThanhPham) => {
  editing.value = { ...record };
  openModal.value = true;
};

const handleCloseModal = () => {
  editing.value = undefined;
  openModal.value = false;
};

const onSave = async (data: BanThanhPhamRequest) => {
  try {
    if (editing.value) {
      await updateBanThanhPham(editing.value.idBanThanhPham, data);
      message.success("Cập nhật thành công!");
    } else {
      await createBanThanhPham(data);
      message.success("Thêm bán thành phẩm thành công!");
    }
    openModal.value = false;
    editing.value = undefined;
    listSession++;
    await loadData();
  } catch (err) {
    const e = err as AxiosError<{ message: string }>;
    message.error(e.response?.data?.message || "Có lỗi xảy ra");
  }
};

// ============================================================
// Lock / Unlock
// ============================================================
const onLock = async (id: number) => {
  try {
    await lockBanThanhPham(id);
    message.success("Khóa BTP thành công");
    listSession++;
    await loadData();
  } catch (err) {
    const e = err as AxiosError<{ message: string }>;
    message.error(e.response?.data?.message || "Có lỗi xảy ra");
  }
};

const confirmLock = (record: BanThanhPham) => {
  Modal.confirm({
    title: "Ngừng dùng bán thành phẩm này?",
    okText: "Ngừng dùng",
    cancelText: "Hủy",
    okType: "danger",
    onOk: () => onLock(record.idBanThanhPham),
  });
};

const onUnlock = async (id: number) => {
  try {
    await unlockBanThanhPham(id);
    message.success("Mở khóa BTP thành công");
    listSession++;
    await loadData();
  } catch (err) {
    const e = err as AxiosError<{ message: string }>;
    message.error(e.response?.data?.message || "Có lỗi xảy ra");
  }
};

const confirmUnlock = (record: BanThanhPham) => {
  Modal.confirm({
    title: "Mở lại bán thành phẩm này?",
    okText: "Mở",
    cancelText: "Hủy",
    onOk: () => onUnlock(record.idBanThanhPham),
  });
};


// ============================================================
// Drawers
// ============================================================
const selectedBtp = ref<BanThanhPham | undefined>(undefined);
const openCongThucDrawer = ref(false);
const openMePhaDrawer = ref(false);

const openCongThuc = (record: BanThanhPham) => {
  selectedBtp.value = { ...record };
  openCongThucDrawer.value = true;
};

const openMePha = (record: BanThanhPham) => {
  selectedBtp.value = { ...record };
  openMePhaDrawer.value = true;
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
.ant-card { border-radius: 12px; }
:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 700;
}
:deep(.ant-tag) {
  border-radius: 6px;
  padding: 2px 10px;
  font-weight: 600;
}
</style>
