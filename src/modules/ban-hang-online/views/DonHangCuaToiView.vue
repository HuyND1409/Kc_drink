<template>
  <div class="orders-page container mx-auto">
    <div class="orders-container">
      <div class="page-header">
        <h2 class="page-title">Đơn hàng của tôi</h2>
        <p class="page-subtitle">Theo dõi các đơn hàng bạn đã đặt</p>
      </div>
      
      <div class="filter-tabs">
        <div 
          class="filter-tab" 
          :class="{ active: filterStatus === 'ALL' }" 
          @click="filterStatus = 'ALL'"
        >
          Tất cả
        </div>
        <div 
          class="filter-tab" 
          :class="{ active: filterStatus === 'CHO_THANH_TOAN' }" 
          @click="filterStatus = 'CHO_THANH_TOAN'"
        >
          Chờ thanh toán
        </div>
        <div 
          class="filter-tab" 
          :class="{ active: filterStatus === 'DA_THANH_TOAN' }" 
          @click="filterStatus = 'DA_THANH_TOAN'"
        >
          Đã thanh toán
        </div>
        <div 
          class="filter-tab" 
          :class="{ active: filterStatus === 'DA_HUY' }" 
          @click="filterStatus = 'DA_HUY'"
        >
          Đã hủy
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <a-spin size="large" />
        <p class="mt-4">Đang tải danh sách đơn hàng...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p class="text-danger">{{ error }}</p>
        <button class="retry-btn" @click="() => fetchOrders()">Thử lại</button>
      </div>

      <div v-else-if="filteredOrders.length === 0" class="empty-state">
        <a-empty description="Bạn chưa có đơn hàng nào" />
        <button class="shop-btn mt-4" @click="router.push('/shop')">Khám phá menu</button>
      </div>

      <div v-else class="orders-list">
        <div 
          v-for="order in filteredOrders" 
          :key="order.idHoaDon" 
          class="order-card"
          @click="goToDetail(order.idHoaDon)"
        >
          <div class="card-header">
            <div class="header-left">
              <span class="order-code">#{{ order.maHoaDon }}</span>
              <span class="order-date">{{ formatDate(order.ngayTao) }}</span>
            </div>
            <div class="header-right">
              <span class="badge status-badge" :class="getBadgeClass(order.trangThai)">
                {{ getStatusText(order.trangThai) }}
              </span>
            </div>
          </div>
          
          <div class="card-body-grid">
            <div class="grid-col">
              <div class="col-label">Tổng tiền</div>
              <div class="col-value total-price">{{ formatCurrency(order.thanhTien) }}</div>
            </div>
            <div class="grid-col">
              <div class="col-label">Thanh toán</div>
              <div class="col-value">{{ getStatusText(order.trangThai) }}</div>
            </div>
            <div class="grid-col">
              <div class="col-label">Vận chuyển</div>
              <div class="col-value">
                {{ order.trangThaiVanDon ? getStatusText(order.trangThaiVanDon) : 'Chờ tạo vận đơn' }}
              </div>
            </div>
          </div>
          
          <div class="card-footer">
            <div class="view-detail-link" @click.stop="goToDetail(order.idHoaDon)">
              Xem chi tiết <span class="arrow">&rarr;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { onDataChanged } from '@/utils/appSync';
import { getOnlineOrders } from '@/modules/ban-hang-online/api/banHangOnlineApi';
import type { DonHangOnlineSummary } from '@/modules/ban-hang-online/types/banHangOnline';

const router = useRouter();
const orders = ref<DonHangOnlineSummary[]>([]);
const loading = ref(true);
const error = ref('');
const filterStatus = ref('ALL');

let cleanupAppSync: (() => void) | null = null;
let donHangPollingInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  fetchOrders();

  cleanupAppSync = onDataChanged((type) => {
    const relevantEvents = [
      "ONLINE_ORDER_UPDATED",
      "HOA_DON_UPDATED",
      "GHN_UPDATED",
      "APP_REVALIDATE"
    ];
    if (relevantEvents.includes(type)) {
      fetchOrders(true);
    }
  });

  donHangPollingInterval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      fetchOrders(true);
    }
  }, 5000);
});

onUnmounted(() => {
  if (cleanupAppSync) cleanupAppSync();
  if (donHangPollingInterval) clearInterval(donHangPollingInterval);
});

const fetchOrders = async (silent = false) => {
  if (!silent) {
    loading.value = true;
    error.value = '';
  }
  try {
    const res = await getOnlineOrders();
    if (res.data.code === 200) {
      if (res.data.data && Array.isArray(res.data.data.content)) {
        orders.value = res.data.data.content;
      } else {
        orders.value = (res.data.data as any) || [];
      }
    } else {
      if (!silent) error.value = res.data.message || 'Lỗi khi tải danh sách đơn hàng';
    }
  } catch (err: any) {
    if (!silent) error.value = err.response?.data?.message || 'Lỗi mạng khi tải danh sách';
  } finally {
    if (!silent) loading.value = false;
  }
};

