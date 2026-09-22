<template>
  <div class="order-detail-page container mx-auto">
    <div class="breadcrumb" @click="router.push('/shop/orders')">
      &larr; Quay lại danh sách đơn
    </div>

    <div v-if="loading" class="loading-state">
      <a-spin size="large" />
      <p class="mt-4">Đang tải thông tin đơn hàng...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p class="text-danger">{{ error }}</p>
      <button class="retry-btn" @click="fetchDetail">Thử lại</button>
    </div>

    <div v-else-if="order" class="detail-layout">
      <!-- Cột trái: Chi tiết món & thanh toán -->
      <div class="detail-main">
        <div class="card status-card">
          <div class="header-row">
            <div>
              <h2 class="order-code">Đơn hàng #{{ order.maHoaDon }}</h2>
              <div class="order-date">{{ formatDate(order.ngayTao) }}</div>
            </div>
            <div class="badges">
              <span class="badge primary-badge">{{ getStatusLabel(order) }}</span>
              <span v-if="order.hinhThucThanhToan === 'CHUYEN_KHOAN' && order.payosStatus" class="badge secondary-badge">
                PayOS: {{ getPayosStatusText(order.payosStatus) }}
              </span>
              <span v-if="order.hinhThucThanhToan === 'TIEN_MAT'" class="badge cod-badge">
                Thanh toán khi nhận hàng
              </span>
            </div>
          </div>

          <div v-if="order.hinhThucThanhToan === 'CHUYEN_KHOAN' && order.trangThai === 'CHO_THANH_TOAN' && order.payosStatus === 'PENDING' && order.payosExpiresAt"
            class="countdown-section">
            <template v-if="revalidating">
              <span class="revalidating-text">Đang cập nhật trạng thái đơn hàng...</span>
            </template>
            <template v-else>
              <div class="timer-text">
                ⏱ Đơn hàng sẽ tự hủy sau <strong>{{ countdownText }}</strong>
              </div>
              <div class="timer-subtext">Sản phẩm đang được tạm giữ trong thời gian thanh toán.</div>
            </template>
          </div>

          <div v-if="cancelReason" class="cancel-reason-box">
            <span class="cancel-reason-icon">ℹ️</span>
            <span>{{ cancelReason }}</span>
          </div>

          <div v-if="canCancel || canResumePayment" class="actions-row">
            <button v-if="canResumePayment" class="brand-btn resume-btn" @click="handleResumePayment"
              :disabled="isResumingPayment || canceling">
              {{ isResumingPayment ? 'Đang mở thanh toán...' : getResumeButtonLabel }}
            </button>
            <button v-if="canCancel" class="cancel-btn" @click="cancelOrder" :disabled="canceling || isResumingPayment">
              {{ canceling ? 'Đang xử lý...' : 'Hủy đơn hàng' }}
            </button>
          </div>
        </div>

        <div class="card section-card">
          <div class="section-title">Danh sách món</div>
          <div class="item-list">
            <div v-for="(item, idx) in order.chiTiet" :key="idx" class="order-item">
              <div class="item-qty">{{ item.soLuong }}x</div>
              <div class="item-info">
                <div class="item-name">{{ item.tenSanPham }}</div>
                <div class="item-meta">Size {{ item.tenSize }} · Đường {{ item.mucDuong }}% · Đá {{ item.mucDa }}%</div>
                <div v-if="item.ghiChu" class="item-note">Ghi chú: {{ item.ghiChu }}</div>
                <div class="item-toppings" v-if="item.toppingList && item.toppingList.length">
                  <div class="t-label">Topping tổng cho {{ item.soLuong }} ly:</div>
                  <div class="t-list">
                    <span v-for="(t, tidx) in item.toppingList" :key="tidx">
                      {{ t.tenTopping }} ({{ t.soLuong }} phần)<span v-if="tidx < item.toppingList.length - 1">, </span>
                    </span>
                  </div>
                </div>
              </div>
              <div class="item-price">{{ formatCurrency(item.thanhTien) }}</div>
            </div>
          </div>
        </div>

        <div class="card section-card">
          <div class="section-title">Tóm tắt thanh toán</div>
          <div class="summary-content">
            <div class="s-row">
              <span>Tạm tính sau CTKM</span>
              <span>{{ formatCurrency(order.tongTien) }}</span>
            </div>
            <div class="s-row" v-if="order.giamGiaKhuyenMai > 0">
              <span>Khuyến mãi sản phẩm</span>
              <span>-{{ formatCurrency(order.giamGiaKhuyenMai) }}</span>
            </div>
            <div class="s-row discount" v-if="order.giamGia > 0">
              <span>Voucher {{ order.tenVoucher ? `(${order.tenVoucher})` : '' }}</span>
              <span>-{{ formatCurrency(order.giamGia) }}</span>
            </div>
            <div class="s-row">
              <span>Phí vận chuyển</span>
              <span>{{ formatCurrency(order.phiVanChuyen) }}</span>
            </div>
            <div class="s-divider"></div>
            <div class="s-row s-total">
              <span>Tổng thanh toán</span>
              <span>{{ formatCurrency(order.thanhTien) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cột phải: Vận chuyển & Địa chỉ -->
      <div class="detail-sidebar">
        <div class="card section-card">
          <div class="section-title">Thông tin giao hàng</div>
          <div class="info-content" v-if="order.tenNguoiNhan">
            <div class="info-group">
              <span class="info-label">Người nhận</span>
              <p class="name">{{ order.tenNguoiNhan }}</p>
            </div>
            <div class="info-group">
              <span class="info-label">Số điện thoại</span>
              <p class="phone">{{ order.sdtNguoiNhan }}</p>
            </div>
            <div class="info-group">
              <span class="info-label">Địa chỉ</span>
              <p class="address">{{ order.diaChiGiaoHang }}</p>
            </div>
          </div>
          <div class="info-content" v-else>
            <p>Không có thông tin địa chỉ</p>
          </div>
        </div>

        <div class="card section-card">
          <div class="section-title">Trạng thái vận chuyển (GHN)</div>
          <div class="info-content">
            <template v-if="order.maVanDonGhn || order.trangThaiVanDon === 'DA_TAO_DON' || order.trangThaiVanDon === 'DANG_GIAO' || order.trangThaiVanDon === 'GIAO_THANH_CONG'">
              <div class="tracking-row" v-if="order.maVanDonGhn">
                <span class="label">Mã vận đơn:</span>
                <strong>{{ order.maVanDonGhn }}</strong>
              </div>
              <div class="tracking-row">
                <span class="label">Trạng thái:</span>
                <span v-if="order.trangThaiVanDon === 'GIAO_THANH_CONG' || order.trangThaiGhn === 'delivered'">Giao hàng thành công</span>
                <span v-else-if="order.trangThaiGhn">{{ mapShippingStatus(order.trangThaiGhn) }}</span>
                <span v-else>Đã tạo vận đơn</span>
              </div>
              <div class="tracking-row" v-if="order.thoiGianGiaoDuKien">
                <span class="label">Dự kiến giao:</span>
                <span>{{ formatDate(order.thoiGianGiaoDuKien) }}</span>
              </div>
            </template>
            <template v-else>
              <div class="tracking-row empty-tracking"
                v-if="order.trangThai === 'DA_HUY' || order.trangThaiVanDon === 'DA_HUY'">
                <span class="label">Trạng thái:</span>
                <span class="primary-text">Đã hủy</span>
                <span class="sub-text">Đơn hàng đã bị hủy, vận đơn sẽ không được tạo.</span>
              </div>
              <div class="tracking-row empty-tracking" v-else-if="order.trangThaiVanDon === 'DA_TIEP_NHAN'">
                <span class="label">Trạng thái:</span>
                <span class="primary-text">Cửa hàng đã tiếp nhận đơn</span>
                <span class="sub-text">Đơn hàng đang được chuẩn bị để bàn giao cho đơn vị vận chuyển.</span>
              </div>
              <div class="tracking-row empty-tracking" v-else-if="order.trangThaiVanDon === 'CHO_TAO_DON' && (order.hinhThucThanhToan === 'TIEN_MAT' || order.trangThai === 'DA_THANH_TOAN')">
                <span class="label">Trạng thái:</span>
                <span class="primary-text">Đang chờ tiếp nhận</span>
                <span class="sub-text">Vận đơn sẽ được tạo sau khi cửa hàng tiếp nhận đơn.</span>
              </div>
              <div class="tracking-row empty-tracking" v-else-if="order.trangThai !== 'DA_THANH_TOAN'">
                <span class="label">Trạng thái:</span>
                <span class="primary-text">Chờ thanh toán</span>
                <span class="sub-text">Vận đơn sẽ được tạo sau khi thanh toán thành công.</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>

  <CheckoutFlowModal v-model:open="showCheckoutModal" :resume-hoa-don-id="idHoaDon"
    :resume-payment-data="resumePaymentData" />
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { onDataChanged } from '@/utils/appSync';
import { getOnlineOrderDetail, cancelOnlineOrder, createOnlinePayment, getOnlinePaymentStatus } from '@/modules/ban-hang-online/api/banHangOnlineApi';
import type { ChiTietDonHangOnlineResponse } from '@/modules/ban-hang-online/types/banHangOnline';
import CheckoutFlowModal from '../components/CheckoutFlowModal.vue';

const route = useRoute();
const router = useRouter();
const idHoaDon = Number(route.params.idHoaDon);

const order = ref<ChiTietDonHangOnlineResponse | null>(null);
const loading = ref(true);
const error = ref('');
const canceling = ref(false);

const isResumingPayment = ref(false);
const showCheckoutModal = ref(false);
const resumePaymentData = ref<any>(null);
const cancelReason = ref('');

let cleanupAppSync: (() => void) | null = null;
let countdownInterval: any = null;
let revalidateInterval: any = null;
let orderStatusPollInterval: any = null;

const countdownTime = ref(0);
const countdownText = ref('');
const revalidating = ref(false);
const reconcilingPayment = ref(false);

const reconcilePayment = async () => {
  if (reconcilingPayment.value) return;
  if (!order.value || order.value.trangThai !== 'CHO_THANH_TOAN' || !order.value.payosOrderCode) return;

  reconcilingPayment.value = true;
  try {
    const res = await getOnlinePaymentStatus(idHoaDon);
    if (res.data.code === 200) {
      const data = res.data.data;
      const isPaid =
        data.daThanhToan ||
        data.trangThaiDonHang === 'DA_THANH_TOAN' ||
        data.payosStatus === 'PAID';
      const isCancelled =
        data.trangThaiDonHang === 'DA_HUY' ||
        data.payosStatus === 'CANCELLED' ||
        data.payosStatus === 'EXPIRED';

      if (isPaid) {
        stopCountdown();
        stopRevalidate();
        showCheckoutModal.value = false;
        resumePaymentData.value = null;
        cancelReason.value = '';
        await doFetchDetail(true);
      } else if (isCancelled) {
        // Tải lại chi tiết đơn ngay, không cần F5
        const POS_FALLBACK =
          'Phiên QR đã được hủy vì nguyên liệu còn lại được ưu tiên cho khách đang thanh toán tại quầy.' +
          ' Đơn vẫn nằm trong danh sách chờ; bạn có thể thử thanh toán lại khi còn hàng.';
        if (data.maLyDoCho === 'POS_UU_TIEN') {
          cancelReason.value = data.lyDoCho || POS_FALLBACK;
        } else if (data.lyDoCho) {
          cancelReason.value = data.lyDoCho;
        }
        await doFetchDetail(true);
      }
    }
  } catch (e) {
    // silent background reconcile
  } finally {
    reconcilingPayment.value = false;
  }
};

const startCountdown = () => {
  stopCountdown();
  if (order.value?.trangThai === 'CHO_THANH_TOAN' && order.value?.payosStatus === 'PENDING' && order.value?.payosExpiresAt) {
    const expireTime = new Date(order.value.payosExpiresAt).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = expireTime - now;
      if (diff <= 0) {
        countdownTime.value = 0;
        countdownText.value = '00:00';
        stopCountdown();
        handleExpired();
      } else {
        countdownTime.value = diff;
        const totalSeconds = Math.floor(diff / 1000);
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        countdownText.value = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }
    };

    tick();
    if (countdownTime.value > 0) {
      countdownInterval = setInterval(tick, 1000);
    }
  } else if (order.value?.trangThai === 'DA_THANH_TOAN' || order.value?.payosStatus === 'PAID') {
    countdownText.value = '';
    countdownTime.value = 0;
  }
};

const stopCountdown = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
};

