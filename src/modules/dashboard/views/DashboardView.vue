<template>
  <a-card :bordered="false" class="custom-card">
    <template #title>
      <span class="card-title">
        📊 Tổng quan hệ thống
      </span>
    </template>

    <div class="dashboard-content">
      <h3 class="welcome-text">
        Xin chào, <span class="highlight-user">{{ auth.user?.tenNguoiDung || 'Admin' }}</span> 👋
      </h3>

      <div class="role-badge-wrapper">
        <span>Quyền hạn:</span>
        <a-tag color="blue" class="role-badge">
          {{ auth.user?.role || 'Chưa xác định' }}
        </a-tag>
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/modules/auth/store/authStore";

const auth = useAuthStore();
</script>

<style scoped>
/* Đồng bộ 100% với style của trang Nhân viên */
.custom-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  background: #ffffff;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f1f1f;
  letter-spacing: -0.5px;
}

.dashboard-content {
  padding: 8px 0;
}

.welcome-text {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 16px;
}

.highlight-user {
  color: #1890ff; /* Màu xanh đặc trưng Ant Design giống nút Tìm kiếm/Reload */
}

.role-badge-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #595959;
}

.role-badge {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}
</style>
