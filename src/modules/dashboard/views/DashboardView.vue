<template>
  <div>
    <a-card :bordered="false" class="custom-card" style="margin-bottom: 20px">
      <template #title>
        <span class="card-title">📊 Tổng quan hệ thống</span>
        <div class="card-subtitle">
          Xin chào, <strong>{{ auth.user?.tenNguoiDung || 'Admin' }}</strong> 👋 — Quyền hạn:
          <a-tag color="blue" style="margin-left: 4px">{{ auth.user?.role || '—' }}</a-tag>
        </div>
      </template>

      <a-spin :spinning="loading">
        <!-- TAB SELECTOR -->
        <div class="tab-bar">
          <button
            class="tab-btn"
            :class="{ 'tab-btn--active': activeTab === 'business' }"
            @click="activeTab = 'business'"
          >
            💰 Kinh doanh
          </button>
          <button
            class="tab-btn"
            :class="{ 'tab-btn--active': activeTab === 'warehouse' }"
            @click="activeTab = 'warehouse'"
          >
            📦 Kho
          </button>
          <button
            class="tab-btn"
            :class="{ 'tab-btn--active': activeTab === 'staff' }"
            @click="activeTab = 'staff'"
          >
            👨‍💼 Nhân sự
          </button>
        </div>

        <!-- ==================== TAB 1: KINH DOANH ==================== -->
        <div v-if="activeTab === 'business'">
          <!-- 1. Kinh doanh hôm nay -->
          <div class="section-label" style="margin-top: 16px">💰 Kinh doanh hôm nay</div>
          <div class="business-row">
            <div class="kpi-card kpi-card--highlight">
              <span class="kpi-icon">💰</span>
              <div class="kpi-body">
                <div class="kpi-label">Doanh thu hôm nay</div>
                <div class="kpi-value kpi-value--blue">{{ formatCurrency(data.doanhThuHomNay) }}</div>
              </div>
            </div>
            <div class="kpi-card">
              <span class="kpi-icon">🌐</span>
              <div class="kpi-body">
                <div class="kpi-label">Đơn online</div>
                <div class="kpi-value">{{ data.donOnlineHomNay }}</div>
              </div>
            </div>
            <div class="kpi-card">
              <span class="kpi-icon">🏪</span>
              <div class="kpi-body">
                <div class="kpi-label">Đơn tại quầy</div>
                <div class="kpi-value">{{ data.donOfflineHomNay }}</div>
              </div>
            </div>
            <div class="kpi-card">
              <span class="kpi-icon">✅</span>
              <div class="kpi-body">
                <div class="kpi-label">Đã thanh toán</div>
                <div class="kpi-value kpi-value--green">{{ data.donDaThanhToanHomNay }}</div>
              </div>
            </div>
            <div class="kpi-card">
              <span class="kpi-icon">❌</span>
              <div class="kpi-body">
                <div class="kpi-label">Đã hủy</div>
                <div class="kpi-value" :class="data.donDaHuyHomNay > 0 ? 'kpi-value--red' : ''">{{ data.donDaHuyHomNay }}</div>
              </div>
            </div>
          </div>

          <!-- 2. Xu hướng 7 ngày -->
          <div class="section-label" style="margin-top: 20px">📈 Xu hướng 7 ngày gần nhất</div>
          <div class="trend-layout">
            <!-- Cột trái: biểu đồ doanh thu + đơn hàng -->
            <div class="trend-left">
              <div v-if="data.bieuDo7Ngay && data.bieuDo7Ngay.length > 0" class="dashboard-chart-card stat-card">
                <div class="chart-title">Doanh thu 7 ngày</div>
                <v-chart class="dashboard-chart" :option="revenueChartOption" autoresize />
              </div>
              <div v-if="data.bieuDo7Ngay && data.bieuDo7Ngay.length > 0" class="dashboard-chart-card stat-card" style="margin-top: 12px">
                <div class="chart-title">Đơn hàng Online / Tại quầy</div>
                <v-chart class="dashboard-chart dashboard-chart--orders" :option="orderChartOption" autoresize />
              </div>
              <a-empty v-if="!data.bieuDo7Ngay || data.bieuDo7Ngay.length === 0" description="Chưa có dữ liệu 7 ngày" style="margin: 24px 0" />
            </div>

            <!-- Cột phải: top sản phẩm leaderboard -->
            <div class="trend-right">
              <div class="dashboard-chart-card stat-card leaderboard-card">
                <div class="chart-title">🔥 Sản phẩm bán chạy 7 ngày</div>
                <div v-if="data.topSanPham7Ngay && data.topSanPham7Ngay.length > 0" class="leaderboard">
                  <div
                    v-for="(item, idx) in topSanPhamSorted"
                    :key="item.idSanPham"
                    class="lb-row"
                  >
                    <div class="lb-rank" :class="idx === 0 ? 'lb-rank--gold' : idx === 1 ? 'lb-rank--silver' : idx === 2 ? 'lb-rank--bronze' : ''">
                      {{ idx + 1 }}
                    </div>
                    <div class="lb-info">
                      <div class="lb-name">{{ item.tenSanPham }}</div>
                      <div class="lb-bar-wrap">
                        <div
                          class="lb-bar"
                          :style="{ width: Math.round((item.soLuongBan / topSanPhamMax) * 100) + '%' }"
                        ></div>
                      </div>
                    </div>
                    <div class="lb-stats">
                      <span class="lb-qty">{{ item.soLuongBan }} ly</span>
                      <span class="lb-rev">{{ formatCompactCurrency(item.doanhThu) }}</span>
                    </div>
                  </div>
                </div>
                <a-empty v-else description="Chưa có dữ liệu sản phẩm bán chạy" />
              </div>
            </div>
          </div>

          <!-- 4. Vận hành đơn online -->
          <div class="section-label" style="margin-top: 20px">🚚 Vận hành đơn online</div>
          <div class="kpi-grid kpi-grid--4">
            <div class="kpi-card">
              <span class="kpi-icon">⏳</span>
              <div class="kpi-body">
                <div class="kpi-label">Chờ tiếp nhận</div>
                <div class="kpi-value" :class="data.donChoTiepNhan > 0 ? 'kpi-value--orange' : ''">{{ data.donChoTiepNhan }}</div>
              </div>
            </div>
            <div class="kpi-card">
              <span class="kpi-icon">📥</span>
              <div class="kpi-body">
                <div class="kpi-label">Đã tiếp nhận</div>
                <div class="kpi-value kpi-value--blue">{{ data.donDaTiepNhan }}</div>
              </div>
            </div>
            <div class="kpi-card">
              <span class="kpi-icon">🚚</span>
              <div class="kpi-body">
                <div class="kpi-label">Đang giao</div>
                <div class="kpi-value kpi-value--purple">{{ data.donDangGiao }}</div>
              </div>
            </div>
            <div class="kpi-card">
              <span class="kpi-icon">✅</span>
              <div class="kpi-body">
                <div class="kpi-label">Đã giao</div>
                <div class="kpi-value kpi-value--green">{{ data.donDaGiao }}</div>
              </div>
            </div>
          </div>

          <!-- Secondary: Khách hàng & Voucher -->
          <div class="section-label" style="margin-top: 20px">📋 Thông tin khác</div>
          <div class="kpi-grid kpi-grid--2">
            <div class="kpi-card">
              <span class="kpi-icon">👤</span>
              <div class="kpi-body">
                <div class="kpi-label">Khách hàng</div>
                <div class="kpi-value">{{ data.tongKhachHang }}</div>
              </div>
            </div>
            <div class="kpi-card">
              <span class="kpi-icon">🎟️</span>
              <div class="kpi-body">
                <div class="kpi-label">Voucher đang hoạt động</div>
                <div class="kpi-value">{{ data.voucherDangHoatDong }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== TAB 2: KHO ==================== -->
        <div v-if="activeTab === 'warehouse'">
          <div class="section-label" style="margin-top: 16px">📦 Tổng quan kho</div>
          <div class="kpi-grid kpi-grid--3">
            <div class="kpi-card">
              <span class="kpi-icon">🌿</span>
              <div class="kpi-body">
                <div class="kpi-label">Nguyên liệu đang hoạt động</div>
                <div class="kpi-value">{{ data.nguyenLieuDangHoatDong }}</div>
              </div>
            </div>
            <div class="kpi-card">
              <span class="kpi-icon">🧁</span>
              <div class="kpi-body">
                <div class="kpi-label">Topping đang bán</div>
                <div class="kpi-value">{{ data.toppingDangBan }}</div>
              </div>
            </div>
            <div class="kpi-card kpi-card--warn">
              <span class="kpi-icon">📉</span>
              <div class="kpi-body">
                <div class="kpi-label">Nguyên liệu dưới ngưỡng</div>
                <div class="kpi-value" :class="data.nguyenLieuDuoiNguong > 0 ? 'kpi-value--red' : ''">{{ data.nguyenLieuDuoiNguong }}</div>
              </div>
            </div>
          </div>

          <div class="section-label" style="margin-top: 20px">⚠️ Cảnh báo kho</div>
          <div class="kpi-grid kpi-grid--2">
            <div class="kpi-card kpi-card--warn">
              <span class="kpi-icon">⏰</span>
              <div class="kpi-body">
                <div class="kpi-label">Lô nguyên liệu sắp hết hạn</div>
                <div class="kpi-value" :class="data.loNguyenLieuSapHetHan > 0 ? 'kpi-value--orange' : ''">{{ data.loNguyenLieuSapHetHan }}</div>
              </div>
            </div>
            <div class="kpi-card kpi-card--warn">
              <span class="kpi-icon">⏰</span>
              <div class="kpi-body">
                <div class="kpi-label">Lô topping sắp hết hạn</div>
                <div class="kpi-value" :class="data.loToppingSapHetHan > 0 ? 'kpi-value--orange' : ''">{{ data.loToppingSapHetHan }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== TAB 3: NHÂN SỰ ==================== -->
        <div v-if="activeTab === 'staff'">
          <!-- 3 KPI cards: tổng NV, tổng đơn 7 ngày, tổng doanh thu 7 ngày -->
          <div class="section-label" style="margin-top: 16px">Tổng quan nhân sự</div>
          <div class="kpi-grid kpi-grid--3">
            <div class="kpi-card kpi-card--highlight">
              <span class="kpi-icon">🧑‍💼</span>
              <div class="kpi-body">
                <div class="kpi-label">Tổng nhân viên</div>
                <div class="kpi-value kpi-value--blue">{{ data.tongNhanVien }}</div>
              </div>
            </div>
            <div class="kpi-card">
              <span class="kpi-icon">📋</span>
              <div class="kpi-body">
                <div class="kpi-label">Tổng đơn xử lý 7 ngày</div>
                <div class="kpi-value">{{ tongDonNhanVien7Ngay }}</div>
              </div>
            </div>
            <div class="kpi-card kpi-card--highlight">
              <span class="kpi-icon">💵</span>
              <div class="kpi-body">
                <div class="kpi-label">Tổng doanh thu 7 ngày</div>
                <div class="kpi-value kpi-value--blue">{{ formatCurrency(tongDoanhThuNhanVien7Ngay) }}</div>
              </div>
            </div>
          </div>

          <!-- Bảng hiệu suất -->
          <div class="section-label" style="margin-top: 20px">Hiệu suất nhân viên 7 ngày gần nhất</div>
          <div v-if="data.thongKeNhanVien7Ngay && data.thongKeNhanVien7Ngay.length > 0" class="staff-table-wrap">
            <table class="staff-table">
              <thead>
                <tr>
                  <th class="col-rank">Xếp hạng</th>
                  <th class="col-name">Nhân viên</th>
                  <th class="col-orders">Số đơn</th>
                  <th class="col-revenue">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(nv, idx) in data.thongKeNhanVien7Ngay"
                  :key="nv.idNhanVien"
                  :class="idx % 2 === 0 ? 'tr-even' : 'tr-odd'"
                >
                  <td class="col-rank">
                    <span v-if="idx === 0" class="medal">🥇</span>
                    <span v-else-if="idx === 1" class="medal">🥈</span>
                    <span v-else-if="idx === 2" class="medal">🥉</span>
                    <span v-else class="rank-num">{{ idx + 1 }}</span>
                  </td>
                  <td class="col-name">{{ nv.tenNhanVien }}</td>
                  <td class="col-orders">{{ nv.soDon }} đơn</td>
                  <td class="col-revenue">{{ formatCurrency(nv.doanhThu) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <a-empty
            v-else
            description="Chưa có dữ liệu doanh thu nhân viên trong 7 ngày gần nhất"
            style="margin: 24px 0"
          />
        </div>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, computed } from "vue";
import { message } from "ant-design-vue";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart, BarChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
]);
import axios from "axios";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { getDashboard } from "../api/dashboardApi";
import { onDataChanged } from "@/utils/appSync";
import type { DashboardData } from "../api/dashboardApi";

const auth = useAuthStore();
const loading = ref(false);
const activeTab = ref<'business' | 'warehouse' | 'staff'>('business');

const data = reactive<DashboardData>({
  tongKhachHang: 0,
  tongNhanVien: 0,
  voucherDangHoatDong: 0,
  toppingDangBan: 0,
  nguyenLieuDangHoatDong: 0,
  loToppingSapHetHan: 0,
  loNguyenLieuSapHetHan: 0,
  nguyenLieuDuoiNguong: 0,
  doanhThuHomNay: 0,
  donOnlineHomNay: 0,
  donOfflineHomNay: 0,
  donDaThanhToanHomNay: 0,
  donDaHuyHomNay: 0,
  donChoTiepNhan: 0,
  donDaTiepNhan: 0,
  donDangGiao: 0,
  donDaGiao: 0,
  bieuDo7Ngay: [],
  topSanPham7Ngay: [],
  thongKeNhanVien7Ngay: [],
});

const topSanPhamSorted = computed(() =>
  [...data.topSanPham7Ngay].sort((a, b) => b.soLuongBan - a.soLuongBan)
);

const topSanPhamMax = computed(() =>
  topSanPhamSorted.value.length > 0 ? topSanPhamSorted.value[0].soLuongBan : 1
);

const tongDonNhanVien7Ngay = computed(() =>
  data.thongKeNhanVien7Ngay.reduce((sum, nv) => sum + nv.soDon, 0)
);

const tongDoanhThuNhanVien7Ngay = computed(() =>
  data.thongKeNhanVien7Ngay.reduce((sum, nv) => sum + nv.doanhThu, 0)
);

const revenueChartOption = computed(() => {
  const dates = data.bieuDo7Ngay.map((item) => {
    const parts = item.ngay.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.ngay;
  });
  const revenues = data.bieuDo7Ngay.map((item) => item.doanhThu);

  return {
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const val = params[0].value;
        return `${params[0].name}<br/>${params[0].marker} ${new Intl.NumberFormat(
          "vi-VN",
          { style: "currency", currency: "VND" }
        ).format(val)}`;
      },
    },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: dates,
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
          if (value >= 1000) return (value / 1000).toFixed(0) + "K";
          return value;
        },
      },
    },
    series: [
      {
        name: "Doanh thu",
        type: "line",
        smooth: true,
        data: revenues,
        itemStyle: { color: "#1890ff" },
        areaStyle: {
          color: "rgba(24, 144, 255, 0.1)",
        },
      },
    ],
  };
});

