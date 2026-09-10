<template>
  <div class="payment-page container mx-auto">
    <div class="card payment-card">
      <div class="payment-header">
        <h2>Thanh toán đơn hàng</h2>
        <p>Mã đơn: <strong>#{{ idHoaDon }}</strong></p>
      </div>
      
      <div class="payment-content">
        <div v-if="loading" class="loading-state">
          <a-spin size="large" />
          <p class="mt-4">Đang kết nối cổng thanh toán...</p>
        </div>
        
        <div v-else-if="error" class="error-state">
          <p class="text-danger">{{ error }}</p>
          <button class="retry-btn" @click="initPayment">Thử lại</button>
        </div>
        
        <div v-else-if="status === 'PAID'" class="success-state">
          <div class="success-icon">✓</div>
          <h3>Thanh toán thành công</h3>
          <p>Đang chuyển hướng đến chi tiết đơn hàng...</p>
        </div>
        
        <div v-else-if="status === 'CANCELLED'" class="cancelled-state">
          <div class="cancelled-icon">✕</div>
          <h3>Phiên thanh toán đã kết thúc</h3>
          <p v-if="cancelReason" class="cancel-reason-text">{{ cancelReason }}</p>
          <p v-else>Bạn đã hủy thanh toán cho đơn hàng này.</p>
          <button class="back-btn" @click="router.push('/shop/orders/' + idHoaDon)">
            Xem đơn hàng
          </button>
        </div>

        <div v-else class="pending-state">
          <div class="status-badge">Đang chờ thanh toán</div>
          
          <div class="qr-placeholder" v-if="qrCode">
            <!-- If we had a QR component, we'd render qrCode here. For now just show CTA -->
            <p class="qr-note">Hoặc quét mã QR qua ứng dụng ngân hàng</p>
          </div>

          <div class="actions">
            <button class="payos-btn" @click="openPayOS">
              Thanh toán qua PayOS
            </button>
            <button class="cancel-btn" @click="handleCancel">
              Hủy thanh toán
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { 
  createOnlinePayment, 
  getOnlinePaymentStatus, 
  cancelOnlinePayment,
  getOnlineOrderDetail
} from '@/modules/ban-hang-online/api/banHangOnlineApi';
import { useGioHangOnlineStore } from '@/modules/ban-hang-online/store/gioHangOnlineStore';

const route = useRoute();
const router = useRouter();
const cartStore = useGioHangOnlineStore();

const idHoaDon = Number(route.params.idHoaDon);

const checkoutUrl = ref('');
const qrCode = ref('');
const status = ref('PENDING'); // PENDING, PAID, CANCELLED
const cancelReason = ref('');
const loading = ref(true);
const error = ref('');
let pollInterval: any = null;

onMounted(async () => {
  if (!idHoaDon) {
    router.push('/shop');
    return;
  }
  // Guard: if this is a COD order, go straight to order detail
  try {
    const detail = await getOnlineOrderDetail(idHoaDon);
    if (detail.data.code === 200) {
      const ord = detail.data.data;
      if (ord.hinhThucThanhToan === 'TIEN_MAT') {
        router.replace(`/shop/orders/${idHoaDon}`);
        return;
      }
    }
  } catch {
    // On error, fall through to initPayment which will handle it
  }
  initPayment();
});

onUnmounted(() => {
  stopPolling();
});

const initPayment = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await createOnlinePayment(idHoaDon);
    if (res.data.code === 200) {
      checkoutUrl.value = res.data.data.checkoutUrl;
      if (res.data.data.qrCode) {
        qrCode.value = res.data.data.qrCode;
      }
      startPolling();
    } else {
      error.value = res.data.message || 'Không thể tạo link thanh toán';
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Lỗi kết nối khi tạo thanh toán';
  } finally {
    loading.value = false;
  }
};

const applyStatusData = (data: any) => {
  const isPaid =
    data.daThanhToan === true ||
    data.trangThaiDonHang === 'DA_THANH_TOAN' ||
    data.payosStatus === 'PAID';

  if (isPaid) {
    handlePaid();
    return;
  }

  const isCancelled =
    data.trangThaiDonHang === 'DA_HUY' ||
    data.payosStatus === 'CANCELLED' ||
    data.payosStatus === 'EXPIRED';

  if (isCancelled) {
    const POS_FALLBACK =
      'Phiên QR đã được hủy vì nguyên liệu còn lại được ưu tiên cho khách đang thanh toán tại quầy.' +
      ' Đơn vẫn nằm trong danh sách chờ; bạn có thể thử thanh toán lại khi còn hàng.';
    if (data.maLyDoCho === 'POS_UU_TIEN') {
      cancelReason.value = data.lyDoCho || POS_FALLBACK;
    } else if (data.lyDoCho) {
      cancelReason.value = data.lyDoCho;
    } else {
      cancelReason.value = '';
    }
    qrCode.value = '';
    checkoutUrl.value = '';
    status.value = 'CANCELLED';
    stopPolling();
  }
};

const startPolling = () => {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(async () => {
    try {
      const res = await getOnlinePaymentStatus(idHoaDon);
      if (res.data.code === 200) {
        applyStatusData(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi khi poll trạng thái:', err);
    }
  }, 3000);
};

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
};

const handlePaid = () => {
  status.value = 'PAID';
  stopPolling();
  message.success('Thanh toán thành công');
  cartStore.clearCart();
  setTimeout(() => {
    router.push(`/shop/orders/${idHoaDon}`);
  }, 1500);
};

const openPayOS = () => {
  if (checkoutUrl.value) {
    window.open(checkoutUrl.value, '_blank');
  }
};

const handleCancel = async () => {
  try {
    loading.value = true;
    const res = await cancelOnlinePayment(idHoaDon);
    if (res.data.code === 200) {
      status.value = 'CANCELLED';
      stopPolling();
      message.info('Đã hủy thanh toán');
    } else {
      message.error(res.data.message || 'Lỗi khi hủy');
    }
  } catch (err: any) {
    message.error(err.response?.data?.message || 'Lỗi kết nối khi hủy thanh toán');
  } finally {
    loading.value = false;
  }
};

</script>

<style scoped>
.payment-page {
  padding: 60px 24px;
  display: flex;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.payment-card {
  width: 100%;
  max-width: 500px;
  background: #FFFDFC;
  border: 1px solid #E8E0D7;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0,0,0,0.04);
}

.payment-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #2B2724;
  margin-bottom: 8px;
}

.payment-header p {
  color: #746B63;
  margin-bottom: 32px;
}

.loading-state, .error-state, .success-state, .cancelled-state {
  padding: 40px 0;
}

.success-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #4CAF50;
  color: white;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.cancelled-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #F44336;
  color: white;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.text-danger {
  color: #D9363E;
  margin-bottom: 16px;
}

.status-badge {
  display: inline-block;
  padding: 6px 16px;
  background: #FEF3C7;
  color: #92400E;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 32px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payos-btn {
  background: #8B5E3C;
  color: white;
  border: none;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}
.payos-btn:hover { background: #6F452D; }

.cancel-btn {
  background: transparent;
  color: #746B63;
  border: 1px solid #E8E0D7;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.cancel-btn:hover {
  background: #F9F8F6;
  color: #2B2724;
}
.retry-btn, .back-btn {
  background: #2B2724;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 4px;
  cursor: pointer;
}
.cancel-reason-text {
  font-size: 14px;
  color: #6B655F;
  line-height: 1.6;
  max-width: 380px;
  margin: 0 auto 16px;
}
.mt-4 { margin-top: 16px; }
</style>
