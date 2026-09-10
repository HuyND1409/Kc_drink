<template>
  <a-modal :open="open" @cancel="handleClose" :footer="null" width="900px" :maskClosable="false" :closable="false"
    class="checkout-flow-modal" centered>
    <div class="checkout-modal-inner">
      <!-- Header with Close Button -->
      <div class="modal-header">
        <h2 class="modal-title">Thanh toán đơn hàng</h2>
        <button class="close-btn" @click="handleClose">✕</button>
      </div>

      <!-- Main Layout -->
      <div class="checkout-layout">

        <!-- ================= PAYMENT STATE (AFTER PLACING ORDER) ================= -->
        <div v-if="idHoaDon" class="checkout-main full-width">
          <div v-if="paymentLoading" class="loading-state">
            <a-spin size="large" />
            <p class="mt-4">Đang kết nối cổng thanh toán...</p>
          </div>

          <div v-else-if="paymentError" class="error-state">
            <p class="text-danger">{{ paymentError }}</p>
            <button class="outline-btn" @click="initPayment">Thử lại</button>
          </div>

          <div v-else-if="paymentStatus === 'CANCELLED'" class="cancelled-state center-content">
            <div class="cancelled-icon">✕</div>
            <h3>Thanh toán đã hủy</h3>
            <p>Bạn đã hủy thanh toán cho đơn hàng này.</p>
            <p v-if="redirectCount > 0" class="redirect-text">Tự động quay lại cửa hàng sau {{ redirectCount }} giây.</p>
            <button class="brand-btn mt-4" @click="goToShop">Quay lại cửa hàng</button>
          </div>

          <div v-else-if="paymentStatus === 'PAID'" class="success-content center-content">
            <div class="success-icon">✓</div>
            <h2>Thanh toán thành công</h2>
            <p>Mã đơn hàng: <strong>#{{ idHoaDon }}</strong></p>
            <p>Tổng thanh toán: <strong>{{ formatCurrency(previewResponse?.tongThanhToan || 0) }}</strong></p>

            <p v-if="successRedirectCount > 0" class="redirect-text success-redirect-text">Tự động đóng sau {{ successRedirectCount }} giây</p>

            <div class="success-actions mt-4">
              <button class="outline-btn" @click="handleSuccessAction('continue')">Tiếp tục mua hàng</button>
              <button class="brand-btn" @click="handleSuccessAction('view')">Xem đơn hàng</button>
            </div>
          </div>

          <div v-else class="pending-state center-content">
            <div class="status-badge">Đang chờ thanh toán</div>
            <h3>Đơn hàng: #{{ orderCode || idHoaDon }}</h3>
            <p class="payment-amount">Số tiền: <strong>{{ formatCurrency(amount || previewResponse?.tongThanhToan || 0)
                }}</strong></p>

            <div class="qr-container">
              <template v-if="qrCode">
                
                <!-- Countdown Timer -->
                <div class="payment-timer-wrapper mt-2 mb-4">
                  <div class="payment-timer-label">Thời gian thanh toán còn lại</div>
                  <div class="payment-timer-value" :class="{ 'warning-timer': remainingSeconds <= 60 }">
                    <span v-if="remainingSeconds > 0">{{ formattedRemaining }}</span>
                    <span v-else>Đã hết thời gian thanh toán</span>
                  </div>
                </div>

                <div class="qr-wrapper">
                  <QrcodeVue :value="qrCode" :size="200" />
                </div>
                <p class="qr-note mt-2">Quét mã bằng ứng dụng ngân hàng để thanh toán</p>
                <p class="qr-desc mb-1" v-if="description">Nội dung CK: <strong>{{ description }}</strong></p>
                
                <p class="qr-expire-note mt-1">Đơn hàng sẽ tự hủy nếu hết thời gian thanh toán.</p>
              </template>
              <template v-else>
                <div class="qr-fallback">Không thể hiển thị mã QR</div>
              </template>
            </div>

            <div class="payment-actions">
              <!-- <button class="payos-btn outline-btn" @click="openPayOS">
                Mở trang thanh toán PayOS
              </button> -->
              <button class="cancel-order-btn outline-btn danger-outline-btn" @click="handleCancelOrder" :disabled="cancelingOrder">
                {{ cancelingOrder ? 'Đang hủy...' : 'Hủy đơn hàng' }}
              </button>
            </div>
          </div>
        </div>

        <!-- ================= CHECKOUT FORM (BEFORE PLACING ORDER) ================= -->
        <template v-else>
          <!-- Left Column: Form -->
          <div class="checkout-main">
            <div class="checkout-scroll-area">
              <!-- Địa chỉ -->
              <div class="form-section">
                <h3 class="section-title">Thông tin giao hàng</h3>
                <div v-if="loadingAddresses" class="loading-state-small">
                  <a-spin /> Đang tải...
                </div>
                <div v-else-if="addresses.length === 0" class="empty-state-small">
                  <p>Bạn chưa có địa chỉ giao hàng.</p>
                  <button class="outline-btn mt-4" @click="openAddressModal">+ Thêm địa chỉ</button>
                </div>
                <div v-else-if="selectedAddress" class="selected-address-container">
                  <div class="address-card selected">
                    <div class="address-header">
                      <span class="name">{{ selectedAddress.tenNguoiNhan }}</span>
                      <span class="phone">{{ selectedAddress.sdtNguoiNhan }}</span>
                      <span v-if="selectedAddress.macDinh" class="badge default-badge">Mặc định</span>
                    </div>
                    <div class="address-body">
                      {{ selectedAddress.diaChi }}<br/>
                      {{ selectedAddress.tenPhuongXa }}, {{ selectedAddress.tenQuanHuyen }}, {{ selectedAddress.tenTinhThanh }}
                    </div>
                  </div>
                  <div class="address-actions-inline mt-4">
                    <button class="outline-btn" @click="openAddressModal">Đổi địa chỉ</button>
                    <button class="outline-btn" @click="openAddressModal">+ Thêm địa chỉ</button>
                  </div>
                </div>
              </div>

              <!-- Voucher -->
              <div class="form-section mt-4">
                <h3 class="section-title">Khuyến mãi & Ưu đãi</h3>
                <div class="voucher-options">
                  <div class="voucher-card option-none" :class="{ 'selected': selectedVoucherId === null }"
                    @click="selectVoucher(null)">
                    <div class="v-info">Không sử dụng ưu đãi</div>
                    <div class="check-icon" v-if="selectedVoucherId === null">✓</div>
                  </div>

                  <div v-for="v in vouchers" :key="v.idVoucher" class="voucher-card"
                    :class="{ 'selected': selectedVoucherId === v.idVoucher }" @click="selectVoucher(v.idVoucher)">
                    <div class="v-info">
                      <div class="v-name">{{ v.tenVoucher }} ({{ v.maVoucher }})</div>
                      <div class="v-desc">Giảm {{ v.loaiVoucher === '%' ? v.giaTriGiam + '%' :
                        formatCurrency(v.giaTriGiam) }}
                        <span v-if="v.giamToiDa"> - Tối đa {{ formatCurrency(v.giamToiDa) }}</span>
                      </div>
                    </div>
                    <div class="check-icon" v-if="selectedVoucherId === v.idVoucher">✓</div>
                  </div>
                </div>
              </div>

              <!-- Ghi chú -->
              <div class="form-section mt-4">
                <h3 class="section-title">Ghi chú cho quán (nếu có)</h3>
                <textarea v-model="orderNote" class="note-input" placeholder="Ví dụ: Lấy thêm muỗng..."
                  rows="2"></textarea>
              </div>
            </div>
          </div>

          <!-- Right Column: Summary -->
          <div class="checkout-sidebar">
            <div class="summary-card">
              <h3>Tóm tắt đơn hàng</h3>

              <div class="order-items">
                <div v-for="item in cartStore.items" :key="item.id" class="summary-item">
                  <div class="s-qty">{{ item.soLuong }}x</div>
                  <div class="s-details">
                    <div class="s-name">{{ item.tenSanPham }}</div>
                    <div class="s-meta">Size {{ item.tenSize }} · Đường {{ item.mucDuong }}% · Đá {{ item.mucDa }}%
                    </div>
                    <div class="s-topping" v-for="t in item.toppings" :key="t.idTopping">
                      + {{ t.tenTopping }} (Tổng {{ t.soLuong }} phần)
                    </div>
                  </div>
                </div>
              </div>

              <div class="summary-divider"></div>

              <div class="summary-rows">
                <div class="s-row">
                  <span class="label">Tạm tính sau CTKM</span>
                  <span class="value">
                    {{ previewResponse ? formatCurrency(previewResponse.tamTinhSauKhuyenMai) :
                      formatCurrency(cartStore.estimatedTotal) }}
                  </span>
                </div>
                <div class="s-row discount" v-if="previewResponse && previewResponse.tienGiamVoucher > 0">
                  <span class="label">Voucher</span>
                  <span class="value">-{{ formatCurrency(previewResponse.tienGiamVoucher) }}</span>
                </div>
                <div class="s-row">
                  <span class="label">Phí giao hàng</span>
                  <span class="value">
                    <span v-if="!previewResponse">Đang tính...</span>
                    <span v-else>{{ formatCurrency(previewResponse.phiVanChuyen) }}</span>
                  </span>
                </div>
              </div>

              <div class="summary-divider"></div>

              <div class="s-total-row">
                <span class="label">Tổng thanh toán</span>
                <span class="value total-price">
                  {{ previewResponse ? formatCurrency(previewResponse.tongThanhToan) : '---' }}
                </span>
              </div>

              <p class="disclaimer">Giá và phí giao hàng được xác nhận từ hệ thống.</p>

              <!-- Phương thức thanh toán -->
              <div class="pm-sidebar-label mt-3">Phương thức thanh toán</div>
              <div class="pm-sidebar-options">
                <label class="pm-sidebar-opt" :class="{ active: selectedPaymentMethod === 'CHUYEN_KHOAN' }">
                  <input type="radio" name="paymentMethod" value="CHUYEN_KHOAN" v-model="selectedPaymentMethod" />
                  <div class="pm-sidebar-opt-body">
                    <div class="pm-sidebar-opt-title">Chuyển khoản PayOS</div>
                    <div class="pm-sidebar-opt-desc">Quét mã QR và thanh toán trước</div>
                  </div>
                </label>
                <label class="pm-sidebar-opt" :class="{ active: selectedPaymentMethod === 'TIEN_MAT' }">
                  <input type="radio" name="paymentMethod" value="TIEN_MAT" v-model="selectedPaymentMethod" />
                  <div class="pm-sidebar-opt-body">
                    <div class="pm-sidebar-opt-title">Thanh toán khi nhận hàng</div>
                    <div class="pm-sidebar-opt-desc">Thanh toán tiền mặt khi nhận đơn</div>
                  </div>
                </label>
              </div>

              <button class="brand-btn w-100 mt-4" :disabled="!canPlaceOrder" @click="placeOrder">
                {{ placingOrder ? 'Đang xử lý...' : selectedPaymentMethod === 'TIEN_MAT' ? 'Đặt hàng' : 'Đặt hàng & thanh toán' }}
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </a-modal>

  <!-- Dia Chi Online Modal -->
  <DiaChiOnlineModal
    v-model:open="addressModalOpen"
    :current-selected-id="selectedAddressId"
    @select-address="onAddressSelectedFromModal"
    @addresses-updated="onAddressesUpdatedFromModal"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { useGioHangOnlineStore } from '@/modules/ban-hang-online/store/gioHangOnlineStore';
