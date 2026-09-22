<template>
  <a-card :bordered="false">
    <template #title>
      <span style="font-size:22px;font-weight:700;">
        🧾 Quản lý hóa đơn
      </span>
    </template>

    <!-- BỘ LỌC -->
    <div class="toolbar">
      <div class="toolbar-left">
        <a-input-search
          v-model:value="filters.keyword"
          placeholder="Mã HĐ, tên/SĐT khách, mã GHN..."
          allow-clear
          style="width: 250px"
          @search="onSearch"
        />

        <a-select
          v-model:value="filters.trangThai"
          placeholder="Trạng thái HĐ"
          allow-clear
          style="width: 150px"
          @change="onSearch"
        >
          <a-select-option value="CHO_THANH_TOAN">Chờ thanh toán</a-select-option>
          <a-select-option value="DA_THANH_TOAN">Đã thanh toán</a-select-option>
          <a-select-option value="DA_HUY">Đã hủy</a-select-option>
        </a-select>

        <a-select
          v-model:value="filters.loaiHoaDon"
          placeholder="Loại đơn"
          allow-clear
          style="width: 130px"
          @change="onSearch"
        >
          <a-select-option value="OFFLINE">Tại quầy</a-select-option>
          <a-select-option value="ONLINE">Online</a-select-option>
        </a-select>

        <a-select
          v-model:value="filters.hinhThucThanhToan"
          placeholder="Phương thức TT"
          allow-clear
          style="width: 170px"
          @change="onSearch"
        >
          <a-select-option value="TIEN_MAT">
            Tiền mặt
          </a-select-option>
          <a-select-option value="CHUYEN_KHOAN">
            Chuyển khoản QR
          </a-select-option>
        </a-select>

        <a-select
          v-model:value="coGiaoHangStr"
          placeholder="Hình thức nhận"
          allow-clear
          style="width: 150px"
          @change="onSearch"
        >
          <a-select-option value="false">Nhận tại quầy</a-select-option>
          <a-select-option value="true">Giao hàng</a-select-option>
        </a-select>

        <a-select
          v-model:value="filters.trangThaiGhn"
          placeholder="Trạng thái GHN"
          allow-clear
          style="width: 160px"
          @change="onSearch"
        >
          <a-select-option value="ready_to_pick">Chờ lấy hàng</a-select-option>
          <a-select-option value="picking">Đang lấy hàng</a-select-option>
          <a-select-option value="transporting">Đang vận chuyển</a-select-option>
          <a-select-option value="delivering">Đang giao hàng</a-select-option>
          <a-select-option value="delivered">Giao thành công</a-select-option>
          <a-select-option value="cancel">Đã hủy</a-select-option>
          <a-select-option value="return">Đang hoàn hàng</a-select-option>
          <a-select-option value="returned">Đã hoàn hàng</a-select-option>
        </a-select>

        <a-range-picker
          v-model:value="dateRange"
          format="DD/MM/YYYY"
          @change="onDateRangeChange"
          style="width: 240px"
        />

        <a-tooltip title="Làm mới">
          <a-button shape="circle" @click="resetFilter">↻</a-button>
        </a-tooltip>
      </div>
    </div>

    <!-- BẢNG DANH SÁCH -->
    <a-table
      :columns="columns"
      :data-source="dsHoaDon"
      :loading="loading"
      :pagination="pagination"
      row-key="idHoaDon"
      @change="handleTableChange"
      bordered
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'maHoaDon'">
          <span style="font-weight: 600">{{ record.maHoaDon }}</span>
        </template>

        <template v-if="column.key === 'ngayTao'">
          {{ formatDateTime(record.ngayTao) }}
        </template>

        <template v-if="column.key === 'khachHang'">
          <div v-if="record.tenKhachHang">
            <div>{{ record.tenKhachHang }}</div>
            <div style="font-size: 12px; color: #8c8c8c">{{ record.sdtKhachHang }}</div>
          </div>
          <span v-else style="color: #bfbfbf">Khách lẻ</span>
        </template>

        <template v-if="column.key === 'loaiHoaDon'">
          <a-tag color="blue" v-if="record.loaiHoaDon === 'ONLINE'">Online</a-tag>
          <a-tag color="purple" v-else>Tại quầy</a-tag>
        </template>

        <template v-if="column.key === 'hinhThucThanhToan'">
          {{ formatPaymentMethod(record.hinhThucThanhToan) }}
        </template>

        <template v-if="column.key === 'hinhThucNhan'">
          <template v-if="!record.coGiaoHang">
            <a-tag>Nhận tại quầy</a-tag>
          </template>
          <template v-else>
            <div v-if="record.maVanDonGhn" style="color: #1677ff; font-weight: 500">
              {{ record.maVanDonGhn }}
            </div>
            <a-tag color="warning" v-else>Chưa tạo đơn GHN</a-tag>
          </template>
        </template>

        <template v-if="column.key === 'thanhTien'">
          <span style="font-weight: 600; color: #ff4d4f">
            {{ formatCurrency(record.thanhTien) }}
          </span>
        </template>

        <template v-if="column.key === 'trangThai'">
          <a-tag :color="getTrangThaiColor(record.trangThai)">
            {{ formatTrangThai(record.trangThai) }}
          </a-tag>
        </template>

        <template v-if="column.key === 'trangThaiGhn'">
          <a-tag color="cyan" v-if="record.trangThaiGhn">
            {{ translateGhnStatus(record.trangThaiGhn) }}
          </a-tag>
          <span v-else>-</span>
        </template>

        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" @click="openDetail(record.idHoaDon)">
            Xem
          </a-button>
        </template>
      </template>
    </a-table>

    <!-- DRAWER CHI TIẾT -->
    <HoaDonDetailDrawer
      :open="detailOpen"
      :id-hoa-don="selectedHoaDonId"
      @close="detailOpen = false"
      @refreshed="fetchData"
    />
  </a-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "ant-design-vue";