const orderChartOption = computed(() => {
  const dates = data.bieuDo7Ngay.map((item) => {
    const parts = item.ngay.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.ngay;
  });
  const onlineOrders = data.bieuDo7Ngay.map((item) => item.donOnline);
  const offlineOrders = data.bieuDo7Ngay.map((item) => item.donOffline);

  return {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    legend: {
      data: ["Online", "Tại quầy"],
      bottom: 0,
    },
    grid: { left: "3%", right: "4%", bottom: "10%", containLabel: true },
    xAxis: {
      type: "category",
      data: dates,
    },
    yAxis: {
      type: "value",
      minInterval: 1,
    },
    series: [
      {
        name: "Online",
        type: "bar",
        data: onlineOrders,
        itemStyle: { color: "#52c41a" },
      },
      {
        name: "Tại quầy",
        type: "bar",
        data: offlineOrders,
        itemStyle: { color: "#fa8c16" },
      },
    ],
  };
});

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value || 0);

const formatCompactCurrency = (value: number) => {
  if (!value) return '0 ₫';
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M ₫';
  if (value >= 1000) return Math.round(value / 1000) + 'K ₫';
  return value + ' ₫';
};

let listSession = 0;
let fetchTimeout: ReturnType<typeof setTimeout> | null = null;
let isFetching = false;
let pendingRequests: Array<{ isBackground: boolean, resolve: () => void }> = [];
let pollingInterval: ReturnType<typeof setInterval> | null = null;
let unsubSync: (() => void) | null = null;
let isUnmounted = false;