import { notifyDataChanged } from '@/utils/appSync';
import {
  getDiaChiOnline,
  previewCheckoutOnline,
  getVoucherOnline,
  createOnlineOrder,
  createOnlinePayment,
  getOnlinePaymentStatus,
  cancelOnlinePayment,
  cancelOnlineOrder,
  getOnlineOrderDetail
} from '@/modules/ban-hang-online/api/banHangOnlineApi';
import QrcodeVue from 'qrcode.vue';
import DiaChiOnlineModal from './DiaChiOnlineModal.vue';
import type {
  DiaChiOnline,
  VoucherOnline,
  CheckoutPreviewResponse,
  CheckoutPreviewRequest,
  TaoDonHangOnlineRequest
} from '@/modules/ban-hang-online/types/banHangOnline';

const props = defineProps<{
  open: boolean;
  resumeHoaDonId?: number | null;
  resumePaymentData?: any | null;
}>();

const emit = defineEmits(['update:open']);

const router = useRouter();
const cartStore = useGioHangOnlineStore();

// Form State
const addresses = ref<DiaChiOnline[]>([]);
const loadingAddresses = ref(false);
const selectedAddressId = ref<number | null>(null);
const addressModalOpen = ref(false);

const selectedAddress = computed(() => {
  return addresses.value.find(a => a.idDiaChi === selectedAddressId.value) || null;
});

