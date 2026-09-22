<template>
  <div class="online-orders-container">
    <div class="header">
      <div>
        <h2 class="title">Đơn hàng online</h2>
        <span class="subtitle">Đơn khách đã đặt từ website</span>
      </div>
      <div class="actions">
        <a-input-search
          v-model:value="keyword"
          placeholder="Tìm mã đơn, tên khách, SĐT..."
          style="width: 250px"
          @search="onSearch"
          allow-clear
        />
      </div>
    </div>

    <div class="filters">
      <a-radio-group v-model:value="filterStatus" @change="onFilterChange">
        <a-radio-button value="ALL">Tất cả</a-radio-button>
        <a-radio-button value="CHO_XU_LY">Chờ xử lý</a-radio-button>
        <a-radio-button value="DA_TAO_DON">Đã tạo vận đơn</a-radio-button>
        <a-radio-button value="DA_HUY">Đã hủy</a-radio-button>
      </a-radio-group>
    </div>

    <div class="list-container">
      <a-table
        :dataSource="dataSource"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        rowKey="idHoaDon"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'maHoaDon'">
            <div style="font-weight: 600">{{ record.maHoaDon }}</div>
            <div style="font-size: 12px; color: #888">{{ formatDate(record.ngayTao) }}</div>
          </template>

          <template v-if="column.key === 'khachHang'">
            <div>{{ record.tenKhachHang || 'Khách lẻ' }}</div>
            <div style="font-size: 12px; color: #888">{{ record.sdtKhachHang }}</div>
          </template>

          <template v-if="column.key === 'tongTien'">
            <div style="font-weight: 600">{{ formatCurrency(record.thanhTien) }}</div>
          </template>

          <template v-if="column.key === 'thanhToan'">
            <a-tag :color="getPaymentBadgeColor(record.payosStatus, record.trangThai)">
              {{ mapPaymentStatus(record.payosStatus) || mapOrderStatus(record.trangThai) }}
            </a-tag>
          </template>

          <template v-if="column.key === 'vanChuyen'">
            <a-tag v-if="record.trangThaiVanDon" :color="getShippingBadgeColor(record.trangThaiVanDon)">
              {{ mapShippingStatus(record.trangThaiVanDon) }}
            </a-tag>
            <div v-if="record.maVanDonGhn" style="font-size: 12px; margin-top: 4px; color: #1890ff">GHN: {{ record.maVanDonGhn }}</div>
          </template>

          <template v-if="column.key === 'action'">
            <a-button type="link" @click="viewDetail(record)">Xem chi tiết</a-button>
          </template>
        </template>
      </a-table>
    </div>

    <!-- Drawer chi tiết đơn -->
    <a-drawer
      title="Chi tiết đơn online"
      placement="right"
      width="1100"
      :open="drawerVisible"
      :body-style="{ padding: '16px' }"
      @close="drawerVisible = false"
    >
      <PosOnlineOrderDetail
        v-if="selectedOrder"
        :orderId="selectedOrder.idHoaDon"
        :open="drawerVisible"
        @refresh="fetchOrders"
      />
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { getHoaDonOnline } from '../api/posApi';
import type { HoaDonListItem } from '../types/pos';
import PosOnlineOrderDetail from './PosOnlineOrderDetail.vue';
import { onDataChanged } from '@/utils/appSync';

const keyword = ref('');
const filterStatus = ref('ALL');
const loading = ref(false);
const dataSource = ref<HoaDonListItem[]>([]);
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
});
const drawerVisible = ref(false);
const selectedOrder = ref<HoaDonListItem | null>(null);

const columns = [
  { title: 'Đơn hàng', key: 'maHoaDon', width: 220 },
  { title: 'Khách hàng', key: 'khachHang', width: 260 },
  { title: 'Tổng tiền', key: 'tongTien', width: 140 },
  { title: 'Thanh toán', key: 'thanhToan', width: 150 },
  { title: 'Vận chuyển', key: 'vanChuyen', width: 200 },
  { title: '', key: 'action', width: 120 },
];

let listSession = 0;
let fetchTimeout: ReturnType<typeof setTimeout> | null = null;
let isFetching = false;
let pendingRequests: Array<{ isBackground: boolean, resolve: () => void }> = [];
let pollingInterval: ReturnType<typeof setInterval> | null = null;
let unsubSync: (() => void) | null = null;
let isUnmounted = false;