import dayjs from "dayjs";
import { getDanhSachHoaDon } from "../api/hoaDonApi";
import type { HoaDonListItem, GetHoaDonParams } from "../types/hoaDon";
import HoaDonDetailDrawer from "../components/HoaDonDetailDrawer.vue";
import { onDataChanged } from '@/utils/appSync';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const dsHoaDon = ref<HoaDonListItem[]>([]);
const filters = reactive({
  keyword: undefined as string | undefined,
  trangThai: undefined as string | undefined,
  loaiHoaDon: undefined as string | undefined,
  hinhThucThanhToan: undefined as string | undefined,
  trangThaiGhn: undefined as string | undefined,
  tuNgay: undefined as string | undefined,
  denNgay: undefined as string | undefined,
});
const coGiaoHangStr = ref<string | undefined>(undefined);
const dateRange = ref<any>([]);

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `Tổng cộng ${total} hóa đơn`,
});

const columns = [
  { title: "Mã HĐ", key: "maHoaDon", width: 120 },
  { title: "Ngày tạo", key: "ngayTao", width: 150 },
  { title: "Khách hàng", key: "khachHang", width: 180 },
  { title: "Loại đơn", key: "loaiHoaDon", width: 100 },
  { title: "Thanh toán", key: "hinhThucThanhToan", width: 130 },
  { title: "Nhận hàng", key: "hinhThucNhan", width: 150 },
  { title: "Tổng TT", key: "thanhTien", width: 120, align: "right" as const },
  { title: "Trạng thái", key: "trangThai", width: 130 },
  { title: "TT GHN", key: "trangThaiGhn", width: 130 },
  { title: "Thao tác", key: "action", width: 80, align: "center" as const },
];

const detailOpen = ref(false);
const selectedHoaDonId = ref<number | null>(null);

let listSession = 0;
let fetchTimeout: ReturnType<typeof setTimeout> | null = null;
let isFetching = false;
let pendingRequests: Array<{ isBackground: boolean, resolve: () => void }> = [];
let pollingInterval: ReturnType<typeof setInterval> | null = null;
let unsubSync: (() => void) | null = null;
let isUnmounted = false;