const openAddressModal = () => {
  addressModalOpen.value = true;
};

const onAddressesUpdatedFromModal = (newList: DiaChiOnline[]) => {
  addresses.value = newList;

  // Rule: if selectedAddressId is null but we have list, try to select default
  if (!selectedAddressId.value && addresses.value.length > 0) {
    const def = addresses.value.find(a => a.macDinh);
    selectedAddressId.value = def ? def.idDiaChi : (addresses.value[0]?.idDiaChi || null);
    if (selectedAddressId.value) fetchPreview();
  } else if (selectedAddressId.value) {
    // Make sure we re-preview if address changed its values
    fetchPreview();
  }
};

const onAddressSelectedFromModal = (id: number) => {
  if (selectedAddressId.value !== id) {
    selectedAddressId.value = id;
    fetchPreview();
  }
};

const vouchers = ref<VoucherOnline[]>([]);
const selectedVoucherId = ref<number | null>(null);

// Preview State
const previewResponse = ref<CheckoutPreviewResponse | null>(null);
const loadingPreview = ref(false);
const orderNote = ref('');

// ORDER State
const placingOrder = ref(false);
const cancelingOrder = ref(false);
const clientRequestId = ref('');
const selectedPaymentMethod = ref<'CHUYEN_KHOAN' | 'TIEN_MAT'>('CHUYEN_KHOAN');
const idHoaDon = ref<number | null>(null);