const handleExpired = () => {
  if (revalidateInterval) return;
  revalidating.value = true;
  revalidateInterval = setInterval(() => {
    doFetchDetail(true);
  }, 3000);
};

const stopRevalidate = () => {
  if (revalidateInterval) {
    clearInterval(revalidateInterval);
    revalidateInterval = null;
    revalidating.value = false;
  }
};

onMounted(() => {
  if (!idHoaDon) {
    router.push('/shop');
    return;
  }
  fetchDetail();

  cleanupAppSync = onDataChanged((type) => {
    const relevantEvents = [
      "ONLINE_ORDER_UPDATED",
      "HOA_DON_UPDATED",
      "GHN_UPDATED",
      "APP_REVALIDATE"
    ];
    if (relevantEvents.includes(type)) {
      doFetchDetail(true);
    }
  });

  // Fallback polling 5s cho general order status.
  // Nếu revalidateInterval (QR expiry) đang chạy thì skip để tránh gọi API trùng.
  orderStatusPollInterval = setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    if (revalidateInterval) return; // QR expiry đang tự poll, bỏ qua
    doFetchDetail(true);
  }, 5000);
});

onUnmounted(() => {
  if (cleanupAppSync) cleanupAppSync();
  stopCountdown();
  stopRevalidate();
  if (orderStatusPollInterval) {
    clearInterval(orderStatusPollInterval);
    orderStatusPollInterval = null;
  }
});

