<template>
  <a-drawer
    :open="open"
    title="Chi tiết hóa đơn"
    width="760"
    @close="onClose"
    :destroyOnClose="true"
    class="hoa-don-detail-drawer"
  >
    <a-spin :spinning="loading" wrapperClassName="drawer-spin-wrapper">
      <div v-if="hoaDon" class="drawer-content">
        <!-- HEADER INFO -->
        <div class="header-section">
          <div class="header-row">
            <h2>{{ hoaDon.maHoaDon }}</h2>
            <a-tag :color="getTrangThaiColor(hoaDon.trangThai)" class="status-tag">
              {{ formatTrangThai(hoaDon.trangThai) }}
            </a-tag>
          </div>
          <p class="text-secondary">{{ formatDateTime(hoaDon.ngayTao) }}</p>
        </div>

        <a-divider />

        <!-- THÔNG TIN CHUNG -->
        <a-descriptions title="Thông tin chung" :column="2" bordered size="small" class="compact-desc">
          <a-descriptions-item label="Khách hàng">
            {{ hoaDon.tenKhachHang || 'Khách lẻ' }}
          </a-descriptions-item>
          <a-descriptions-item label="Nhân viên">
            {{ hoaDon.tenNhanVien || 'N/A' }}
          </a-descriptions-item>
          <a-descriptions-item label="Loại đơn">
            <a-tag color="blue" v-if="hoaDon.loaiHoaDon === 'ONLINE'">Online</a-tag>
            <a-tag color="purple" v-else>Tại quầy</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="Thanh toán">
            {{ formatPaymentMethod(hoaDon.hinhThucThanhToan) }}
          </a-descriptions-item>
        </a-descriptions>

        <!-- THÔNG TIN GIAO HÀNG (nếu có) -->
        <div v-if="vanDon" class="mt-4">
          <div class="section-title">
            <span>Thông tin giao hàng</span>
            <div class="shipping-actions">
              <a-button
                v-if="vanDon.maVanDonGhn && nextGhnStep"
                type="default"
                size="small"
                :loading="loadingGiaLap"
                @click="onGiaLapGhn"
              >
                Cập nhật: {{ nextGhnStep.label }}
              </a-button>
              <a-button
                v-if="vanDon.maVanDonGhn"
                type="primary"
                size="small"
                :loading="loadingGhn"
                @click="onRefreshGhn"
              >
                Làm mới trạng thái GHN
              </a-button>
            </div>
          </div>
          <a-descriptions :column="1" bordered size="small" class="delivery-desc compact-desc">
            <a-descriptions-item label="Người nhận">
              {{ vanDon.tenNguoiNhan }} - {{ vanDon.sdtNguoiNhan }}
            </a-descriptions-item>
            <a-descriptions-item label="Địa chỉ">
              {{ vanDon.diaChiGiaoHang }}
            </a-descriptions-item>
            <a-descriptions-item label="Trạng thái vận đơn nội bộ">
              <a-tag color="purple" v-if="vanDon.trangThai">{{ vanDon.trangThai }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="Mã GHN" v-if="vanDon.maVanDonGhn">
              <span style="color: #1677ff; font-weight: 500;">{{ vanDon.maVanDonGhn }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="Trạng thái GHN" v-if="vanDon.maVanDonGhn">
              <a-tag color="cyan">{{ translateGhnStatus(vanDon.trangThaiGhn) }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="Giao dự kiến" v-if="vanDon.thoiGianGiaoDuKien">
              {{ formatDateTime(vanDon.thoiGianGiaoDuKien) }}
            </a-descriptions-item>
          </a-descriptions>
        </div>
        <div v-else class="mt-4">
          <a-alert message="Đơn nhận tại quầy" type="info" show-icon />
        </div>

        <a-divider />

        <!-- DANH SÁCH MÓN -->
        <h3 class="section-heading">Danh sách món</h3>
        <div class="invoice-items-section">
          <a-empty
            v-if="!hoaDon.chiTiet || hoaDon.chiTiet.length === 0"
            description="Hóa đơn chưa có món"
          />
          <div v-else class="product-list">
            <div v-for="(item, index) in hoaDon.chiTiet" :key="index" class="product-item">
              <div class="product-info">
                <div class="product-name">
                  <span class="qty">{{ item.soLuong }}x</span>
                  <span class="name">{{ item.tenSanPham }}</span>
                </div>
                <div class="product-meta text-secondary">
                  Size: {{ item.tenSize }} | Đường: {{ formatPhanTram(item.mucDuong) }} | Đá: {{ formatPhanTram(item.mucDa) }}
                </div>
                <div class="product-topping" v-if="item.toppingList && item.toppingList.length > 0">
                  <div v-for="(tp, tIdx) in item.toppingList" :key="tIdx" class="topping-item">
                    + {{ tp.soLuong }}x {{ tp.tenTopping || 'Topping' }} ({{ formatCurrency(tp.donGia) }})
                  </div>
                </div>
              </div>
              <div class="product-price">
                {{ formatCurrency(item.thanhTien) }}
              </div>
            </div>
          </div>
        </div>

        <a-divider class="compact-divider" />

        <!-- TỔNG TIỀN -->
        <div class="summary-section">
          <div class="summary-row">
            <span>Tạm tính:</span>
            <span>{{ formatCurrency(hoaDon.tongTien) }}</span>
          </div>
          <div class="summary-row" v-if="(hoaDon.giamGia ?? 0) > 0">
            <span>Giảm giá (Voucher <span v-if="hoaDon.maVoucher" class="voucher-code">{{ hoaDon.maVoucher }}</span>):</span>
            <span class="text-danger">- {{ formatCurrency(hoaDon.giamGia) }}</span>
          </div>
          <div class="summary-row" v-if="(hoaDon.phiVanChuyen ?? 0) > 0">
            <span>Phí vận chuyển:</span>
            <span>{{ formatCurrency(hoaDon.phiVanChuyen) }}</span>
          </div>
          <div class="summary-row total">
            <span>Thành tiền:</span>
            <span class="total-amount">{{ formatCurrency(hoaDon.thanhTien) }}</span>
          </div>
        </div>
      </div>
    </a-spin>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { message } from "ant-design-vue";
import { getChiTietHoaDon, getGiaoHangHoaDon, lamMoiTrangThaiGhn, giaLapTrangThaiGhn } from "../api/hoaDonApi";
import type { HoaDonDetail, VanDonGhnResponse } from "../types/hoaDon";
import dayjs from "dayjs";

const props = defineProps<{
  open: boolean;
  idHoaDon: number | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "refreshed"): void;
}>();

const loading = ref(false);
const loadingGhn = ref(false);
const loadingGiaLap = ref(false);
const hoaDon = ref<HoaDonDetail | null>(null);
const vanDon = ref<VanDonGhnResponse | null>(null);

const nextGhnStep = computed(() => {
  if (!vanDon.value?.trangThaiGhn) return null;
  const current = vanDon.value.trangThaiGhn;
  
  const map: Record<string, { key: string; label: string }> = {
    ready_to_pick: { key: 'picking', label: 'Đang lấy hàng' },
    picking: { key: 'picked', label: 'Đã lấy hàng' },
    picked: { key: 'transporting', label: 'Đang vận chuyển' },
    transporting: { key: 'delivering', label: 'Đang giao hàng' },
    delivering: { key: 'delivered', label: 'Đã giao hàng' }
  };
  
  return map[current] || null;
});

const onGiaLapGhn = async () => {
  if (!props.idHoaDon || !nextGhnStep.value) return;
  
  loadingGiaLap.value = true;
  try {
    const res = await giaLapTrangThaiGhn(props.idHoaDon, nextGhnStep.value.key);
    if (res.data.code === 200) {
      vanDon.value = res.data.data;
      message.success('Cập nhật trạng thái giao hàng thành công');
      emit('refreshed');
    } else {
      message.error(res.data.message || 'Lỗi khi giả lập trạng thái');
    }
  } catch (error: any) {
    message.error(error.response?.data?.message || 'Lỗi khi gọi API giả lập');
  } finally {
    loadingGiaLap.value = false;
  }
};

const fetchDetail = async (id: number) => {
  loading.value = true;
  try {
    const resHd = await getChiTietHoaDon(id);
    hoaDon.value = resHd.data?.data ?? resHd.data;

    try {
      const resVd = await getGiaoHangHoaDon(id);
      vanDon.value = resVd.data?.data ?? resVd.data;
    } catch (err: any) {
  const errorMessage = err.response?.data?.message || "";

  if (
    err.response?.status === 400 &&
    (
      errorMessage.includes("không có thông tin giao hàng") ||
      errorMessage.includes("chưa thiết lập giao hàng")
    )
  ) {
    vanDon.value = null;
  } else {
    message.error(
      errorMessage || "Lỗi khi tải thông tin giao hàng"
    );
    console.error(err);
  }
}
  } catch (err) {
    message.error("Lỗi khi tải chi tiết hóa đơn");
    console.error(err);
  } finally {
    loading.value = false;
  }
};

watch(
  () => [props.open, props.idHoaDon] as const,
  ([isOpen, idHoaDon]) => {
    if (isOpen && idHoaDon != null) {
      fetchDetail(idHoaDon);
    } else {
      hoaDon.value = null;
      vanDon.value = null;
    }
  },
  { immediate: true }
);

const onRefreshGhn = async () => {
  if (!props.idHoaDon) return;
  loadingGhn.value = true;
  try {
    await lamMoiTrangThaiGhn(props.idHoaDon);
    message.success("Làm mới trạng thái thành công");

    // Fetch lại giao hàng để cập nhật trạng thái mới nhất
    const resVd = await getGiaoHangHoaDon(props.idHoaDon);
    vanDon.value = resVd.data?.data ?? resVd.data;

    emit("refreshed");
  } catch (err: any) {
    message.error(err.response?.data?.message || "Lỗi làm mới trạng thái GHN");
  } finally {
    loadingGhn.value = false;
  }
};

const onClose = () => {
  emit("close");
};

// --- Formatters ---
const formatCurrency = (val?: number) =>
  (val ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const formatDateTime = (val?: string | null) =>
  val ? dayjs(val).format("DD/MM/YYYY HH:mm") : "";

const formatPhanTram = (val?: number | null) =>
  val == null ? "N/A" : `${val}%`;

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
    picked: "Đã lấy hàng",
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
.drawer-content {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.header-section {
  flex-shrink: 0;
  margin-bottom: 8px;
}
.header-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-row h2 {
  margin: 0;
  font-size: 20px;
}
.status-tag {
  font-size: 13px;
  padding: 0 6px;
}
.text-secondary {
  color: #8c8c8c;
  font-size: 13px;
  margin-top: 4px;
  margin-bottom: 0;
}
.mt-4 {
  margin-top: 12px;
  flex-shrink: 0;
}
.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 15px;
}
.shipping-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.section-heading {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 8px 0;
  flex-shrink: 0;
}

.invoice-items-section {
  flex: none;
  max-height: 320px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 6px;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.product-item {
  display: flex;
  justify-content: space-between;
  background: #fafafa;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}
.product-name {
  font-weight: 600;
  font-size: 14px;
}
.qty {
  color: #1677ff;
  margin-right: 6px;
}
.product-meta {
  margin-top: 2px;
  font-size: 12px;
}
.product-topping {
  margin-top: 4px;
  padding-left: 8px;
  border-left: 2px solid #d9d9d9;
}
.topping-item {
  font-size: 12px;
  color: #595959;
}
.product-price {
  font-weight: 600;
  font-size: 14px;
}
.summary-section {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #fff;
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}
.summary-row.total {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed #d9d9d9;
  font-weight: bold;
  font-size: 15px;
}
.total-amount {
  color: #ff4d4f;
  font-size: 16px;
}
.text-danger {
  color: #ff4d4f;
}
.voucher-code {
  background: #ffe58f;
  padding: 0 4px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 11px;
}

/* Component Overrides */
:deep(.ant-divider-horizontal) {
  margin: 12px 0;
  flex-shrink: 0;
}

.compact-desc {
  flex-shrink: 0;
}
:deep(.compact-desc .ant-descriptions-title) {
  margin-bottom: 8px;
  font-size: 15px;
}
:deep(.compact-desc .ant-descriptions-item-label),
:deep(.compact-desc .ant-descriptions-item-content) {
  padding: 6px 12px !important;
}

/* Global Drawer Overrides */
:deep(.ant-drawer-body) {
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}
:deep(.drawer-spin-wrapper) {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
:deep(.ant-spin-container) {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

@media (max-width: 768px) {
  :deep(.ant-drawer-body) {
    overflow-y: auto;
  }
  .drawer-content {
    overflow: visible;
  }
  .invoice-items-section {
    overflow: visible;
  }
}
</style>