// Payment refs
const checkoutUrl = ref('');
const qrCode = ref('');
const orderCode = ref<string | number>('');
const amount = ref<number>(0);
const description = ref('');
const paymentStatus = ref<'PENDING' | 'PAID' | 'CANCELLED'>('PENDING');
const paymentLoading = ref(false);
const paymentError = ref('');
let pollInterval: any = null;

const payosExpiresAt = ref<string | null>(null);
const remainingSeconds = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const formattedRemaining = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60);
  const seconds = remainingSeconds.value % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const updateCountdown = () => {
  if (!payosExpiresAt.value) {
    remainingSeconds.value = 0;
    return;
  }

  const expiresAt = new Date(payosExpiresAt.value).getTime();

  remainingSeconds.value = Math.max(
    0,
    Math.floor((expiresAt - Date.now()) / 1000)
  );

  if (remainingSeconds.value <= 0) {
    stopCountdown();
    checkCurrentStatusImmediate();
  }
};

const startCountdown = () => {
  stopCountdown();
  updateCountdown();

  if (remainingSeconds.value <= 0) {
    return;
  }

  countdownTimer = setInterval(updateCountdown, 1000);
};

const stopCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
};

// REDIRECT State
const redirectCount = ref(0);
let redirectInterval: any = null;
const cancelledByCurrentAction = ref(false);

const successRedirectCount = ref(0);
let successRedirectInterval: any = null;

const clearSuccessRedirectTimer = () => {
  if (successRedirectInterval) {
    clearInterval(successRedirectInterval);
    successRedirectInterval = null;
  }
  successRedirectCount.value = 0;
};

const clearRedirectTimer = () => {
  if (redirectInterval) {
    clearInterval(redirectInterval);
    redirectInterval = null;
  }
  redirectCount.value = 0;
};

const goToShop = () => {
  clearRedirectTimer();
  emit('update:open', false);
  router.push('/shop');
};

watch(() => props.open, (newVal) => {
  if (newVal) {
    if (props.resumeHoaDonId && props.resumePaymentData) {
      resetFlow();
      // Bypass create order flow
      idHoaDon.value = props.resumeHoaDonId;
      checkoutUrl.value = props.resumePaymentData.checkoutUrl || '';
      qrCode.value = props.resumePaymentData.qrCode || '';
      orderCode.value = props.resumePaymentData.orderCode || props.resumeHoaDonId;
      amount.value = props.resumePaymentData.amount || 0;
      description.value = props.resumePaymentData.description || '';
      paymentStatus.value = 'PENDING';
      paymentLoading.value = false;
      
      payosExpiresAt.value = props.resumePaymentData.payosExpiresAt || null;
      if (payosExpiresAt.value) {
        startCountdown();
      } else {
        getOnlineOrderDetail(idHoaDon.value).then(res => {
          if (res.data.code === 200 && res.data.data.payosExpiresAt) {
            payosExpiresAt.value = res.data.data.payosExpiresAt;
            startCountdown();
          }
        }).catch(() => {});
      }
      
      startPolling();
    } else {
      resetFlow();
      initFlow();
    }
  } else {
    stopPolling();
    stopCountdown();
    clearRedirectTimer();
    clearSuccessRedirectTimer();
  }
});

const resetFlow = () => {
  clearRedirectTimer();
  clearSuccessRedirectTimer();
  cancelledByCurrentAction.value = false;
  selectedAddressId.value = null;
  selectedVoucherId.value = null;
  previewResponse.value = null;
  orderNote.value = '';
  idHoaDon.value = null;
  checkoutUrl.value = '';
  qrCode.value = '';
  orderCode.value = '';
  amount.value = 0;
  description.value = '';
  paymentStatus.value = 'PENDING';
  paymentError.value = '';
  payosExpiresAt.value = null;
  remainingSeconds.value = 0;
  stopCountdown();
};