const fetchOrders = (isBackground = false): Promise<void> => {
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
    const params: any = {
      page: pagination.value.current - 1,
      size: pagination.value.pageSize,
      sortBy: 'ngayTao',
      direction: 'desc',
      keyword: keyword.value,
    };

    if (filterStatus.value === 'CHO_XU_LY') {
      params.trangThaiVanDon = 'CHO_XU_LY';
    } else if (filterStatus.value === 'DA_TAO_DON') {
      params.trangThaiVanDon = 'DA_TAO_DON';
    } else if (filterStatus.value === 'DA_HUY') {
      params.trangThai = 'DA_HUY';
    }

    const res = await getHoaDonOnline(params);
    if (sessionForThisRun !== listSession || isUnmounted) return;

    if (res.data.code === 200) {
      dataSource.value = res.data.data.content;
      pagination.value.total = res.data.data.totalElements;
    }
  } catch (err) {
    if (sessionForThisRun === listSession && !isUnmounted && !isBackground) {
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
      fetchOrders(true);
    }
  }, 300);
};

onMounted(() => {
  fetchOrders();

  unsubSync = onDataChanged((type) => {
    if (['ONLINE_ORDER_UPDATED', 'HOA_DON_UPDATED', 'GHN_UPDATED', 'APP_REVALIDATE'].includes(type)) {
      triggerRefresh();
    }
  });

  pollingInterval = setInterval(() => {
    triggerRefresh();
  }, 5000);
});

onUnmounted(() => {
  isUnmounted = true;
  listSession++;
  if (unsubSync) unsubSync();
  if (pollingInterval) clearInterval(pollingInterval);
  if (fetchTimeout) clearTimeout(fetchTimeout);
});

const onSearch = () => {
  listSession++;
  pagination.value.current = 1;
  fetchOrders();
};

const onFilterChange = () => {
  listSession++;
  pagination.value.current = 1;
  fetchOrders();
};

const handleTableChange = (pag: any) => {
  listSession++;
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  fetchOrders();
};

const viewDetail = (record: HoaDonListItem) => {
  selectedOrder.value = record;
  drawerVisible.value = true;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('vi-VN');
};

const formatCurrency = (val?: number) => {
  if (!val) return '0 đ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};

const mapPaymentStatus = (status: string | null) => {
  if (status === 'PAID') return 'Đã thanh toán';
  if (status === 'PENDING') return 'Chờ thanh toán';
  if (status === 'CANCELLED') return 'Đã hủy';
  if (status === 'EXPIRED') return 'Hết hạn';
  return status;
};

const mapOrderStatus = (status: string | null) => {
  if (status === 'DA_THANH_TOAN') return 'Đã thanh toán';
  if (status === 'CHO_THANH_TOAN') return 'Chờ thanh toán';
  if (status === 'DA_HUY') return 'Đã hủy';
  return status;
};

const mapShippingStatus = (status: string | null) => {
  if (status === 'CHO_TAO_DON') return 'Chờ tiếp nhận';
  if (status === 'DA_TIEP_NHAN') return 'Đã tiếp nhận';
  if (status === 'DA_TAO_DON') return 'Đã tạo vận đơn';
  if (status === 'DANG_GIAO') return 'Đang giao';
  if (status === 'GIAO_THANH_CONG') return 'Đã giao';
  if (status === 'DA_HUY') return 'Đã hủy';
  if (status === 'CHO_THANH_TOAN') return 'Chờ thanh toán';
  return status;
};

const getPaymentBadgeColor = (payosStatus: string | null, trangThai: string | null) => {
  const s = payosStatus || trangThai;
  if (s === 'PAID' || s === 'DA_THANH_TOAN') return 'success';
  if (s === 'CANCELLED' || s === 'DA_HUY' || s === 'EXPIRED') return 'default';
  if (s === 'PENDING' || s === 'CHO_THANH_TOAN') return 'warning';
  return 'default';
};

const getShippingBadgeColor = (status: string | null) => {
  if (status === 'CHO_TAO_DON') return 'warning';
  if (status === 'DA_TIEP_NHAN') return 'processing';
  if (status === 'DA_TAO_DON') return 'blue';
  if (status === 'DANG_GIAO') return 'cyan';
  if (status === 'GIAO_THANH_CONG') return 'success';
  if (status === 'DA_HUY') return 'default';
  if (status === 'CHO_THANH_TOAN') return 'default';
  return 'default';
};
</script>

<style scoped>
.online-orders-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-shrink: 0;
}

.title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: #1f2937;
}

.subtitle {
  color: #6b7280;
  font-size: 14px;
}

.filters {
  margin-bottom: 16px;
  flex-shrink: 0;
}

.list-container {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: white;
}
</style>
