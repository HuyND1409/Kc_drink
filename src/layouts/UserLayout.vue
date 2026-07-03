<template>
  <div class="user-layout">
    <header class="header">
      <h2>KC Drink Online</h2>
      <a-button @click="handleLogout" type="text" danger>Đăng xuất</a-button>
    </header>
    <main class="content">
      <router-view /> </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/modules/auth/store/authStore";
import { useRouter } from "vue-router";
const auth = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  auth.logout();
  router.push("/login");
};
</script>
<style scoped>
.header { display: flex; justify-content: space-between; padding: 20px; background: #fff; border-bottom: 1px solid #eee; }
.content { padding: 20px; }
</style>
