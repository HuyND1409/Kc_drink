<template>

  <a-layout-sider theme="dark" width="220">

    <div class="logo">

      ☕ KC Drink

    </div>

    <a-menu theme="dark" mode="inline">

      <a-menu-item key="1" @click="router.push('/')">
        Dashboard
      </a-menu-item>

      <a-menu-item key="pos" @click="router.push('/pos')">
        🛒 Bán hàng tại quầy
      </a-menu-item>

      <a-menu-item key="2" v-if="isAdmin" @click="router.push('/nhan-vien')">
        Nhân viên
      </a-menu-item>
      <a-menu-item key="3" @click="router.push('/khach-hang')">
        Khách hàng
      </a-menu-item>

      <a-menu-item key="4" @click="router.push('/san-pham')">
        Sản phẩm
      </a-menu-item>

      <a-menu-item key="hoa-don" @click="router.push('/hoa-don')">
        Hóa đơn
      </a-menu-item>

      <a-menu-item key="6" @click="router.push('/voucher')">
        Voucher
      </a-menu-item>
      <a-menu-item key="khuyen-mai" @click="router.push('/khuyen-mai')">
        Khuyến mãi
      </a-menu-item>
      <a-sub-menu key="sub-kho">
        <template #title>
          🧪 Kho & Nguyên liệu
        </template>
        <a-menu-item key="7" @click="router.push('/nguyen-lieu')">
          Quản lý nguyên liệu
        </a-menu-item>
        <a-menu-item key="8" @click="router.push('/topping')">
          Quản lý topping
        </a-menu-item>
        <a-menu-item key="ban-thanh-pham" @click="router.push('/ban-thanh-pham')">
          Bán thành phẩm
        </a-menu-item>
      </a-sub-menu>
      <a-menu-item key="nhat-ky-he-thong" v-if="isAdmin" @click="router.push('/nhat-ky-he-thong')">
        📋 Nhật ký thao tác
      </a-menu-item>
    </a-menu>

  </a-layout-sider>

</template>

<style scoped>
.logo {

  height: 64px;

  display: flex;

  justify-content: center;

  align-items: center;

  color: white;

  font-size: 22px;

  font-weight: bold;

}
</style>
<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/modules/auth/store/authStore";

const router = useRouter();
const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.role === "ADMIN");
</script>