const loadDashboard = (isBackground = false): Promise<void> => {
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
    const response = await getDashboard();
    if (sessionForThisRun !== listSession || isUnmounted) return;
    const result = response.data.data;
    if (result) {
      Object.assign(data, result);
    }
  } catch (error: any) {
    if (sessionForThisRun === listSession && !isUnmounted && !isBackground) {
      console.error("Lỗi tải dashboard:", error);
      if (axios.isAxiosError(error)) {
        message.error(
          error.response?.data?.message || "Không thể tải dữ liệu tổng quan"
        );
      } else {
        message.error("Không thể tải dữ liệu tổng quan");
      }
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
      loadDashboard(true);
    }
  }, 300);
};

onMounted(() => {
  loadDashboard();

  unsubSync = onDataChanged((type) => {
    if (['HOA_DON_UPDATED', 'ONLINE_ORDER_UPDATED', 'GHN_UPDATED', 'APP_REVALIDATE'].includes(type)) {
      triggerRefresh();
    }
  });

  pollingInterval = setInterval(() => {
    triggerRefresh();
  }, 15000);
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

.card-subtitle {
  font-size: 13px;
  color: #595959;
  font-weight: 400;
  margin-top: 2px;
}

/* ── Tab bar ── */
.tab-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  color: #595959;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
  white-space: nowrap;
}

.tab-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
  background: #f0f7ff;
}

