<template>

  <a-layout-sider theme="dark" width="220">

    <div class="logo">

      ☕ KC Drink

    </div>

    <a-menu theme="dark" mode="inline">

      <a-menu-item key="1">
        Dashboard
      </a-menu-item>

      <a-menu-item key="2" @click="router.push('/nhan-vien')">
        Nhân viên
      </a-menu-item>
      <a-menu-item key="3" @click="router.push('/khach-hang')">
        Khách hàng
      </a-menu-item>

      <a-menu-item key="4">
        Sản phẩm
      </a-menu-item>

      <a-menu-item key="5">
        Hóa đơn
      </a-menu-item>

      <a-menu-item key="6" @click="router.push('/voucher')">
        Voucher
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
      </a-sub-menu>
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
import { useRouter } from "vue-router";

const router = useRouter();
</script>