const doFetchDetail = async (silent: boolean) => {
  if (!silent) {
    loading.value = true;
    error.value = '';
  }
  try {
    const res = await getOnlineOrderDetail(idHoaDon);
    if (res.data.code === 200) {
      order.value = res.data.data;

      if (revalidating.value && (order.value.trangThai !== 'CHO_THANH_TOAN' || order.value.payosStatus !== 'PENDING')) {
        stopRevalidate();
      }

      startCountdown();

      if (order.value.trangThai === 'CHO_THANH_TOAN' && order.value.payosOrderCode != null) {
        reconcilePayment();
      }
    } else {
      if (!silent) error.value = res.data.message || 'Lỗi khi tải chi tiết đơn hàng';
    }
  } catch (err: any) {
    if (!silent) error.value = err.response?.data?.message || 'Lỗi mạng khi tải chi tiết';
  } finally {
    if (!silent) loading.value = false;
  }
};

const fetchDetail = () => doFetchDetail(false);

const canCancel = computed(() => {
  if (!order.value) return false;
  if (order.value.trangThai === 'CHO_THANH_TOAN') {
    // TIEN_MAT (COD): only cancellable before store accepts (CHO_TAO_DON)
    if (order.value.hinhThucThanhToan === 'TIEN_MAT') {
      return order.value.trangThaiVanDon === 'CHO_TAO_DON';
    }
    // CHUYEN_KHOAN: can cancel if PayOS not paid
    return order.value.payosStatus !== 'PAID';
  }
  return false;
});


