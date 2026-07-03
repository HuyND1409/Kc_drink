<template>
  <a-layout-header class="header">
    <div class="header-content">
      <div class="datetime-container">
        <span class="datetime-item">
          <CalendarOutlined class="icon" /> {{ currentDate }}
        </span>
        <span class="divider">|</span>
        <span class="datetime-item">
          <ClockCircleOutlined class="icon" /> {{ currentTime }}
        </span>
      </div>

      <div class="right-actions">
        <a-dropdown :trigger="['click']">
          <div class="user-info" style="cursor: pointer;">
            <a-avatar size="small" class="avatar">
              {{ (auth.user?.tenNguoiDung || auth.user?.username)?.charAt(0)?.toUpperCase() || 'U' }}
            </a-avatar>
            <span class="username">
              Xin chào, <strong>{{ auth.user?.tenNguoiDung || auth.user?.username }}</strong>
            </span>
          </div>
          <template #overlay>
            <a-menu>
              <a-menu-item @click="router.push('/profile')">
                <template #icon>
                  <UserOutlined />
                </template>
                Thông tin cá nhân
              </a-menu-item>

              <a-menu-item @click="router.push('/change-password')">
                <template #icon>
                  <SettingOutlined />
                </template>
                Đổi mật khẩu
              </a-menu-item>

              <a-menu-divider />

              <a-menu-item @click="logout" danger>
                <template #icon>
                  <LogoutOutlined />
                </template>
                Đăng xuất
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>
  </a-layout-header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/modules/auth/store/authStore";
import {
  CalendarOutlined, ClockCircleOutlined, LogoutOutlined,
  SettingOutlined, UserOutlined // ĐÃ THÊM: Import thêm icon UserOutlined ở đây
} from "@ant-design/icons-vue";

const router = useRouter();
const auth = useAuthStore();

// Logic ngày giờ giữ nguyên
const currentDate = ref("");
const currentTime = ref("");
let timer: ReturnType<typeof setInterval>;
const updateDateTime = () => {
  const now = new Date();
  currentDate.value = now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });
  currentTime.value = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};
onMounted(() => { updateDateTime(); timer = setInterval(updateDateTime, 1000); });
onUnmounted(() => { clearInterval(timer); });

const logout = () => {
  auth.logout();
  router.push("/login");
};
</script>

<style scoped>
/* Giữ nguyên toàn bộ style cũ của bạn */
.header {
  background: #ffffff;
  padding: 0 24px;
  border-bottom: 1px solid #f0f0f0;
  height: 64px;
  display: flex;
  align-items: center;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.datetime-container {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #595959;
  font-size: 14px;
}

.datetime-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon {
  color: #8c8c8c;
}

.divider {
  color: #e8e8e8;
}

.right-actions {
  display: flex;
  gap: 20px;
  align-items: center;
}

.user-info {
  display: flex;
  gap: 8px;
  align-items: center;
  color: #333;
}

.avatar {
  background-color: #1677ff;
}

.username {
  font-size: 14px;
}
</style>