const initFlow = async () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    clientRequestId.value = crypto.randomUUID();
  } else {
    clientRequestId.value = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  await fetchAddresses();
};

const fetchAddresses = async () => {
  loadingAddresses.value = true;
  try {
    const res = await getDiaChiOnline();
    if (res.data.code === 200) {
      addresses.value = res.data.data;
      if (addresses.value.length > 0) {
        const def = addresses.value.find(a => a.macDinh);
        selectedAddressId.value = def ? def.idDiaChi : (addresses.value[0]?.idDiaChi || null);
        await fetchPreview();
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    loadingAddresses.value = false;
  }
};

const buildPreviewRequest = (): CheckoutPreviewRequest => {
  return {
    idDiaChi: selectedAddressId.value,
    idVoucher: selectedVoucherId.value,
    items: cartStore.items.map(item => ({
      idSanPham: item.idSanPham,
      idSize: item.idSize,
      soLuong: item.soLuong,
      mucDuong: item.mucDuong,
      mucDa: item.mucDa,
      ghiChu: item.ghiChu,
      toppings: item.toppings.map(t => ({
        idTopping: t.idTopping,
        soLuong: t.soLuong
      }))
    }))
  };
};

const fetchPreview = async () => {
  if (!selectedAddressId.value) return;
  loadingPreview.value = true;
  try {
    const req = buildPreviewRequest();
    const res = await previewCheckoutOnline(req);
    if (res.data.code === 200) {
      previewResponse.value = res.data.data;
      if (selectedVoucherId.value === null && previewResponse.value) {
        fetchVouchers(previewResponse.value.tamTinhSauKhuyenMai);
      }
    } else {
      message.error(res.data.message || 'Lỗi khi tính giá');
      if (selectedVoucherId.value !== null) {
        selectedVoucherId.value = null;
      }
    }
  } catch (err: any) {
    console.error(err);
    message.error(err.response?.data?.message || 'Lỗi kết nối khi tính giá');
    if (selectedVoucherId.value !== null) {
      selectedVoucherId.value = null;
    }
  } finally {
    loadingPreview.value = false;
  }
};

const fetchVouchers = async (tamTinh: number) => {
  try {
    const res = await getVoucherOnline(tamTinh);
    if (res.data.code === 200) {
      vouchers.value = res.data.data;
    }
  } catch (err) {
    console.error('Lỗi khi tải voucher', err);
  }
};

const selectAddress = (id: number) => {
  if (selectedAddressId.value !== id) {
    selectedAddressId.value = id;
    fetchPreview();
  }
};

const selectVoucher = (id: number | null) => {
  if (selectedVoucherId.value !== id) {
    selectedVoucherId.value = id;
    fetchPreview();
  }
};

const handleClose = () => {
  if (idHoaDon.value && paymentStatus.value === 'PENDING') {
    message.warning('Đơn hàng đang chờ thanh toán');
  }
  clearSuccessRedirectTimer();
  emit('update:open', false);
};

// ORDER & PAYMENT LOGIC
const canPlaceOrder = computed(() => {
  return cartStore.items.length > 0
    && selectedAddressId.value !== null
    && previewResponse.value !== null
    && !loadingPreview.value
    && !placingOrder.value;
});

const placeOrder = async () => {
  if (!canPlaceOrder.value || !selectedAddressId.value) return;

  placingOrder.value = true;
  try {
    const payload: TaoDonHangOnlineRequest = {
      clientRequestId: clientRequestId.value,
      idDiaChi: selectedAddressId.value,
      idVoucher: selectedVoucherId.value,
      ghiChuDonHang: orderNote.value,
      hinhThucThanhToan: selectedPaymentMethod.value,
      items: buildPreviewRequest().items
    };

    const res = await createOnlineOrder(payload);
    if (res.data.code === 200) {
      idHoaDon.value = res.data.data.idHoaDon;
      if (selectedPaymentMethod.value === 'TIEN_MAT') {
        cartStore.clearCart();
        emit('update:open', false);
        message.success('Đặt hàng thành công. Bạn sẽ thanh toán khi nhận hàng.');
        router.push(`/shop/orders/${idHoaDon.value}`);
      } else {
        initPayment();
      }
    } else {
      message.error(res.data.message || 'Tạo đơn hàng thất bại');
    }
  } catch (err: any) {
    message.error(err.response?.data?.message || 'Lỗi mạng khi tạo đơn');
  } finally {
    placingOrder.value = false;
  }
};

const initPayment = async () => {
  if (!idHoaDon.value) return;
  paymentLoading.value = true;
  paymentError.value = '';
  try {
    const res = await createOnlinePayment(idHoaDon.value);
    if (res.data.code === 200) {
      checkoutUrl.value = res.data.data.checkoutUrl;
      if (res.data.data.qrCode) {
        qrCode.value = res.data.data.qrCode;
      }
      if (res.data.data.orderCode) {
        orderCode.value = res.data.data.orderCode;
      }
      if (res.data.data.amount) {
        amount.value = res.data.data.amount;
      }
      if (res.data.data.description) {
        description.value = res.data.data.description;
      }
      
      if (res.data.data.payosExpiresAt) {
        payosExpiresAt.value = res.data.data.payosExpiresAt;
        startCountdown();
      } else {
        const detailRes = await getOnlineOrderDetail(idHoaDon.value);
        if (detailRes.data.code === 200 && detailRes.data.data.payosExpiresAt) {
          payosExpiresAt.value = detailRes.data.data.payosExpiresAt;
          startCountdown();
        }
      }
      
      startPolling();
    } else {
      paymentError.value = res.data.message || 'Không thể tạo link thanh toán';
    }
  } catch (err: any) {
    paymentError.value = err.response?.data?.message || 'Lỗi kết nối khi tạo thanh toán';
  } finally {
    paymentLoading.value = false;
  }
};

const startPolling = () => {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(async () => {
    if (!idHoaDon.value) return;
    try {
      const res = await getOnlinePaymentStatus(idHoaDon.value);
      if (res.data.code === 200) {
        const isPaid = res.data.data.daThanhToan;
        const hdStatus = res.data.data.trangThaiHoaDon;

        if (isPaid || hdStatus === 'DA_THANH_TOAN') {
          handlePaid();
        } else if (hdStatus === 'DA_HUY' || hdStatus === 'CANCELLED') {
          paymentStatus.value = 'CANCELLED';
          stopPolling();
        }
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
  paymentStatus.value = 'PAID';
  stopPolling();
  stopCountdown();
  cartStore.clearCart();
  startSuccessRedirect();
};

const openPayOS = () => {
  if (checkoutUrl.value) {
    window.open(checkoutUrl.value, '_blank');
  }
};

const handleCancelPayment = async () => {
  if (!idHoaDon.value) return;
  try {
    paymentLoading.value = true;
    const res = await cancelOnlinePayment(idHoaDon.value);
    if (res.data.code === 200) {
      paymentStatus.value = 'CANCELLED';
      stopPolling();
      message.info('Đã hủy thanh toán');
    } else {
      message.error(res.data.message || 'Lỗi khi hủy');
    }
  } catch (err: any) {
    message.error(err.response?.data?.message || 'Lỗi kết nối khi hủy thanh toán');
  } finally {
    paymentLoading.value = false;
  }
};

const checkCurrentStatusImmediate = async () => {
  if (!idHoaDon.value) return;
  try {
    const res = await getOnlinePaymentStatus(idHoaDon.value);
    if (res.data.code === 200) {
      const isPaid = res.data.data.daThanhToan;
      const hdStatus = res.data.data.trangThaiHoaDon;
      if (isPaid || hdStatus === 'DA_THANH_TOAN') {
        handlePaid();
      } else if (hdStatus === 'DA_HUY' || hdStatus === 'CANCELLED') {
        paymentStatus.value = 'CANCELLED';
        stopPolling();
      }
    }
  } catch (err) {
    console.error('Lỗi check status:', err);
  }
};

const startCancelRedirect = () => {
  if (!cancelledByCurrentAction.value) return;

  clearRedirectTimer();
  redirectCount.value = 5;

  redirectInterval = setInterval(() => {
    redirectCount.value -= 1;
    if (redirectCount.value <= 0) {
      goToShop();
    }
  }, 1000);
};

const handleCancelOrder = () => {
  if (!idHoaDon.value) return;

  Modal.confirm({
    title: 'Hủy đơn hàng?',
    content: 'Mã thanh toán hiện tại sẽ bị hủy và phần hàng đang giữ sẽ được giải phóng.',
    okText: 'Hủy đơn',
    cancelText: 'Không',
    okButtonProps: { danger: true },
    onOk: async () => {
      cancelingOrder.value = true;
      try {
        const res = await cancelOnlineOrder(idHoaDon.value as number);
        if (res.data.code === 200) {
          message.success('Đã hủy đơn hàng');
          notifyDataChanged('ONLINE_ORDER_UPDATED', { idHoaDon: idHoaDon.value });

          cancelledByCurrentAction.value = true;
          paymentStatus.value = 'CANCELLED';
          stopPolling();
          startCancelRedirect();
        } else {
          message.error(res.data.message || 'Không thể hủy đơn hàng');
          checkCurrentStatusImmediate();
        }
      } catch (err: any) {
        message.error(err.response?.data?.message || 'Lỗi mạng khi hủy đơn');
        checkCurrentStatusImmediate();
      } finally {
        cancelingOrder.value = false;
      }
    }
  });
};

const startSuccessRedirect = () => {
  clearSuccessRedirectTimer();
  successRedirectCount.value = 5;
  successRedirectInterval = setInterval(() => {
    successRedirectCount.value -= 1;
    if (successRedirectCount.value <= 0) {
      clearSuccessRedirectTimer();
      emit('update:open', false);
    }
  }, 1000);
};

const handleSuccessAction = (action: 'continue' | 'view') => {
  clearSuccessRedirectTimer();
  if (action === 'continue') {
    emit('update:open', false);
  } else if (action === 'view') {
    if (idHoaDon.value) {
      emit('update:open', false);
      router.push(`/shop/orders/${idHoaDon.value}`);
    }
  }
};

const viewOrder = () => {
  if (idHoaDon.value) {
    emit('update:open', false);
    router.push(`/shop/orders/${idHoaDon.value}`);
  }
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};

onUnmounted(() => {
  stopPolling();
  clearRedirectTimer();
  clearSuccessRedirectTimer();
});
</script>

<style scoped>
.checkout-modal-inner {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #1E1E1E;
  display: flex;
  flex-direction: column;
  max-height: 92vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #F0ECE6;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #2B2724;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  color: #746B63;
  cursor: pointer;
}

.close-btn:hover {
  color: #1E1E1E;
}

/* Layout */
.checkout-layout {
  display: flex;
  gap: 32px;
  align-items: stretch;
  flex: 1;
  min-height: 0;
}

.checkout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.checkout-main.full-width {
  justify-content: center;
  align-items: center;
}

.checkout-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding-right: 12px;
}

.checkout-sidebar {
  width: 380px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

/* Sections */
.form-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
}

/* Buttons */
.brand-btn {
  background: #8B5E3C;
  color: white;
  border: none;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}

.brand-btn:hover:not(:disabled) {
  background: #6F452D;
}

.brand-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.w-100 {
  width: 100%;
}

.outline-btn {
  background: transparent;
  color: #2B2724;
  border: 1px solid #E8E0D7;
  padding: 10px 24px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
}

.outline-btn:hover {
  background: #F9F8F6;
}

/* Address & Voucher cards */
.voucher-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.address-actions-inline {
  display: flex;
  gap: 12px;
}

.address-card,
.voucher-card {
  position: relative;
  border: 1px solid #E8E0D7;
  border-radius: 6px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  background: #FFFDFC;
}

.address-card:hover,
.voucher-card:hover {
  border-color: #C89263;
}

.address-card.selected,
.voucher-card.selected {
  border-color: #8B5E3C;
  background: #fdfbf8;
}

.check-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  color: #8B5E3C;
  font-weight: bold;
}

.address-header .name {
  font-weight: 700;
  margin-right: 8px;
}

.address-header .phone {
  color: #746B63;
  font-size: 13px;
}

.default-badge {
  font-size: 11px;
  background: #E8E0D7;
  color: #6F452D;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
}

.address-body {
  font-size: 14px;
  margin-top: 8px;
}

.v-name {
  font-weight: 700;
  margin-bottom: 4px;
}

.v-desc {
  font-size: 13px;
  color: #5F7057;
}

/* Note Input */
.note-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #E8E0D7;
  border-radius: 6px;
  font-family: inherit;
  resize: vertical;
}

/* Summary Sidebar */
.summary-card {
  background: #F9F8F6;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.summary-card h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 700;
}

.order-items {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.s-qty {
  font-weight: 700;
  color: #8B5E3C;
}

.s-name {
  font-weight: 600;
  font-size: 14px;
}

.s-meta,
.s-topping {
  font-size: 12px;
  color: #746B63;
}

.summary-divider {
  height: 1px;
  background: #E8E0D7;
  margin: 16px 0;
  flex-shrink: 0;
}

.summary-rows {
  flex-shrink: 0;
}

.s-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.s-row.discount .value {
  color: #5F7057;
}

.s-total-row {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  font-size: 18px;
  color: #8B5E3C;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.disclaimer {
  font-size: 12px;
  color: #746B63;
  font-style: italic;
  flex-shrink: 0;
}

.center-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  text-align: center;
  padding: 10px 0;
}

.pending-state h3 {
  font-size: 18px;
  margin-bottom: 4px;
}

.payment-amount {
  font-size: 16px;
  margin-bottom: 12px;
}

.payment-amount strong {
  color: #8B5E3C;
  font-size: 20px;
}

.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 18px;
}

.qr-wrapper {
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #E8E0D7;
  display: inline-block;
  margin-bottom: 12px;
}

.qr-note {
  font-size: 14px;
  color: #6B655F;
  margin: 0 0 8px 0;
}

.qr-desc {
  font-size: 14px;
  color: #1E1E1E;
}

.qr-fallback {
  background: #F9F8F6;
  padding: 24px;
  border-radius: 12px;
  border: 1px dashed #E8E0D7;
  color: #746B63;
  margin-bottom: 16px;
}

.success-actions {
  display: flex;
  justify-content: center;
  align-items: stretch;
  gap: 12px;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.success-actions button {
  flex: 1;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
}

.success-redirect-text {
  font-size: 13px;
  color: #746B63;
  margin-top: 4px;
}

.success-icon {
  width: 64px;
  height: 64px;
  background: #4CAF50;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-bottom: 20px;
}

.cancelled-icon {
  width: 64px;
  height: 64px;
  background: #F44336;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-bottom: 20px;
}

.status-badge {
  background: #FEF3C7;
  color: #92400E;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  display: inline-block;
  font-size: 13px;
}

.payment-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
}

.payment-actions > button,
.payment-actions > a {
  width: 100%;
}

.payos-btn {
  background: transparent;
  color: #2B2724;
  padding: 12px;
  border: 1px solid #E8E0D7;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.payos-btn:hover {
  background: #F9F8F6;
}

.danger-outline-btn {
  background: transparent;
  color: #D9363E;
  padding: 12px;
  border: 1px solid #D9363E;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.danger-outline-btn:hover:not(:disabled) {
  background: #FFF5F5;
}

.danger-outline-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-link {
  background: transparent;
  color: #746B63;
  border: none;
  text-decoration: underline;
  cursor: pointer;
}

.mt-4 {
  margin-top: 16px;
}

.redirect-text {
  color: #8B5E3C;
  font-weight: 600;
  margin-top: 12px;
}

/* Global Modal Overrides for this specific modal */
:deep(.ant-modal-content) {
  padding: 20px 28px !important;
  border-radius: 12px !important;
}

/* Sidebar payment method selector */
.pm-sidebar-label {
  font-size: 13px;
  font-weight: 700;
  color: #2B2724;
  margin-bottom: 10px;
}

.pm-sidebar-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.pm-sidebar-opt {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #E8E0D7;
  border-radius: 6px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.pm-sidebar-opt:hover {
  border-color: #C89263;
}

.pm-sidebar-opt.active {
  border-color: #8B5E3C;
  background: #fdfbf8;
}

.pm-sidebar-opt input[type="radio"] {
  accent-color: #8B5E3C;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  cursor: pointer;
}

.pm-sidebar-opt-title {
  font-size: 13px;
  font-weight: 600;
  color: #2B2724;
  margin-bottom: 1px;
}

.pm-sidebar-opt-desc {
  font-size: 11px;
  color: #746B63;
}

/* Payment Timer */
.payment-timer-wrapper {
  background: #FFFDF8;
  border: 1px solid #E8E0D7;
  border-radius: 4px;
  padding: 4px 12px;
  display: inline-block;
  margin-bottom: 16px;
}

.payment-timer-label {
  font-size: 10px;
  color: #746B63;
  margin-bottom: 0px;
}

.payment-timer-value {
  font-size: 16px;
  font-weight: 700;
  color: #2B2724;
  font-variant-numeric: tabular-nums;
}

.payment-timer-value.warning-timer {
  color: #D9363E;
  animation: pulse 1s infinite;
}

.qr-expire-note {
  font-size: 12px;
  color: #746B63;
  margin-top: 8px;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

@media (max-width: 768px) {
  .success-actions {
    flex-direction: column;
  }

  .checkout-layout {
    flex-direction: column;
    overflow-y: auto;
  }

  .checkout-sidebar {
    width: 100%;
  }

  .address-list,
  .voucher-options {
    grid-template-columns: 1fr;
  }

  .checkout-modal-inner {
    height: auto;
    max-height: 95dvh;
    overflow-y: auto;
  }
}
</style>
