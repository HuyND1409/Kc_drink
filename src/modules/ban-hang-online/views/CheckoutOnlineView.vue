<template>
  <div class="checkout-page container mx-auto">
    <div class="checkout-header">
      <h2>Thanh toán</h2>
      <p class="subtitle">Vui lòng kiểm tra lại thông tin giao hàng và đơn hàng của bạn.</p>
    </div>

    <div class="checkout-layout">
      <!-- Cột trái: Thông tin nhận hàng và voucher -->
      <div class="checkout-main">
        <div class="card section-card">
          <div class="section-title">
            <h3>1. Thông tin giao hàng</h3>
          </div>
          <div class="section-content">
            <div v-if="loadingAddresses" class="loading-state">
              <a-spin /> Đang tải địa chỉ...
            </div>
            <div v-else-if="addresses.length === 0" class="empty-state">
              <div class="empty-icon">📍</div>
              <p>Bạn chưa có địa chỉ giao hàng.</p>
              <p class="sub-text">Vui lòng cập nhật thông tin trong tài khoản.</p>
            </div>
            <div v-else class="address-list">
              <div v-for="addr in addresses" :key="addr.idDiaChi" class="address-card"
                :class="{ 'selected': selectedAddressId === addr.idDiaChi }" @click="selectAddress(addr.idDiaChi)">
                <div class="address-header">
                  <span class="name">{{ addr.tenNguoiNhan }}</span>
                  <span class="phone">{{ addr.sdtNguoiNhan }}</span>
                  <span v-if="addr.macDinh" class="badge default-badge">Mặc định</span>
                </div>
                <div class="address-body">
                  {{ addr.diaChi }}
                </div>
                <div class="check-icon" v-if="selectedAddressId === addr.idDiaChi">✓</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card section-card">
          <div class="section-title">
            <h3>2. Khuyến mãi & Ưu đãi</h3>
          </div>
          <div class="section-content">
            <div v-if="!previewResponse" class="loading-state">
              Vui lòng chọn địa chỉ để xem ưu đãi
            </div>
            <div v-else>
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
          </div>
        </div>

        <div class="card section-card">
          <div class="section-title">
            <h3>3. Ghi chú đơn hàng</h3>
          </div>
          <div class="section-content">
            <textarea v-model="orderNote" class="note-input" placeholder="Nhập ghi chú cho quán (nếu có)..."
              rows="3"></textarea>
          </div>
        </div>

      </div>


      <!-- Cột phải: Summary -->
      <div class="checkout-sidebar">
        <div class="card summary-card sticky-sidebar">
          <h3>Tóm tắt đơn hàng</h3>

          <div class="order-items">
            <div v-for="item in cartStore.items" :key="item.id" class="summary-item">
              <div class="s-qty">{{ item.soLuong }}x</div>
              <div class="s-details">
                <div class="s-name">{{ item.tenSanPham }}</div>
                <div class="s-meta">Size {{ item.tenSize }}, Đường {{ item.mucDuong }}%, Đá {{ item.mucDa }}%</div>
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

          <p class="disclaimer">Giá và phí giao hàng được xác nhận trực tiếp từ hệ thống.</p>

          <!-- Phương thức thanh toán -->
          <div class="pm-sidebar-label">Phương thức thanh toán</div>
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

          <button class="place-order-btn" :disabled="!canPlaceOrder" @click="placeOrder">
            {{ placingOrder ? 'Đang xử lý...' : selectedPaymentMethod === 'TIEN_MAT' ? 'Đặt hàng' : 'Đặt hàng & thanh toán' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { useGioHangOnlineStore } from '@/modules/ban-hang-online/store/gioHangOnlineStore';
import {
  getDiaChiOnline,
  previewCheckoutOnline,
  getVoucherOnline,
  createOnlineOrder
} from '@/modules/ban-hang-online/api/banHangOnlineApi';
import type {
  DiaChiOnline,
  VoucherOnline,
  CheckoutPreviewResponse,
  CheckoutPreviewRequest,
  TaoDonHangOnlineRequest
} from '@/modules/ban-hang-online/types/banHangOnline';

const router = useRouter();
const cartStore = useGioHangOnlineStore();

const addresses = ref<DiaChiOnline[]>([]);
const loadingAddresses = ref(false);
const selectedAddressId = ref<number | null>(null);

const vouchers = ref<VoucherOnline[]>([]);
const selectedVoucherId = ref<number | null>(null);

const previewResponse = ref<CheckoutPreviewResponse | null>(null);
const loadingPreview = ref(false);

const orderNote = ref('');
const placingOrder = ref(false);
const clientRequestId = ref<string>('');
const selectedPaymentMethod = ref<'CHUYEN_KHOAN' | 'TIEN_MAT'>('CHUYEN_KHOAN');

onMounted(async () => {
  if (cartStore.items.length === 0) {
    message.warning('Giỏ hàng trống');
    router.push('/shop');
    return;
  }

  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    clientRequestId.value = crypto.randomUUID();
  } else {
    clientRequestId.value = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  await fetchAddresses();
});

const fetchAddresses = async () => {
  loadingAddresses.value = true;
  try {
    const res = await getDiaChiOnline();
    if (res.data.code === 200) {
      addresses.value = res.data.data;
      if (addresses.value.length > 0) {
        const def = addresses.value.find(a => a.macDinh);
        selectedAddressId.value = def ? def.idDiaChi : (addresses.value[0]?.idDiaChi || null);
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

      // Fetch vouchers based on tamTinhSauKhuyenMai
      if (selectedVoucherId.value === null && previewResponse.value) {
        fetchVouchers(previewResponse.value.tamTinhSauKhuyenMai);
      }
    } else {
      message.error(res.data.message || 'Lỗi khi tính giá');
      if (selectedVoucherId.value !== null) {
        selectedVoucherId.value = null; // Revert voucher on error
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

watch(selectedAddressId, (newVal) => {
  if (newVal) {
    fetchPreview();
  }
});

const selectAddress = (id: number) => {
  if (selectedAddressId.value !== id) {
    selectedAddressId.value = id;
  }
};

const selectVoucher = (id: number | null) => {
  if (selectedVoucherId.value !== id) {
    selectedVoucherId.value = id;
    fetchPreview();
  }
};

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
      const { idHoaDon } = res.data.data;

      if (selectedPaymentMethod.value === 'TIEN_MAT') {
        // COD: clear cart, show success, go directly to order detail
        cartStore.clearCart();
        message.success('Đặt hàng thành công. Bạn sẽ thanh toán khi nhận hàng.');
        router.push(`/shop/orders/${idHoaDon}`);
      } else {
        // CHUYEN_KHOAN: go to payment page as before
        router.push(`/shop/payment/${idHoaDon}`);
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

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};

</script>

<style scoped>
.checkout-page {
  padding: 40px 24px;
  max-width: 1200px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #1E1E1E;
}

.checkout-header {
  margin-bottom: 32px;
}

.checkout-header h2 {
  font-size: 32px;
  font-weight: 700;
  color: #1E1E1E;
  margin-bottom: 8px;
}

.checkout-header .subtitle {
  color: #6B655F;
  font-size: 15px;
}

.checkout-layout {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.checkout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.checkout-sidebar {
  width: 400px;
  flex-shrink: 0;
}

.card {
  background: #FFFDFC;
  border: 1px solid #E8E0D7;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
}

.section-title {
  background: #F7F3ED;
  padding: 16px 24px;
  border-bottom: 1px solid #E8E0D7;
}

.section-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #2B2724;
}

.section-content {
  padding: 24px;
}

.loading-state {
  text-align: center;
  padding: 20px;
  color: #746B63;
}

.empty-state {
  text-align: center;
  padding: 32px 0;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0;
  color: #2B2724;
  font-weight: 600;
}

.empty-state .sub-text {
  color: #746B63;
  font-weight: normal;
  font-size: 13px;
  margin-top: 4px;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.address-card,
.voucher-card {
  position: relative;
  border: 1px solid #E8E0D7;
  border-radius: 6px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
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
  font-size: 18px;
}

.address-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.address-header .name {
  font-weight: 700;
  font-size: 15px;
}

.address-header .phone {
  color: #746B63;
  font-size: 14px;
}

.badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #E8E0D7;
  color: #6F452D;
  font-weight: 600;
}

.address-body {
  font-size: 14px;
  color: #2B2724;
  line-height: 1.5;
  padding-right: 24px;
}

.voucher-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Payment method selector */
.payment-method-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-method-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid #E8E0D7;
  border-radius: 6px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-method-card:hover {
  border-color: #C89263;
}

.payment-method-card.selected {
  border-color: #8B5E3C;
  background: #fdfbf8;
}

.pm-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.pm-info {
  flex: 1;
  min-width: 0;
}

.pm-title {
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 2px;
}

.pm-desc {
  font-size: 13px;
  color: #746B63;
}


.option-none {
  padding: 12px 16px;
}

.option-none .v-info {
  font-weight: 600;
}

.v-info .v-name {
  font-weight: 700;
  margin-bottom: 4px;
}

.v-info .v-desc {
  font-size: 13px;
  color: #5F7057;
}

.note-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #E8E0D7;
  border-radius: 6px;
  outline: none;
  font-family: inherit;
  resize: vertical;
}

.note-input:focus {
  border-color: #8B5E3C;
}

/* Sidebar */
.sticky-sidebar {
  position: sticky;
  top: 80px;
  padding: 24px;
}

.summary-card h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 700;
}

.order-items {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 8px;
}

.summary-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.s-qty {
  font-weight: 700;
  color: #8B5E3C;
  min-width: 24px;
}

.s-details .s-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 2px;
}

.s-meta,
.s-topping {
  font-size: 12px;
  color: #746B63;
}

.summary-divider {
  height: 1px;
  background: #E8E0D7;
  margin: 20px 0;
}

.summary-rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.s-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #2B2724;
}

.s-row.discount .value {
  color: #5F7057;
}

.s-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.s-total-row .label {
  font-weight: 600;
  font-size: 16px;
}

.s-total-row .value {
  font-weight: 700;
  font-size: 24px;
  color: #8B5E3C;
}

.disclaimer {
  font-size: 12px;
  color: #746B63;
  margin-bottom: 24px;
  font-style: italic;
  text-align: right;
}

.place-order-btn {
  width: 100%;
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

.place-order-btn:hover:not(:disabled) {
  background: #6F452D;
}

.place-order-btn:disabled {
  background: #E8E0D7;
  color: #A39B93;
  cursor: not-allowed;
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

@media (max-width: 768px) {
  .checkout-layout {
    flex-direction: column;
  }

  .checkout-sidebar {
    width: 100%;
  }

  .sticky-sidebar {
    position: static;
  }
}
</style>