const canResumePayment = computed(() => {
  if (!order.value) return false;
  // Chỉ áp dụng cho đơn CHUYEN_KHOAN
  if (order.value.hinhThucThanhToan === 'TIEN_MAT') return false;
  // Chỉ khi đơn còn CHO_THANH_TOAN
  if (order.value.trangThai !== 'CHO_THANH_TOAN') return false;
  // Đã thanh toán: không cho tạo QR
  if (order.value.payosStatus === 'PAID') return false;
  // PENDING: cho tiếp tục thanh toán
  // CANCELLED hoặc EXPIRED: cho thanh toán lại (kể cả POS_UU_TIEN)
  // null (chưa tạo QR lần nào): cho tạo QR
  return true;
});

const getResumeButtonLabel = computed(() => {
  if (order.value?.payosStatus === 'PENDING') return 'Tiếp tục thanh toán';
  if (order.value?.payosStatus === 'CANCELLED' || order.value?.payosStatus === 'EXPIRED') return 'Thanh toán lại';
  return 'Thanh toán';
});

const handleResumePayment = async () => {
  isResumingPayment.value = true;
  try {
    const res = await createOnlinePayment(idHoaDon);
    if (res.data.code === 200) {
      // createOnlinePayment trả PayOSCreateResponse
      // BE có thể trả thêm status='PAID' khi đơn đã được thanh toán
      // trong khoảng thời gian từ lúc FE tạo QR đến lúc khách mở modal
      const data = res.data.data;
      if (!data || typeof data !== 'object') {
        message.warning('Phản hồi không hợp lệ. Vui lòng thử lại.');
        return;
      }
      const dataWithStatus = data as typeof data & { status?: string };
      if (dataWithStatus.status === 'PAID') {
        // Đơn đã thanh toán: xóa dữ liệu QR tạm, dừng countdown, thông báo
        showCheckoutModal.value = false;
        resumePaymentData.value = null;
        cancelReason.value = '';
        stopCountdown();
        message.success('Đơn hàng đã được thanh toán');
        await doFetchDetail(true);
        return;
      }

      if (dataWithStatus.status === 'PENDING' && dataWithStatus.checkoutUrl) {
        // Phản hồi PENDING hợp lệ: xóa lý do cũ, mở modal QR
        cancelReason.value = '';
        dataWithStatus.qrCode = dataWithStatus.qrCode || '';
        resumePaymentData.value = dataWithStatus;
        showCheckoutModal.value = true;
      } else {
        // Phản hồi CANCELLED/EXPIRED/trạng thái lạ/thiếu status hoặc không có URL:
        // không mở QR, không xóa lý do cũ
        message.warning('Không thể mở trang thanh toán. Vui lòng thử lại hoặc kiểm tra trạng thái đơn hàng.');
        await doFetchDetail(true);
      }
    } else {
      // Giữ lý do cũ nếu API tạo QR thất bại
      message.error(res.data.message || 'Không thể tạo link thanh toán');
    }
  } catch (err: any) {
    message.error(err.response?.data?.message || 'Lỗi mạng khi gọi thanh toán');
  } finally {
    isResumingPayment.value = false;
  }
};