.tab-btn--active {
  background: #1890ff;
  border-color: #1890ff;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.35);
}

.tab-btn--active:hover {
  background: #096dd9;
  border-color: #096dd9;
  color: #ffffff;
}

/* ── Section label ── */
.section-label {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 10px;
}

/* ── KPI grids ── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}
.kpi-grid--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.kpi-grid--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.kpi-grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.kpi-grid--1 {
  grid-template-columns: minmax(0, 320px);
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 10px 12px;
}
.kpi-card--warn {
  background: #fffbe6;
  border-color: #ffe58f;
}
.kpi-card--highlight {
  background: #f0f7ff;
  border-color: #bae0ff;
}
.kpi-card--wide {
  grid-column: span 1;
}

.kpi-icon {
  font-size: 22px;
  flex-shrink: 0;
  line-height: 1;
}
.kpi-body {
  min-width: 0;
}
.kpi-label {
  font-size: 11px;
  color: #8c8c8c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}
.kpi-value {
  font-size: 20px;
  font-weight: 700;
  color: #1f1f1f;
  line-height: 1.2;
  white-space: nowrap;
}
.kpi-value--blue   { color: #1890ff; }
.kpi-value--green  { color: #52c41a; }
.kpi-value--red    { color: #ff4d4f; }
.kpi-value--orange { color: #fa8c16; }
.kpi-value--purple { color: #722ed1; }

/* Business row (revenue wider) */
.business-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 10px;
}

