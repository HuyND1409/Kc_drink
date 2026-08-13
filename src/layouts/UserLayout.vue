<template>
  <div class="user-layout">
    <header class="header">
      <div class="brand">
        <div class="brand-icon">☕</div>

        <div class="brand-text">
          <div class="brand-name">KC Drink</div>
          <div class="brand-subtitle">Trà sữa ngon mỗi ngày</div>
        </div>
      </div>

      <nav class="nav-menu">
        <router-link to="/shop" class="nav-item">
          Trang chủ
        </router-link>

        <a href="#products" class="nav-item">
          Sản phẩm
        </a>

        <router-link to="/shop/orders" class="nav-item">
          Đơn hàng
        </router-link>
      </nav>

      <div class="header-right">
        <a-dropdown :trigger="['click']" placement="bottomRight">
          <div class="user-info user-info--clickable">
            <div class="avatar">
              {{
                auth.user?.tenNguoiDung
                  ?.charAt(0)
                  ?.toUpperCase() || "K"
              }}
            </div>

            <div class="user-text">
              <span class="user-name">
                {{ auth.user?.tenNguoiDung || "Khách hàng" }}
              </span>

              <span class="user-point">
                ⭐ {{ auth.user?.diemTichLuy ?? 0 }} điểm
              </span>
            </div>
          </div>

          <template #overlay>
            <a-menu class="account-dropdown-menu">
              <a-menu-item key="profile" @click="router.push('/profile')">
                👤 Thông tin cá nhân
              </a-menu-item>
              <a-menu-item key="change-password" @click="router.push('/change-password')">
                🔑 Đổi mật khẩu
              </a-menu-item>
              <a-menu-item key="change-phone" @click="router.push('/change-phone')">
                📱 Đổi số điện thoại đăng nhập
              </a-menu-item>
              <a-menu-divider />
              <a-menu-item key="logout" class="dropdown-logout" @click="handleLogout">
                🚪 Đăng xuất
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </header>

    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/modules/auth/store/authStore";
import { useRouter } from "vue-router";
import { onMounted, onUnmounted } from "vue";
import { onDataChanged } from "@/utils/appSync";

const auth = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  auth.logout();
  router.push("/login");
};

let stopSync: (() => void) | null = null;

onMounted(async () => {
  if (auth.token) {
    await auth.fetchMe();
  }

  stopSync = onDataChanged(async (type) => {
    if (type === "PROFILE_UPDATED") {
      await auth.fetchMe();
    }
  });
});

onUnmounted(() => {
  stopSync?.();
});
</script>

<style scoped>
.user-layout {
  min-height: 100vh;
  background: #f7f8fa;
}

.header {
  height: 72px;
  padding: 0 32px;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid #f0f0f0;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;

  position: sticky;
  top: 0;
  z-index: 100;

  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.brand-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;

  background: #fff7e6;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 23px;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 19px;
  font-weight: 800;
  color: #1f2937;
}

.brand-subtitle {
  margin-top: 1px;
  font-size: 11px;
  color: #8c8c8c;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.nav-item {
  padding: 8px 13px;

  border-radius: 8px;

  color: #595959;
  font-size: 14px;
  font-weight: 500;

  text-decoration: none;

  transition: all 0.2s ease;
}

.nav-item:hover {
  color: #1677ff;
  background: #f0f5ff;
}

.router-link-active.nav-item {
  color: #1677ff;
  background: #e6f4ff;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 9px;
}

.avatar {
  width: 38px;
  height: 38px;

  border-radius: 50%;

  background: linear-gradient(135deg,
      #36d1dc,
      #5b86e5);

  color: white;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 16px;
  font-weight: 700;
}

.user-text {
  display: flex;
  flex-direction: column;
}

.user-name {
  max-width: 170px;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  color: #262626;
  font-size: 13px;
  font-weight: 600;
}

.user-point {
  margin-top: 1px;
  color: #d48806;
  font-size: 11px;
}

.user-info--clickable {
  cursor: pointer;
  border-radius: 8px;
  padding: 4px 8px;
  transition: background 0.2s ease;
}

.user-info--clickable:hover {
  background: #f5f5f5;
}

.dropdown-logout {
  color: #ff4d4f !important;
}

.content {
  padding: 20px;
}

@media (max-width: 900px) {
  .nav-menu {
    display: none;
  }

  .brand-subtitle {
    display: none;
  }
}

@media (max-width: 600px) {
  .header {
    padding: 0 16px;
  }

  .user-text {
    display: none;
  }

  .content {
    padding: 12px;
  }
}
</style>