const fetchData = (isBackground = false): Promise<void> => {
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
    let coGiaoHang: boolean | undefined = undefined;
    if (coGiaoHangStr.value === "true") coGiaoHang = true;
    else if (coGiaoHangStr.value === "false") coGiaoHang = false;

    const params: GetHoaDonParams = {
      ...filters,
      coGiaoHang,
      page: pagination.current - 1,
      size: pagination.pageSize,
      sortBy: "ngayTao",
      direction: "desc",
    };

    const res = await getDanhSachHoaDon(params);
    if (sessionForThisRun !== listSession || isUnmounted) return;

    const data = res.data?.data ?? res.data;
    dsHoaDon.value = data.content;
    pagination.total = data.totalElements;
  } catch (err: any) {
    if (sessionForThisRun === listSession && !isUnmounted && !isBackground) {
      message.error(err.response?.data?.message || "Lỗi khi lấy danh sách hóa đơn");
      console.error(err);
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
      fetchData(true);
    }
  }, 300);
};

const onSearch = () => {
  listSession++;
  pagination.current = 1;
  fetchData();
};

const onDateRangeChange = (dates: any) => {
  filters.tuNgay = dates?.[0]
    ? dayjs(dates[0]).format("YYYY-MM-DD")
    : undefined;

  filters.denNgay = dates?.[1]
    ? dayjs(dates[1]).format("YYYY-MM-DD")
    : undefined;

  onSearch();
};

const resetFilter = () => {
  filters.keyword = undefined;
  filters.trangThai = undefined;
  filters.loaiHoaDon = undefined;
  filters.hinhThucThanhToan = undefined;
  filters.trangThaiGhn = undefined;
  filters.tuNgay = undefined;
  filters.denNgay = undefined;
  coGiaoHangStr.value = undefined;
  dateRange.value = null;
  onSearch();
};

const handleTableChange = (pag: any) => {
  listSession++;
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
};

const openDetail = (id: number) => {
  selectedHoaDonId.value = id;
  detailOpen.value = true;
  // Update URL silently
  router.replace({ query: { ...route.query, id: String(id) } });
};

watch(() => detailOpen.value, (isOpen: boolean) => {
  if (!isOpen) {
    // Remove id from URL silently when drawer closes
    const q = { ...route.query };
    delete q.id;
    router.replace({ query: q });
  }
});

onMounted(() => {
  fetchData();
  // Support opening detail via URL
  const queryId = route.query.id;
  if (queryId && !isNaN(Number(queryId))) {
    openDetail(Number(queryId));
  }

  unsubSync = onDataChanged((type) => {
    if (['ONLINE_ORDER_UPDATED', 'HOA_DON_UPDATED', 'GHN_UPDATED', 'APP_REVALIDATE'].includes(type)) {
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

// --- Formatters ---
const formatCurrency = (val?: number) =>
  (val ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const formatDateTime = (val?: string | null) =>
  val ? dayjs(val).format("DD/MM/YYYY HH:mm") : "";

const formatTrangThai = (status?: string) => {
  if (status === "CHO_THANH_TOAN") return "Chờ thanh toán";
  if (status === "DA_THANH_TOAN") return "Đã thanh toán";
  if (status === "DA_HUY") return "Đã hủy";
  return status || "";
};

const getTrangThaiColor = (status?: string) => {
  if (status === "CHO_THANH_TOAN") return "orange";
  if (status === "DA_THANH_TOAN") return "success";
  if (status === "DA_HUY") return "error";
  return "default";
};

const formatPaymentMethod = (method?: string | null) => {
  if (method === "TIEN_MAT") return "Tiền mặt";
  if (method === "CHUYEN_KHOAN") return "Chuyển khoản QR";
  return method || "Chưa xác định";
};

const translateGhnStatus = (status?: string | null) => {
  if (!status) return "";
  const map: Record<string, string> = {
    ready_to_pick: "Chờ lấy hàng",
    picking: "Đang lấy hàng",
    transporting: "Đang vận chuyển",
    delivering: "Đang giao hàng",
    delivered: "Giao thành công",
    cancel: "Đã hủy",
    return: "Đang hoàn hàng",
    returned: "Đã hoàn hàng"
  };
  return map[status] || status;
};
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}
.toolbar-left {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
</style>
