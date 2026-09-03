<template>
  <a-modal
    :open="open"
    title="Thanh toán chuyển khoản"
    @cancel="handleClose"
    :footer="null"
    :width="400"
    centered
  >
    <div class="payos-modal-content">
      <div v-if="loading" class="loading-container">
        <a-spin />
        <p>Đang khởi tạo thanh toán...</p>
      </div>
      
      <div v-else-if="error" class="error-container">
        <a-alert type="error" :message="error" show-icon />
      </div>

      <div v-else-if="paymentData" class="payment-container">
        <div class="qr-wrapper">
          <a-qrcode :value="paymentData.qrCode" :size="220" />
        </div>
        
        <div class="info-wrapper">
          <div class="info-row">
            <span class="label">Mã đơn hàng:</span>
            <span class="value">{{ paymentData.orderCode }}</span>
          </div>
          <div class="info-row">
            <span class="label">Số tiền:</span>
            <span class="value amount">{{ formatCurrency(paymentData.amount) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Trạng thái:</span>
            <a-tag :color="getStatusColor(currentStatus)">
              {{ currentStatus }}
            </a-tag>
          </div>
          <div class="info-row mt-4" style="justify-content: center" v-if="currentStatus === 'PENDING'">
            <a-button type="primary" danger :loading="canceling" @click="onCancelQR">Hủy QR</a-button>
          </div>
        </div>
      </div>
      
      <div v-else-if="isMissingQR" class="missing-qr-container">
        <a-alert 
          type="warning" 
          message="Không thể khôi phục ảnh QR của giao dịch hiện tại." 
          show-icon 
        />
        <div class="info-wrapper mt-4" v-if="currentStatus">
           <div class="info-row">
            <span class="label">Trạng thái:</span>
            <a-tag :color="getStatusColor(currentStatus)">
              {{ currentStatus }}
            </a-tag>
          </div>
          <div class="info-row mt-4" style="justify-content: center" v-if="currentStatus === 'PENDING'">
            <a-button type="primary" danger :loading="canceling" @click="onCancelQR">Hủy QR</a-button>
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import type { HoaDon, PayOSCreateResponse, PayOSPaymentStatus } from '../types/pos';
import { taoThanhToanPayOS, layTrangThaiPayOS, huyThanhToanPayOS } from '../api/posApi';

const props = defineProps<{
  open: boolean;
  hoaDon: HoaDon | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'paid', idHoaDon: number): void;
  (e: 'expired', idHoaDon: number): void;
  (e: 'created', data: PayOSCreateResponse): void;
  (e: 'cancelled', idHoaDon: number): void;
}>();

const loading = ref(false);
const error = ref<string | null>(null);
const paymentData = ref<PayOSCreateResponse | null>(null);
const currentStatus = ref<PayOSPaymentStatus | null>(null);
const isMissingQR = ref(false);
const canceling = ref(false);
let pollingInterval: number | null = null;
let pollingRequestInFlight = false;
let hasEmittedCancelled = false;

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const getStatusColor = (status: PayOSPaymentStatus | null) => {
  switch (status) {
    case 'PENDING': return 'blue';
    case 'PAID': return 'success';
    case 'CANCELLED': return 'error';
    case 'EXPIRED': return 'warning';
    default: return 'default';
  }
};

const getStorageKey = (idHoaDon: number) => `pos_payos_payment_${idHoaDon}`;

const handleClose = () => {
  stopPolling();
  emit('close');
};

const startPolling = (idHoaDon: number) => {
  if (pollingInterval !== null) return;
  
  const fetchStatus = async () => {
    if (pollingRequestInFlight) return;
    pollingRequestInFlight = true;
    try {
      const res = await layTrangThaiPayOS(idHoaDon);
      const data = res.data?.data ?? res.data;
      if (data && data.status) {
        currentStatus.value = data.status;
        checkStatus(data.status, idHoaDon);
      }
    } catch (err: any) {
      console.error('Polling error:', err);
    } finally {
      pollingRequestInFlight = false;
    }
  };

  fetchStatus();
  pollingInterval = window.setInterval(fetchStatus, 3000);
};

const stopPolling = () => {
  if (pollingInterval) {
    window.clearInterval(pollingInterval);
    pollingInterval = null;
  }
};

const checkStatus = (status: PayOSPaymentStatus, idHoaDon: number) => {
  if (status === 'PAID') {
    stopPolling();
    emit('paid', idHoaDon);
  } else if (status === 'EXPIRED') {
    stopPolling();
    sessionStorage.removeItem(getStorageKey(idHoaDon));
    emit('expired', idHoaDon);
  } else if (status === 'CANCELLED') {
    stopPolling();
    sessionStorage.removeItem(getStorageKey(idHoaDon));
    if (!hasEmittedCancelled) {
      hasEmittedCancelled = true;
      emit('cancelled', idHoaDon);
    }
  }
};

const initPayment = async () => {
  if (!props.hoaDon) return;
  
  hasEmittedCancelled = false;
  const idHoaDon = props.hoaDon.idHoaDon;
  const storageKey = getStorageKey(idHoaDon);
  error.value = null;
  isMissingQR.value = false;
  
  // Restore from sessionStorage
  const storedData = sessionStorage.getItem(storageKey);
  if (storedData) {
    try {
      const parsedData = JSON.parse(storedData) as PayOSCreateResponse;
      paymentData.value = parsedData;
      currentStatus.value = parsedData.status;
      startPolling(idHoaDon);
      return;
    } catch (e) {
      console.error('Failed to parse stored payment data', e);
      sessionStorage.removeItem(storageKey);
    }
  }
  
  // If no stored data but invoice is already PENDING for payOS
  if (
    props.hoaDon.payosStatus === "PENDING" ||
    props.hoaDon.payosStatus === "PAID"
  ) {
    isMissingQR.value = true;
    currentStatus.value = props.hoaDon.payosStatus;
    startPolling(idHoaDon);
    return;
  }

  // Create new payment
  loading.value = true;
  try {
    const res = await taoThanhToanPayOS(idHoaDon);
    const data = res.data?.data ?? res.data;
    
    paymentData.value = data;
    currentStatus.value = data.status;
    sessionStorage.setItem(storageKey, JSON.stringify(data));
    
    emit('created', data);
    startPolling(idHoaDon);
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || 'Lỗi khởi tạo thanh toán PayOS';
    error.value = errorMsg;
    message.error(errorMsg);
  } finally {
    loading.value = false;
  }
};

const onCancelQR = () => {
  if (!props.hoaDon) return;
  const idHoaDon = props.hoaDon.idHoaDon;

  Modal.confirm({
    title: 'Hủy mã QR?',
    content: 'Sau khi hủy, mã QR này sẽ không thể tiếp tục thanh toán.',
    okText: 'Hủy QR',
    cancelText: 'Không',
    okButtonProps: { danger: true },
    onOk: async () => {
      if (canceling.value) return;
      canceling.value = true;
      try {
        const res = await huyThanhToanPayOS(idHoaDon);
        const data = res.data?.data ?? res.data;
        const status = data?.status as PayOSPaymentStatus | undefined;

        if (!status) {
          throw new Error('Phản hồi hủy thanh toán PayOS không hợp lệ');
        }

        if (status === 'CANCELLED') {
          currentStatus.value = status;
          checkStatus(status, idHoaDon);
        } else if (status === 'EXPIRED' || status === 'PAID') {
          currentStatus.value = status;
          checkStatus(status, idHoaDon);
        } else {
          throw new Error('PayOS chưa xác nhận hủy giao dịch');
        }
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          'Lỗi hủy thanh toán PayOS';
        message.error(errorMsg);
      } finally {
        canceling.value = false;
      }
    }
  });
};

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    initPayment();
  } else {
    stopPolling();
    paymentData.value = null;
    currentStatus.value = null;
    error.value = null;
  }
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.payos-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 250px;
  padding: 16px 0;
}

.loading-container, .error-container, .missing-qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  width: 100%;
}

.payment-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 24px;
}

.qr-wrapper {
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-wrapper {
  width: 100%;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  font-weight: 600;
  color: #333;
}

.value.amount {
  color: #ff4d4f;
  font-size: 18px;
}

.mt-4 {
  margin-top: 16px;
}
</style>
