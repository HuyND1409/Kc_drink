<template>
  <a-modal
    :open="open"
    @cancel="handleCancel"
    :footer="null"
    :width="1080"
    centered
    class="chon-san-pham-modal brand-modal"
    :bodyStyle="{ padding: 0, height: 'min(760px, 88vh)', overflow: 'hidden' }"
    :closable="false"
  >
    <div v-if="productData" class="modal-content-wrap">
      <!-- Header Close Button -->
      <button class="close-btn" @click="handleCancel">✕</button>

      <div class="modal-layout">
        <!-- LEFT: Image -->
        <div class="modal-left">
          <img
            v-if="productData.sanPham.hinhAnh && !imageError"
            :src="getSanPhamImageUrl(productData.sanPham.hinhAnh)"
            :alt="productData.sanPham.tenSanPham"
            @error="imageError = true"
            class="modal-main-img"
          />
          <div v-else class="modal-img-fallback">🧋</div>
        </div>

        <!-- RIGHT: Info & Config -->
        <div class="modal-right">
          <div class="modal-header-info">
            <h2 class="product-title">{{ productData.sanPham.tenSanPham }}</h2>
            <p class="product-desc">{{ productData.sanPham.moTa || "Thức uống tuyệt hảo từ KC Drink" }}</p>
            
            <div class="price-section">
              <span class="current-price">{{ formatCurrency(productData.sanPham.coKhuyenMai ? productData.sanPham.giaSauKhuyenMai : productData.sanPham.gia) }}</span>
              <span v-if="productData.sanPham.coKhuyenMai" class="old-price">{{ formatCurrency(productData.sanPham.gia) }}</span>
              <span v-if="productData.sanPham.coKhuyenMai" class="promo-tag">{{ productData.sanPham.tenKhuyenMai }}</span>
            </div>
          </div>

          <div class="modal-scroll-area">
            <!-- Size -->
            <div class="config-group">
              <div class="group-header">
                <span class="group-label">KÍCH CỠ</span>
                <span class="required-dot">*</span>
              </div>
              <div class="chip-row">
                <button
                  v-for="size in sortedSizes"
                  :key="size.idSize"
                  class="chip-btn"
                  :class="{ active: selectedSizeId === size.idSize }"
                  @click="selectedSizeId = size.idSize"
                >
                  {{ size.tenSize }} <span v-if="size.phuThu > 0" class="chip-price">+{{ formatCurrency(size.phuThu) }}</span>
                </button>
              </div>
            </div>

            <!-- Sugar & Ice -->
            <div class="config-row-split">
              <div class="config-group">
                <div class="group-header"><span class="group-label">MỨC ĐƯỜNG</span></div>
                <div class="chip-row small-chips">
                  <button
                    v-for="val in [100, 70, 50, 30, 0]"
                    :key="'sugar'+val"
                    class="chip-btn"
                    :class="{ active: sugarLevel === val }"
                    @click="sugarLevel = val"
                  >
                    {{ val }}%
                  </button>
                </div>
              </div>
              
              <div class="config-group">
                <div class="group-header"><span class="group-label">MỨC ĐÁ</span></div>
                <div class="chip-row small-chips">
                  <button
                    v-for="val in [100, 70, 50, 30, 0]"
                    :key="'ice'+val"
                    class="chip-btn"
                    :class="{ active: iceLevel === val }"
                    @click="iceLevel = val"
                  >
                    {{ val }}%
                  </button>
                </div>
              </div>
            </div>

            <!-- Topping -->
            <div class="config-group" v-if="activeToppings.length > 0">
              <div class="group-header">
                <span class="group-label">TOPPING TỔNG (CHUNG CHO {{ drinkQty }} LY)</span>
              </div>
              <div class="topping-list">
                <div
                  v-for="topping in activeToppings"
                  :key="topping.idTopping"
                  class="topping-row"
                  :class="{ disabled: topping.tongTonKho <= 0 }"
                >
                  <label class="topping-label-wrap" @click.prevent="toggleTopping(topping)">
                    <input 
                      type="checkbox" 
                      class="custom-checkbox"
                      :checked="selectedToppings[topping.idTopping]?.checked"
                      :disabled="topping.tongTonKho <= 0"
                    />
                    <div class="topping-info-text">
                      <span class="topping-name">{{ topping.tenTopping }}</span>
                      <span class="topping-price">+{{ formatCurrency(topping.giaTopping) }}</span>
                      <span v-if="topping.tongTonKho <= 0" class="out-of-stock">(Hết hàng)</span>
                    </div>
                  </label>
                  
                  <div 
                    class="qty-control topping-qty"
                    :class="{ 'is-hidden': !selectedToppings[topping.idTopping]?.checked }"
                  >
                    <button class="qty-btn" @click="updateToppingInput(topping.idTopping, -1)" :disabled="selectedToppings[topping.idTopping]!.qty <= 1">-</button>
                    <span class="qty-num">{{ selectedToppings[topping.idTopping]?.qty || 1 }}</span>
                    <button class="qty-btn" @click="updateToppingInput(topping.idTopping, 1)">+</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Note -->
            <div class="config-group">
              <div class="group-header"><span class="group-label">GHI CHÚ</span></div>
              <textarea 
                v-model="note" 
                class="custom-textarea" 
                placeholder="Thêm yêu cầu khác cho quán..." 
                rows="2"
              ></textarea>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <div class="drink-qty-wrap">
              <button class="qty-btn" @click="drinkQty = Math.max(1, drinkQty - 1)" :disabled="drinkQty <= 1">-</button>
              <span class="qty-num">{{ drinkQty }}</span>
              <button class="qty-btn" @click="drinkQty++">+</button>
            </div>
            
            <button class="add-to-cart-btn" @click="handleAddToCart">
              Thêm vào giỏ - {{ formatCurrency(estimatedTotal) }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </a-modal>

  <!-- Hộp thoại yêu cầu đăng nhập -->
  <a-modal
    :open="showLoginPrompt"
    :footer="null"
    :closable="false"
    :maskClosable="false"
    centered
    :width="340"
    class="login-prompt-modal"
  >
    <div class="login-prompt-body">
      <div class="login-prompt-icon">🔒</div>
      <div class="login-prompt-title">Bạn cần đăng nhập để mua hàng</div>
      <div class="login-prompt-actions">
        <button class="lp-btn lp-btn--primary" @click="goToLogin">Đăng nhập</button>
        <button class="lp-btn lp-btn--ghost" @click="showLoginPrompt = false">Để sau</button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import type { ChiTietSanPhamOnline, ToppingGioHangOnline } from "@/modules/ban-hang-online/types/banHangOnline";
import { getSanPhamImageUrl } from "@/modules/san-pham/api/sanPhamApi";
import { useGioHangOnlineStore } from "@/modules/ban-hang-online/store/gioHangOnlineStore";
import { useAuthStore } from "@/modules/auth/store/authStore";

const props = defineProps<{
  open: boolean;
  productData: ChiTietSanPhamOnline | null;
}>();

const emit = defineEmits(["update:open"]);

const cartStore = useGioHangOnlineStore();
const auth = useAuthStore();
const router = useRouter();

const imageError = ref(false);
const showLoginPrompt = ref(false);

const goToLogin = () => {
  showLoginPrompt.value = false;
  router.push("/shop/login");
};

// Form State
const selectedSizeId = ref<number | null>(null);
const sugarLevel = ref(100);
const iceLevel = ref(100);
const drinkQty = ref(1);
const note = ref("");

interface ToppingState {
  checked: boolean;
  qty: number;
}
const selectedToppings = ref<Record<number, ToppingState>>({});

// Computed Options
const sortedSizes = computed(() => {
  if (!props.productData) return [];
  return [...props.productData.sizes].sort((a, b) => a.thuTu - b.thuTu);
});

const activeToppings = computed(() => {
  if (!props.productData) return [];
  return props.productData.toppings.filter(t => t.trangThai === 1);
});

// Initialization
watch(() => props.open, (isOpen) => {
  if (isOpen && props.productData) {
    imageError.value = false;
    sugarLevel.value = 100;
    iceLevel.value = 100;
    drinkQty.value = 1;
    note.value = "";
    
    if (sortedSizes.value.length > 0) {
      selectedSizeId.value = sortedSizes.value[0]!.idSize;
    }

    const initialToppings: Record<number, ToppingState> = {};
    activeToppings.value.forEach(t => {
      initialToppings[t.idTopping] = { checked: false, qty: 1 };
    });
    selectedToppings.value = initialToppings;
  }
});

const toggleTopping = (topping: any) => {
  if (topping.tongTonKho <= 0) return;
  const state = selectedToppings.value[topping.idTopping];
  if (state) {
    state.checked = !state.checked;
    if (state.checked) state.qty = 1;
  }
};

const updateToppingInput = (toppingId: number, delta: number) => {
  const state = selectedToppings.value[toppingId];
  if (state) {
    const newQty = state.qty + delta;
    if (newQty >= 1) {
      state.qty = newQty;
    }
  }
};

const estimatedTotal = computed(() => {
  if (!props.productData || !selectedSizeId.value) return 0;

  const basePrice = props.productData.sanPham.coKhuyenMai ? props.productData.sanPham.giaSauKhuyenMai : props.productData.sanPham.gia;
  
  const selectedSize = props.productData.sizes.find(s => s.idSize === selectedSizeId.value);
  const sizePrice = selectedSize ? selectedSize.phuThu : 0;

  const drinkTotal = (basePrice + sizePrice) * drinkQty.value;

  let toppingTotal = 0;
  activeToppings.value.forEach(t => {
    const state = selectedToppings.value[t.idTopping];
    if (state?.checked) {
      toppingTotal += t.giaTopping * state.qty;
    }
  });

  return drinkTotal + toppingTotal;
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const handleCancel = () => {
  emit("update:open", false);
};

const handleAddToCart = () => {
  // Kiểm tra đăng nhập trước mọi thao tác thay đổi giỏ
  if (!auth.token) {
    showLoginPrompt.value = true;
    return;
  }

  if (!props.productData || !selectedSizeId.value) {
    message.error("Vui lòng chọn đầy đủ thông tin");
    return;
  }

  const selectedSize = props.productData.sizes.find(s => s.idSize === selectedSizeId.value);
  if (!selectedSize) return;

  const toppingsToAdd: ToppingGioHangOnline[] = [];
  activeToppings.value.forEach(t => {
    const state = selectedToppings.value[t.idTopping];
    if (state?.checked && state.qty > 0) {
      toppingsToAdd.push({
        idTopping: t.idTopping,
        tenTopping: t.tenTopping,
        giaTopping: t.giaTopping,
        soLuong: state.qty
      });
    }
  });

  const basePrice = props.productData.sanPham.coKhuyenMai ? props.productData.sanPham.giaSauKhuyenMai : props.productData.sanPham.gia;

  cartStore.addItem({
    idSanPham: props.productData.sanPham.idSanPham,
    tenSanPham: props.productData.sanPham.tenSanPham,
    hinhAnh: props.productData.sanPham.hinhAnh,
    idSize: selectedSizeId.value,
    tenSize: selectedSize.tenSize,
    phuThu: selectedSize.phuThu,
    soLuong: drinkQty.value,
    mucDuong: sugarLevel.value,
    mucDa: iceLevel.value,
    ghiChu: note.value.trim(),
    giaSanPhamHienThi: basePrice + selectedSize.phuThu,
    toppings: toppingsToAdd,
  });

  message.success("Đã thêm vào giỏ hàng");
  emit("update:open", false);
};
</script>

<style scoped>
.modal-content-wrap {
  position: relative;
  background: #FFFDFC;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #1E1E1E;
  height: 100%;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  color: #1E1E1E;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.close-btn:hover {
  background: #1E1E1E;
  color: #fff;
}

.modal-layout {
  display: grid;
  grid-template-columns: 42% 58%;
  height: 100%;
  overflow: hidden;
}

/* LEFT SIDE */
.modal-left {
  height: 100%;
  background: #EAE6DF;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.modal-main-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}

.modal-img-fallback {
  font-size: 80px;
  opacity: 0.2;
}

/* RIGHT SIDE */
.modal-right {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  min-height: 0;
}

.modal-header-info {
  padding: 24px 32px 16px;
  border-bottom: 1px solid #F0ECE6;
  flex-shrink: 0;
}

.product-title {
  font-size: 24px;
  font-weight: 700;
  color: #1E1E1E;
  margin: 0 0 8px;
  line-height: 1.3;
}

.product-desc {
  font-size: 14px;
  color: #6B655F;
  margin: 0 0 16px;
  line-height: 1.5;
}

.price-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-price {
  font-size: 22px;
  font-weight: 700;
  color: #8B5E3C;
}

.old-price {
  font-size: 14px;
  color: #A3A3A3;
  text-decoration: line-through;
}

.promo-tag {
  background: #FDF2E9;
  color: #C58B62;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 4px;
}

.modal-scroll-area {
  overflow-y: auto;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
  min-height: 0;
}

.config-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-row-split {
  display: flex;
  gap: 24px;
}

.config-row-split .config-group {
  flex: 1;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 4px;
}

.group-label {
  font-size: 11px;
  font-weight: 700;
  color: #A66A3F;
  letter-spacing: 0.1em;
}

.required-dot {
  color: #D9363E;
  font-size: 14px;
  line-height: 1;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip-btn {
  background: transparent;
  border: 1px solid #D6D2CC;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #1E1E1E;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.chip-btn:hover {
  border-color: #8B5E3C;
}

.chip-btn.active {
  background: #1E1E1E;
  border-color: #1E1E1E;
  color: #fff;
}

.chip-btn.active .chip-price {
  color: #D6D2CC;
}

.chip-price {
  font-size: 12px;
  color: #6B655F;
}

.small-chips .chip-btn {
  padding: 6px 12px;
  font-size: 13px;
}

.topping-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 8px;
}

.topping-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  min-height: 48px;
}

.topping-row.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.topping-label-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.topping-info-text {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.custom-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #1E1E1E;
  cursor: pointer;
  flex-shrink: 0;
}

.topping-name {
  font-size: 14px;
  color: #1E1E1E;
  font-weight: 500;
}

.topping-price {
  font-size: 13px;
  color: #6B655F;
}

.out-of-stock {
  font-size: 12px;
  color: #D9363E;
}

.qty-control {
  display: flex;
  align-items: center;
  gap: 12px;
  visibility: visible;
  opacity: 1;
}

.qty-control.is-hidden {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
}

.qty-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid #D6D2CC;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #1E1E1E;
  font-size: 16px;
  transition: all 0.2s;
}

.qty-btn:hover:not(:disabled) {
  border-color: #1E1E1E;
}

.qty-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.qty-num {
  font-size: 14px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.custom-textarea {
  width: 100%;
  border: 1px solid #D6D2CC;
  border-radius: 4px;
  padding: 12px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  min-height: 84px;
  max-height: 100px;
  background: transparent;
}

.custom-textarea:focus {
  outline: none;
  border-color: #8B5E3C;
}

.modal-footer {
  padding: 24px 32px;
  border-top: 1px solid #F0ECE6;
  display: flex;
  gap: 20px;
  align-items: center;
  background: #FFFDFC;
  flex-shrink: 0;
}

.drink-qty-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
}

.drink-qty-wrap .qty-btn {
  width: 36px;
  height: 36px;
}

.drink-qty-wrap .qty-num {
  font-size: 18px;
  min-width: 24px;
}

.add-to-cart-btn {
  flex: 1;
  background: #8B5E3C;
  color: #fff;
  border: none;
  height: 48px;
  border-radius: 4px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.add-to-cart-btn:hover {
  background: #A66A3F;
}

:deep(.ant-modal-content) {
  border-radius: 0;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.1);
}

@media (max-width: 768px) {
  :deep(.ant-modal) {
    width: 96vw !important;
  }
  :deep(.ant-modal-body) {
    height: 92vh !important;
  }
  .modal-layout {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  .modal-left {
    width: 100%;
    height: 220px;
    flex-shrink: 0;
  }
  .modal-right {
    display: flex;
    flex-direction: column;
    height: auto;
  }
  .modal-header-info, .modal-scroll-area, .modal-footer {
    padding: 20px;
  }
  .modal-scroll-area {
    overflow: visible;
  }
  .config-row-split {
    flex-direction: column;
  }
}

/* === Login Prompt Modal === */
.login-prompt-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 8px 0 4px;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.login-prompt-icon {
  font-size: 40px;
  line-height: 1;
}

.login-prompt-title {
  font-size: 16px;
  font-weight: 600;
  color: #1E1E1E;
}

.login-prompt-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.lp-btn {
  flex: 1;
  height: 44px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.lp-btn--primary {
  background: #8B5E3C;
  color: #fff;
}

.lp-btn--primary:hover {
  background: #A66A3F;
}

.lp-btn--ghost {
  background: transparent;
  color: #6B655F;
  border: 1px solid #D6D2CC;
}

.lp-btn--ghost:hover {
  border-color: #8B5E3C;
  color: #8B5E3C;
}
</style>
