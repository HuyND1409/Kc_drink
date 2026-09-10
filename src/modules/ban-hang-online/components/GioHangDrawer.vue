<template>
  <a-drawer
    :open="open"
    @close="handleClose"
    placement="right"
    :width="drawerWidth"
    class="gio-hang-drawer brand-drawer"
    :headerStyle="{ display: 'none' }"
    :bodyStyle="{ padding: '0', display: 'flex', flexDirection: 'column', background: '#FFFDFC' }"
  >
    <!-- Custom Header -->
    <div class="drawer-header">
      <div class="header-left">
        <h2 class="drawer-title">Giỏ hàng</h2>
        <p class="drawer-subtitle">{{ cartStore.totalQuantity }} món đã chọn</p>
      </div>
      <button class="close-btn" @click="handleClose">✕</button>
    </div>

    <!-- Empty State -->
    <div v-if="cartStore.items.length === 0" class="empty-cart">
      <div class="empty-visual">🧋</div>
      <h3>Giỏ hàng trống</h3>
      <p>Bạn chưa thêm thức uống nào vào giỏ.</p>
      <button class="shop-now-btn" @click="goToProducts">Tiếp tục chọn món</button>
    </div>

    <!-- Cart Content -->
    <div v-else class="cart-content">
      <div class="cart-scroll-area">
        <div v-for="(item, index) in cartStore.items" :key="item.id" class="cart-item-wrap">
          <div class="cart-item">
            <div class="item-thumbnail">
              <img
                v-if="item.hinhAnh"
                :src="getSanPhamImageUrl(item.hinhAnh)"
                :alt="item.tenSanPham"
              />
              <div v-else class="fallback-icon">🧋</div>
            </div>
            
            <div class="item-details">
              <div class="item-name-row">
                <h4 class="item-name">{{ item.tenSanPham }}</h4>
                <span class="item-price">{{ formatCurrency(calcItemTotal(item)) }}</span>
              </div>
              
              <div class="item-meta">
                <span>Size {{ item.tenSize }}</span>
                <span class="meta-dot">·</span>
                <span>Đường {{ item.mucDuong }}%</span>
                <span class="meta-dot">·</span>
                <span>Đá {{ item.mucDa }}%</span>
              </div>
              
              <div class="item-note" v-if="item.ghiChu">Ghi chú: {{ item.ghiChu }}</div>

              <div class="item-toppings" v-if="item.toppings.length > 0">
                <div class="topping-label">TOPPING TỔNG CHO {{ item.soLuong }} LY:</div>
                <div v-for="topping in item.toppings" :key="topping.idTopping" class="topping-line">
                  <span class="topping-name">{{ topping.tenTopping }}</span>
                  <div class="qty-control compact">
                    <button class="qty-btn" @click="updateToppingQty(item, topping.idTopping, topping.soLuong - 1)" :disabled="topping.soLuong <= 1">-</button>
                    <span class="qty-num">{{ topping.soLuong }}</span>
                    <button class="qty-btn" @click="updateToppingQty(item, topping.idTopping, topping.soLuong + 1)">+</button>
                  </div>
                </div>
              </div>
              
              <div class="item-bottom-actions">
                <div class="drink-qty-control">
                  <span class="qty-label">Số lượng:</span>
                  <div class="qty-control">
                    <button class="qty-btn" @click="updateQty(item, item.soLuong - 1)" :disabled="item.soLuong <= 1">-</button>
                    <span class="qty-num">{{ item.soLuong }}</span>
                    <button class="qty-btn" @click="updateQty(item, item.soLuong + 1)">+</button>
                  </div>
                </div>
                <button class="remove-btn" @click="removeItem(item)">Xóa</button>
              </div>
            </div>
          </div>
          <div class="item-divider" v-if="index < cartStore.items.length - 1"></div>
        </div>
      </div>

      <!-- Footer -->
      <div class="cart-footer">
        <div class="total-row">
          <span class="total-label">Tạm tính</span>
          <span class="total-value">{{ formatCurrency(cartStore.estimatedTotal) }}</span>
        </div>
        <p class="shipping-note">Phí giao hàng và ưu đãi sẽ được tính ở bước tiếp theo.</p>
        
        <button class="checkout-btn" @click="handleCheckout">
          Tiến hành đặt hàng
        </button>
      </div>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { useGioHangOnlineStore } from "@/modules/ban-hang-online/store/gioHangOnlineStore";
import type { GioHangOnlineItem } from "@/modules/ban-hang-online/types/banHangOnline";
import { getSanPhamImageUrl } from "@/modules/san-pham/api/sanPhamApi";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits(["update:open", "open-checkout"]);

const router = useRouter();
const cartStore = useGioHangOnlineStore();

const drawerWidth = ref(440);

const updateWidth = () => {
  drawerWidth.value = window.innerWidth < 460 ? window.innerWidth : 440;
};

onMounted(() => {
  updateWidth();
  window.addEventListener('resize', updateWidth);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateWidth);
});

