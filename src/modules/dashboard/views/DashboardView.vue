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
        <!-- PHẦN 1: TỔNG QUAN -->
        <div class="section-label">📋 Tổng quan</div>
        <a-row :gutter="[16, 16]">
          <a-col :xs="24" :sm="12" :md="6">
            <a-card class="stat-card" :bordered="false">
              <a-statistic
                title="Khách hàng"
                :value="data.tongKhachHang"
                prefix="👤"
              />
            </a-card>
          </a-col>
          <a-col :xs="24" :sm="12" :md="6">
            <a-card class="stat-card" :bordered="false">
              <a-statistic
                title="Nhân viên"
                :value="data.tongNhanVien"
                prefix="🧑‍💼"
              />
            </a-card>
          </a-col>
          <a-col :xs="24" :sm="12" :md="6">
            <a-card class="stat-card" :bordered="false">
              <a-statistic
                title="Voucher đang hoạt động"
                :value="data.voucherDangHoatDong"
                prefix="🎟️"
              />
            </a-card>
          </a-col>
          <a-col :xs="24" :sm="12" :md="6">
            <a-card class="stat-card" :bordered="false">
              <a-statistic
                title="Topping đang bán"
                :value="data.toppingDangBan"
                prefix="🧁"
              />
            </a-card>
          </a-col>
          <a-col :xs="24" :sm="12" :md="6">
            <a-card class="stat-card" :bordered="false">
              <a-statistic
                title="Nguyên liệu đang hoạt động"
                :value="data.nguyenLieuDangHoatDong"
                prefix="🌿"
              />
            </a-card>
          </a-col>
        </a-row>

        <!-- PHẦN 2: CẢNH BÁO KHO -->
        <div class="section-label" style="margin-top: 24px">⚠️ Cảnh báo kho</div>
        <a-row :gutter="[16, 16]">
          <a-col :xs="24" :sm="12" :md="8">
            <a-card
              class="stat-card warn-card"
              :bordered="false"
            >
              <a-statistic
                title="Lô topping sắp hết hạn"
                :value="data.loToppingSapHetHan"
                prefix="⏰"
                :value-style="data.loToppingSapHetHan > 0 ? { color: '#fa8c16' } : {}"
              />
            </a-card>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8">
            <a-card
              class="stat-card warn-card"
              :bordered="false"
            >
              <a-statistic
                title="Lô nguyên liệu sắp hết hạn"
                :value="data.loNguyenLieuSapHetHan"
                prefix="⏰"
                :value-style="data.loNguyenLieuSapHetHan > 0 ? { color: '#fa8c16' } : {}"
              />
            </a-card>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8">
            <a-card
              class="stat-card warn-card"
              :bordered="false"
            >
              <a-statistic
                title="Nguyên liệu dưới ngưỡng"
                :value="data.nguyenLieuDuoiNguong"
                prefix="📉"
                :value-style="data.nguyenLieuDuoiNguong > 0 ? { color: '#f5222d' } : {}"
              />
            </a-card>
          </a-col>
        </a-row>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { message } from "ant-design-vue";
import axios from "axios";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { getDashboard } from "../api/dashboardApi";
import type { DashboardData } from "../api/dashboardApi";

const auth = useAuthStore();
const loading = ref(false);

const data = reactive<DashboardData>({
  tongKhachHang: 0,
  tongNhanVien: 0,
  voucherDangHoatDong: 0,
  toppingDangBan: 0,
  nguyenLieuDangHoatDong: 0,
  loToppingSapHetHan: 0,
  loNguyenLieuSapHetHan: 0,
  nguyenLieuDuoiNguong: 0,
});

const loadDashboard = async () => {
  loading.value = true;
  try {
    const response = await getDashboard();
    const result = response.data.data;
    if (result) {
      Object.assign(data, result);
    }
  } catch (error: unknown) {
    console.error("Lỗi tải dashboard:", error);
    if (axios.isAxiosError(error)) {
      message.error(
        error.response?.data?.message || "Không thể tải dữ liệu tổng quan"
      );
    } else {
      message.error("Không thể tải dữ liệu tổng quan");
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadDashboard();
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

.section-label {
  font-size: 15px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 12px;
}

.stat-card {
  border-radius: 8px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
}

.warn-card {
  background: #fffbe6;
  border: 1px solid #ffe58f;
}
</style>
