<template>
  <a-drawer
    :open="open"
    title="Chi tiết hóa đơn"
    width="650"
    @close="onClose"
    :destroyOnClose="true"
  >
    <a-spin :spinning="loading">
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
        <a-descriptions title="Thông tin chung" :column="2" bordered size="small">
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
          <a-descriptions :column="1" bordered size="small" class="delivery-desc">
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
        <h3>Danh sách món</h3>
        <div class="product-list">
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

        <a-divider />

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
import { ref, watch } from "vue";
import { message } from "ant-design-vue";
import { getChiTietHoaDon, getGiaoHangHoaDon, lamMoiTrangThaiGhn } from "../api/hoaDonApi";
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
const hoaDon = ref<HoaDonDetail | null>(null);
const vanDon = ref<VanDonGhnResponse | null>(null);

const fetchDetail = async (id: number) => {
  loading.value = true;
  try {
    const resHd = await getChiTietHoaDon(id);
    hoaDon.value = resHd.data?.data ?? resHd.data;

    try {
      const resVd = await getGiaoHangHoaDon(id);
      vanDon.value = resVd.data?.data ?? resVd.data;
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes("chưa thiết lập giao hàng")) {
        // Lỗi 400 do không có thông tin giao hàng (đơn nhận tại quầy)
        vanDon.value = null;
      } else {
        message.error(err.response?.data?.message || "Lỗi khi tải thông tin giao hàng");
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
.header-section {
  margin-bottom: 16px;
}
.header-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-row h2 {
  margin: 0;
}
.status-tag {
  font-size: 14px;
  padding: 2px 8px;
}
.text-secondary {
  color: #8c8c8c;
  font-size: 13px;
  margin-top: 4px;
}
.mt-4 {
  margin-top: 16px;
}
.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 16px;
}
.product-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.product-item {
  display: flex;
  justify-content: space-between;
  background: #fafafa;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}
.product-name {
  font-weight: 600;
  font-size: 15px;
}
.qty {
  color: #1677ff;
  margin-right: 6px;
}
.product-meta {
  margin-top: 4px;
  font-size: 13px;
}
.product-topping {
  margin-top: 6px;
  padding-left: 8px;
  border-left: 2px solid #d9d9d9;
}
.topping-item {
  font-size: 13px;
  color: #595959;
}
.product-price {
  font-weight: 600;
}
.summary-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #f9f9f9;
  padding: 16px;
  border-radius: 6px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}
.summary-row.total {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #d9d9d9;
  font-weight: bold;
  font-size: 16px;
}
.total-amount {
  color: #ff4d4f;
  font-size: 18px;
}
.text-danger {
  color: #ff4d4f;
}
.voucher-code {
  background: #ffe58f;
  padding: 0 4px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
}
</style>