const cancelOrder = async () => {
  if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;

  canceling.value = true;
  try {
    const res = await cancelOnlineOrder(idHoaDon);
    if (res.data.code === 200) {
      const data = res.data.data as any;
      const isPaid =
        data && (
          data.daThanhToan ||
          data.trangThaiDonHang === 'DA_THANH_TOAN' ||
          data.payosStatus === 'PAID'
        );
      if (isPaid) {
        message.success('Đơn hàng đã được thanh toán');
        stopCountdown();
        doFetchDetail(true);
      } else {
        message.success('Đã hủy đơn hàng');
        fetchDetail(); // Reload to update status
      }
    } else {
      message.error(res.data.message || 'Không thể hủy đơn hàng');
    }
  } catch (err: any) {
    message.error(err.response?.data?.message || 'Lỗi mạng khi hủy đơn hàng');
    reconcilePayment();
  } finally {
    canceling.value = false;
  }
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

const getStatusLabel = (ord: typeof order.value) => {
  if (!ord) return '';
  
  if (ord.trangThai === 'DA_HUY' || ord.trangThaiVanDon === 'DA_HUY') return 'Đã hủy';
  
  if (ord.trangThaiVanDon === 'GIAO_THANH_CONG' || ord.trangThaiGhn === 'delivered') return 'Giao hàng thành công';
  
  if (ord.trangThaiVanDon === 'DANG_GIAO' || (ord.trangThaiGhn && ['picking', 'picked', 'transporting', 'delivering'].includes(ord.trangThaiGhn.toLowerCase()))) return 'Đang giao hàng';
  
  if (ord.trangThaiVanDon === 'DA_TAO_DON' || (ord.maVanDonGhn && (!ord.trangThaiGhn || ord.trangThaiGhn === 'ready_to_pick'))) return 'Đã tạo vận đơn';

  if (ord.trangThaiVanDon === 'DA_TIEP_NHAN') return 'Đã tiếp nhận';
  
  if (ord.trangThaiVanDon === 'CHO_TAO_DON' && (ord.hinhThucThanhToan === 'TIEN_MAT' || ord.trangThai === 'DA_THANH_TOAN')) return 'Chờ tiếp nhận';

  return getStatusText(ord.trangThai);
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

const getPayosStatusText = (status: string | null) => {
  if (!status) return '';
  const map: Record<string, string> = {
    'PAID': 'Đã thanh toán',
    'CANCELLED': 'Đã hủy',
    'PENDING': 'Chờ thanh toán'
  };
  return map[status] || status;
};
const mapShippingStatus = (status: string | null | undefined) => {
  if (!status) return '';

  const map: Record<string, string> = {
    ready_to_pick: 'Sẵn sàng lấy hàng',
    picking: 'Đang lấy hàng',
    picked: 'Đã lấy hàng',
    transporting: 'Đang vận chuyển',
    delivering: 'Đang giao hàng',
    delivered: 'Đã giao hàng',
    cancel: 'Đã hủy',
  };

  return map[status.toLowerCase()] || status;
};

</script>

<style scoped>
.order-detail-page {
  padding: 40px 24px 80px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #1E1E1E;
}

.breadcrumb {
  display: inline-block;
  cursor: pointer;
  color: #6B655F;
  margin-bottom: 24px;
  font-weight: 600;
}

.breadcrumb:hover {
  color: #8B5E3C;
}

.detail-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  align-items: start;
}

.detail-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  background: #FFFDFC;
  border: 1px solid #E8E0D7;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
}