const filteredOrders = computed(() => {
  if (filterStatus.value === 'ALL') return orders.value;
  return orders.value.filter(o => o.trangThai === filterStatus.value);
});

const goToDetail = (id: number) => {
  router.push(`/shop/orders/${id}`);
};

const formatCurrency = (value: number | null | undefined) => {
  const safeValue =
    typeof value === "number" && Number.isFinite(value)
      ? value
      : 0;

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND"
  }).format(safeValue);
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', { 
    year: 'numeric', month: '2-digit', day: '2-digit', 
    hour: '2-digit', minute: '2-digit'
  }).format(date);
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    'CHO_THANH_TOAN': 'Chờ thanh toán',
    'DA_THANH_TOAN': 'Đã thanh toán',
    'CHO_XAC_NHAN': 'Chờ xác nhận',
    'DANG_GIAO_HANG': 'Đang giao hàng',
    'DA_GIAO': 'Đã giao',
    'DA_HUY': 'Đã hủy',
    'CHO_TAO_DON': 'Chờ tạo vận đơn',
    'DA_TAO_DON': 'Đã tạo vận đơn'
  };
  return map[status] || status;
};

const getBadgeClass = (status: string) => {
  if (status === 'DA_THANH_TOAN') return 'badge-success';
  if (status === 'CHO_THANH_TOAN') return 'badge-warning';
  if (status === 'DA_HUY') return 'badge-danger';
  return 'badge-default';
};

</script>

<style scoped>
.orders-page {
  padding: 56px 24px 80px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #1E1E1E;
}

.orders-container {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  text-align: left;
  margin-bottom: 24px;
}

.page-title {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 8px;
  color: #2B2724;
}

.page-subtitle {
  font-size: 16px;
  color: #746B63;
}

.filter-tabs {
  display: flex;
  justify-content: flex-start;
  gap: 12px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 8px 20px;
  border-radius: 20px;
  background: #F7F3ED;
  color: #746B63;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.filter-tab:hover {
  background: #E8E0D7;
}

.filter-tab.active {
  background: #8B5E3C;
  color: #FFFDFC;
  box-shadow: 0 4px 10px rgba(139, 94, 60, 0.2);
}

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 80px 0;
  background: #FFFDFC;
  border-radius: 16px;
  border: 1px solid #E8E0D7;
  width: 100%;
}

.shop-btn {
  background: #8B5E3C;
  color: #FFFDFC;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.shop-btn:hover {
  background: #6F452D;
  transform: translateY(-1px);
}

.text-danger { color: #D9363E; margin-bottom: 16px; }
.retry-btn { padding: 8px 24px; border-radius: 8px; border: 1px solid #2B2724; background: transparent; cursor: pointer; font-weight: 600; }

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.order-card {
  width: 100%;
  background: #FFFDFC;
  border: 1px solid #E8E0D7;
  border-radius: 14px;
  padding: 24px 28px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.015);
}

.order-card:hover {
  border-color: #D2BCA8;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #E8E0D7;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.order-code {
  font-weight: 700;
  font-size: 18px;
  color: #2B2724;
}

.order-date {
  font-size: 13px;
  color: #746B63;
}

.badge {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.badge-success {
  background: #E8F0E6;
  color: #5F7057;
}

.badge-warning {
  background: #FDF6E3;
  color: #A66A3F;
}

.badge-danger {
  background: #FDECEA;
  color: #D9363E;
}

.badge-default {
  background: #F0ECE6;
  color: #746B63;
}

.card-body-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 20px;
}

.grid-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.col-label {
  color: #746B63;
  font-size: 13px;
}

.col-value {
  font-weight: 600;
  color: #2B2724;
  font-size: 15px;
}

.total-price {
  color: #8B5E3C;
  font-size: 18px;
  font-weight: 700;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #F7F3ED;
  padding-top: 16px;
}

.view-detail-link {
  font-size: 14px;
  color: #8B5E3C;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.view-detail-link .arrow {
  transition: transform 0.2s ease;
}

.view-detail-link:hover {
  color: #6F452D;
}

.view-detail-link:hover .arrow {
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .orders-page {
    padding: 32px 16px 60px;
  }
  
  .filter-tabs {
    gap: 8px;
    justify-content: flex-start;
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 8px;
  }
  
  .filter-tab {
    white-space: nowrap;
  }
  
  .card-body-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .header-right {
    align-self: flex-start;
  }
}
</style>
