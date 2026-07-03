<template>
  <div class="shop-container">
    <h1>Chào mừng {{ auth.user?.tenNguoiDung }}</h1>
    <p>Điểm tích lũy của bạn: <b>{{ auth.user?.diemTichLuy }}</b></p>
    <a-button type="primary">Đặt trà sữa ngay</a-button>
  </div>
</template>
<script setup lang="ts">
import { useAuthStore } from "@/modules/auth/store/authStore";
const auth = useAuthStore();
</script>