.status-card {
  padding: 24px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.order-code {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
}

.order-date {
  color: #746B63;
  font-size: 14px;
}

.badges {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.badge {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
}

.primary-badge {
  background: #E8E0D7;
  color: #6F452D;
}

.secondary-badge {
  background: #F0ECE6;
  color: #746B63;
}

.cod-badge {
  background: #E6F4EA;
  color: #2D7D46;
}

.cancel-reason-box {
  margin-top: 16px;
  padding: 12px 16px;
  background: #FFF8F0;
  border: 1px solid #F5C97A;
  border-radius: 6px;
  font-size: 14px;
  color: #6B4226;
  line-height: 1.6;
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.cancel-reason-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.actions-row {
  margin-top: 24px;
  border-top: 1px solid #E8E0D7;
  padding-top: 16px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.resume-btn {
  margin-right: 12px;
  background: #8B5E3C;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.resume-btn:hover:not(:disabled) {
  background: #6F452D;
}

.resume-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.countdown-section {
  margin-top: 16px;
  padding: 12px;
  background: #FFF9E6;
  border: 1px solid #FFD591;
  border-radius: 6px;
}

.timer-text {
  font-size: 14px;
  color: #D46B08;
  margin-bottom: 4px;
}

.timer-subtext {
  font-size: 13px;
  color: #8C8C8C;
}

.revalidating-text {
  font-size: 14px;
  color: #D46B08;
  font-weight: 500;
  display: inline-block;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0.6;
  }
}

.cancel-btn {
  background: transparent;
  border: 1px solid #D9363E;
  color: #D9363E;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
}

.cancel-btn:hover:not(:disabled) {
  background: #FFF5F5;
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.section-title {
  background: #F7F3ED;
  padding: 16px 24px;
  border-bottom: 1px solid #E8E0D7;
  font-weight: 700;
  font-size: 15px;
}

.item-list {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-item {
  display: flex;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid #F0ECE6;
}

.order-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.item-qty {
  font-weight: 700;
  color: #8B5E3C;
  min-width: 28px;
  font-size: 16px;
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
}

.item-meta {
  color: #746B63;
  font-size: 13px;
  margin-bottom: 4px;
}

.item-note {
  color: #8B5E3C;
  font-size: 13px;
  font-style: italic;
  margin-bottom: 8px;
}

.item-toppings {
  background: #F9F8F6;
  padding: 8px 12px;
  border-radius: 4px;
  margin-top: 8px;
}

.t-label {
  font-size: 11px;
  font-weight: 700;
  color: #A66A3F;
  margin-bottom: 4px;
}

.t-list {
  font-size: 13px;
  color: #2B2724;
}

.item-price {
  font-weight: 600;
  color: #2B2724;
}

.summary-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.s-row {
  display: flex;
  justify-content: space-between;
  color: #2B2724;
}

.s-row.discount {
  color: #5F7057;
}

.s-divider {
  height: 1px;
  background: #E8E0D7;
  margin: 8px 0;
}

.s-total {
  font-size: 18px;
  font-weight: 700;
  color: #8B5E3C;
}

.info-content {
  padding: 24px;
  color: #2B2724;
  line-height: 1.6;
}

.info-group {
  margin-bottom: 16px;
}

.info-group:last-child {
  margin-bottom: 0;
}

.info-label {
  display: block;
  font-size: 13px;
  color: #746B63;
  margin-bottom: 4px;
}

.info-content .name,
.info-content .phone,
.info-content .address {
  margin: 0;
  font-size: 15px;
}

.info-content .name {
  font-weight: 600;
}

.tracking-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.tracking-row:last-child {
  margin-bottom: 0;
}

.tracking-row .label {
  font-size: 13px;
  color: #746B63;
  margin-bottom: 2px;
}

.empty-tracking .primary-text {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 4px;
}

.empty-tracking .sub-text {
  font-size: 13px;
  color: #746B63;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 60px 0;
}

.text-danger {
  color: #D9363E;
  margin-bottom: 16px;
}

.retry-btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid #1E1E1E;
  background: transparent;
  cursor: pointer;
}

@media (max-width: 900px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
}
</style>