/* 7-day trend layout */
.trend-layout {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 12px;
  align-items: start;
}
.trend-left {
  display: flex;
  flex-direction: column;
}
.trend-right {
  display: flex;
  flex-direction: column;
}

/* Chart cards */
.stat-card {
  border-radius: 8px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
}
.dashboard-chart-card {
  padding: 14px;
}
.chart-title {
  font-size: 13px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 12px;
}
.dashboard-chart {
  height: 220px;
  width: 100%;
}
.dashboard-chart--orders {
  height: 180px;
}

/* Leaderboard */
.leaderboard-card {
  height: 100%;
}
.leaderboard {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.lb-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.lb-rank {
  min-width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #f0f0f0;
  color: #595959;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.lb-rank--gold   { background: #fff1b8; color: #d48806; }
.lb-rank--silver { background: #f0f0f0; color: #595959; }
.lb-rank--bronze { background: #ffd8bf; color: #d4380d; }

.lb-info {
  flex: 1;
  min-width: 0;
}
.lb-name {
  font-size: 12px;
  font-weight: 500;
  color: #1f1f1f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}
.lb-bar-wrap {
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}
.lb-bar {
  height: 100%;
  background: linear-gradient(90deg, #ff7a45, #ffa940);
  border-radius: 2px;
  transition: width 0.4s;
}

.lb-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  gap: 1px;
}
.lb-qty {
  font-size: 12px;
  font-weight: 700;
  color: #ff7a45;
  white-space: nowrap;
}
.lb-rev {
  font-size: 10px;
  color: #8c8c8c;
  white-space: nowrap;
}

/* ── Staff ranking table ── */
.staff-table-wrap {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}
.staff-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: fixed;
}
.staff-table thead tr {
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}
.staff-table th {
  padding: 10px 14px;
  font-weight: 600;
  color: #595959;
  white-space: nowrap;
}
.staff-table td {
  padding: 10px 14px;
  color: #1f1f1f;
  border-bottom: 1px solid #f5f5f5;
  white-space: nowrap;
}
.staff-table tbody tr:last-child td {
  border-bottom: none;
}
.tr-even { background: #ffffff; }
.tr-odd  { background: #fafafa; }
.col-rank    { width: 10%;  text-align: center; }
.col-name    { width: 45%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.col-orders  { width: 22%; text-align: right; color: #595959; }
.col-revenue { width: 23%; text-align: right; font-weight: 600; color: #1890ff; }
.medal     { font-size: 18px; line-height: 1; }
.rank-num  {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #f0f0f0;
  color: #595959;
  font-size: 12px;
  font-weight: 700;
}

/* ── Responsive ── */
@media (max-width: 1100px) {
  .kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 900px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .kpi-grid--4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .kpi-grid--3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .business-row {
    grid-template-columns: 1fr 1fr;
  }
  .trend-layout {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 600px) {
  .kpi-grid,
  .kpi-grid--2,
  .kpi-grid--3,
  .kpi-grid--4 {
    grid-template-columns: 1fr 1fr;
  }
  .business-row {
    grid-template-columns: 1fr 1fr;
  }
  .tab-btn {
    flex: 1;
    justify-content: center;
    padding: 8px 12px;
  }
}
</style>
