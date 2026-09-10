<template>
  <div class="user-layout">
    <header class="header">
      <div class="header-container">
        <div class="brand">
          <div class="brand-text">
            <div class="brand-name">KC Drink</div>
            <div class="brand-subtitle">Teahouse & Coffee</div>
          </div>
        </div>

        <nav class="nav-menu">
          <a href="#" class="nav-item" :class="{ active: isHomeActive }" @click.prevent="handleHomeClick">
            Trang chủ
          </a>

          <a href="/shop#products" class="nav-item">
            Sản phẩm
          </a>

          <a href="#" class="nav-item" :class="{ active: isOrdersActive }" @click.prevent="handleOrdersClick">
            Đơn hàng
          </a>

          <div class="nav-item cart-nav-item" @click="handleCartClick">
            <span class="cart-icon">🛒</span>
            <span>Giỏ hàng</span>
            <span class="cart-badge" v-if="cartStore.totalQuantity > 0">{{ cartStore.totalQuantity }}</span>
          </div>
        </nav>

        <div class="header-right">
          <!-- Đã đăng nhập: hiện dropdown tài khoản -->
          <a-dropdown v-if="auth.token" :trigger="['click']" placement="bottomRight">
            <div class="user-info user-info--clickable">
              <div class="avatar">
                {{ auth.user?.tenNguoiDung?.charAt(0)?.toUpperCase() || "K" }}
              </div>
              <div class="user-text">
                <span class="user-name">
                  {{ auth.user?.tenNguoiDung || "Khách hàng" }}
                </span>
                <span class="user-point">
                  {{ auth.user?.diemTichLuy ?? 0 }} điểm
                </span>
              </div>
            </div>

            <template #overlay>
              <a-menu class="account-dropdown-menu">
                <a-menu-item key="profile" @click="router.push('/profile')">
                  Thông tin cá nhân
                </a-menu-item>
                <a-menu-item key="change-password" @click="router.push('/change-password')">
                  Đổi mật khẩu
                </a-menu-item>
                <a-menu-item key="change-phone" @click="router.push('/change-phone')">
                  Đổi số điện thoại
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout" class="dropdown-logout" @click="handleLogout">
                  Đăng xuất
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>

          <!-- Chưa đăng nhập: hiện nút Đăng nhập -->
          <router-link v-else to="/shop/login" class="btn-login-header">Đăng nhập</router-link>
        </div>
      </div>
    </header>

    <main class="content">
      <router-view />
    </main>

    <!-- Modals & Drawers -->
    <GioHangDrawer 
      v-model:open="isDrawerOpen" 
      @open-checkout="handleOpenCheckout" 
    />
    <CheckoutFlowModal v-model:open="isCheckoutOpen" />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/modules/auth/store/authStore";
import { useGioHangOnlineStore } from "@/modules/ban-hang-online/store/gioHangOnlineStore";
import GioHangDrawer from "@/modules/ban-hang-online/components/GioHangDrawer.vue";
import CheckoutFlowModal from "@/modules/ban-hang-online/components/CheckoutFlowModal.vue";
import { useRouter, useRoute } from "vue-router";
import { ref, onMounted, onUnmounted, computed } from "vue";
import { onDataChanged } from "@/utils/appSync";

const auth = useAuthStore();
const cartStore = useGioHangOnlineStore();
const router = useRouter();
const route = useRoute();

const isHomeActive = computed(() => route.path === "/shop");
const isOrdersActive = computed(() => route.path.startsWith("/shop/orders"));

const handleHomeClick = () => {
  if (route.path === "/shop") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    router.push("/shop").then(() => {
      window.scrollTo(0, 0);
    });
  }
};

const handleOrdersClick = () => {
  if (!auth.token) {
    router.push("/shop/login");
    return;
  }
  router.push("/shop/orders");
};

const isDrawerOpen = ref(false);
const isCheckoutOpen = ref(false);

const handleOpenCart = () => {
  isDrawerOpen.value = true;
};

// Khi GioHangDrawer phát sự kiện open-checkout, kiểm tra đăng nhập trước
const handleOpenCheckout = () => {
  if (!auth.token) {
    router.push("/shop/login");
    return;
  }
  isCheckoutOpen.value = true;
};

const handleCartClick = () => {
  isDrawerOpen.value = true;
};

const handleLogout = () => {
  auth.logout();
  router.push("/shop");
};

let stopSync: (() => void) | null = null;

onMounted(async () => {
  if (auth.token) {
    await auth.fetchMe();
  }
  cartStore.loadCartForCurrentUser();

  stopSync = onDataChanged(async (type) => {
    if (type === "PROFILE_UPDATED") {
      await auth.fetchMe();
    }
  });

  window.addEventListener("open-cart", handleOpenCart);
});

onUnmounted(() => {
  stopSync?.();
  window.removeEventListener("open-cart", handleOpenCart);
});
</script>

<style scoped>
.user-layout {
  min-height: 100vh;
  background: #FAF8F5; /* Brand off-white/cream background */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #1E1E1E;
}

.header {
  height: 84px;
  background: #FAF8F5;
  border-bottom: 1px solid rgba(139, 94, 60, 0.1); /* Subtle brand color border */
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 32px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 24px;
  font-weight: 800;
  color: #8B5E3C;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.brand-subtitle {
  font-size: 11px;
  color: #A66A3F;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-top: 2px;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 40px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.nav-item {
  color: #6B655F;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  padding: 8px 0;
}

.nav-item:hover {
  color: #8B5E3C;
}

.nav-item.active {
  color: #8B5E3C;
  font-weight: 700;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: #8B5E3C;
  border-radius: 2px;
}

.cart-nav-item {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}
.cart-icon {
  font-size: 16px;
}
.cart-badge {
  background: #8B5E3C;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 2px;
}

.header-right {
  display: flex;
  align-items: center;
}

.btn-login-header {
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 20px;
  background: #8B5E3C;
  color: #fff;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s;
}

.btn-login-header:hover {
  background: #A66A3F;
  color: #fff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  border-radius: 40px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.user-info--clickable {
  cursor: pointer;
}

.user-info--clickable:hover {
  border-color: rgba(139, 94, 60, 0.2);
  background: rgba(139, 94, 60, 0.02);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #C58B62;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
}

.user-text {
  display: flex;
  flex-direction: column;
}

.user-name {
  color: #1E1E1E;
  font-size: 14px;
  font-weight: 600;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-point {
  color: #A66A3F;
  font-size: 12px;
  margin-top: 2px;
}

.account-dropdown-menu {
  border-radius: 12px;
  padding: 8px;
  min-width: 200px;
  border: 1px solid rgba(139, 94, 60, 0.1);
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}

.account-dropdown-menu :deep(.ant-dropdown-menu-item) {
  padding: 10px 16px;
  border-radius: 8px;
  color: #6B655F;
  font-weight: 500;
}

.account-dropdown-menu :deep(.ant-dropdown-menu-item:hover) {
  background: rgba(139, 94, 60, 0.05);
  color: #8B5E3C;
}

.dropdown-logout {
  color: #d9363e !important;
}

.dropdown-logout:hover {
  background: #fff1f0 !important;
  color: #d9363e !important;
}

.content {
  min-height: calc(100vh - 84px);
}

@media (max-width: 900px) {
  .nav-menu {
    position: static;
    transform: none;
    margin-left: auto;
    margin-right: 20px;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }
  .header-container {
    padding: 0 16px;
  }
  .user-text {
    display: none;
  }
  .user-info {
    padding: 4px;
  }
}
</style>