const handleClose = () => {
  emit("update:open", false);
};

const goToProducts = async () => {
  handleClose();
  
  if (router.currentRoute.value.path !== '/shop') {
    await router.push('/shop');
  } else {
    const el = document.getElementById("products");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const calcItemTotal = (item: GioHangOnlineItem) => {
  const drinkTotal = item.giaSanPhamHienThi * item.soLuong;
  const toppingTotal = item.toppings.reduce((sum, t) => sum + (t.giaTopping * t.soLuong), 0);
  return drinkTotal + toppingTotal;
};

const updateQty = (item: GioHangOnlineItem, newQty: number) => {
  if (newQty < 1) return;
  cartStore.updateDrinkQuantity(item.id, newQty);
};

const updateToppingQty = (item: GioHangOnlineItem, toppingId: number, newQty: number) => {
  if (newQty < 1) return;
  cartStore.updateToppingQuantity(item.id, toppingId, newQty);
};

const removeItem = (item: GioHangOnlineItem) => {
  cartStore.removeItem(item.id);
};

const handleCheckout = () => {
  if (cartStore.items.length === 0) {
    message.warning("Giỏ hàng đang trống");
    return;
  }
  handleClose();
  emit("open-checkout");
};
</script>

<style scoped>
.brand-drawer {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #1E1E1E;
}

.drawer-header {
  padding: 32px 32px 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #F0ECE6;
}

.drawer-title {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 700;
  color: #1E1E1E;
}

.drawer-subtitle {
  margin: 0;
  font-size: 13px;
  color: #6B655F;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  color: #1E1E1E;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Empty State */
.empty-cart {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.empty-visual {
  font-size: 64px;
  opacity: 0.2;
  margin-bottom: 24px;
}

.empty-cart h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1E1E1E;
  margin-bottom: 8px;
}

.empty-cart p {
  font-size: 14px;
  color: #6B655F;
  margin-bottom: 32px;
}

.shop-now-btn {
  background: transparent;
  border: 1px solid #1E1E1E;
  color: #1E1E1E;
  padding: 12px 32px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.shop-now-btn:hover {
  background: #1E1E1E;
  color: #fff;
}

/* Cart Content */
.cart-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cart-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 0 32px;
}

.cart-item-wrap {
  display: flex;
  flex-direction: column;
}

.cart-item {
  display: flex;
  gap: 16px;
  padding: 24px 0;
}

.item-thumbnail {
  width: 72px;
  height: 72px;
  border-radius: 4px;
  background: #EAE6DF;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fallback-icon {
  font-size: 32px;
  opacity: 0.2;
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-name-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
  gap: 12px;
}

.item-name {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1E1E1E;
  line-height: 1.3;
}

.item-price {
  font-size: 15px;
  font-weight: 700;
  color: #1E1E1E;
  white-space: nowrap;
}

.item-meta {
  font-size: 13px;
  color: #6B655F;
  margin-bottom: 4px;
}

.meta-dot {
  margin: 0 4px;
  color: #D6D2CC;
}

.item-note {
  font-size: 13px;
  color: #8B5E3C;
  font-style: italic;
  margin-bottom: 8px;
}

.item-toppings {
  margin-top: 12px;
  padding: 12px;
  background: #F9F8F6;
  border-radius: 4px;
}

.topping-label {
  font-size: 10px;
  font-weight: 700;
  color: #A66A3F;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.topping-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.topping-line:last-child {
  margin-bottom: 0;
}

.topping-name {
  font-size: 13px;
  color: #1E1E1E;
}

.qty-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid #D6D2CC;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #1E1E1E;
  font-size: 14px;
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
  font-size: 13px;
  font-weight: 600;
  min-width: 16px;
  text-align: center;
}

.compact .qty-btn {
  width: 20px;
  height: 20px;
  font-size: 12px;
}

.item-bottom-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.drink-qty-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qty-label {
  font-size: 13px;
  color: #6B655F;
}

.remove-btn {
  background: transparent;
  border: none;
  color: #6B655F;
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.remove-btn:hover {
  color: #D9363E;
}

.item-divider {
  height: 1px;
  background: #F0ECE6;
  width: 100%;
}

/* Footer */
.cart-footer {
  padding: 24px 32px;
  border-top: 1px solid #F0ECE6;
  background: #FFFDFC;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 8px;
}

.total-label {
  font-size: 16px;
  font-weight: 600;
  color: #1E1E1E;
}

.total-value {
  font-size: 24px;
  font-weight: 700;
  color: #8B5E3C;
}

.shipping-note {
  font-size: 12px;
  color: #6B655F;
  margin: 0 0 20px;
}

.checkout-btn {
  width: 100%;
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

.checkout-btn:hover {
  background: #A66A3F;
}

@media (max-width: 480px) {
  .drawer-header {
    padding: 24px 20px 16px;
  }
  .cart-scroll-area, .cart-footer {
    padding-left: 20px;
    padding-right: 20px;
  }
}
</style>
