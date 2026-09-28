<template>

  <a-layout-sider theme="dark" width="220">

    <div class="logo">

      ☕ KC Drink

    </div>

    <a-menu theme="dark" mode="inline" v-model:selectedKeys="selectedKeys">

      <a-menu-item key="1" @click="router.push('/')">
        Thống kê
      </a-menu-item>

      <a-menu-item key="pos" @click="router.push('/pos')">
        🛒 Bán hàng tại quầy
      </a-menu-item>

      <a-menu-item key="pos-online-orders" @click="router.push('/pos/online-orders')">
        <div class="online-order-menu-label">
          <span>🌐 Đơn hàng online</span>
          <a-badge v-if="pendingOnlineOrders > 0" :count="pendingOnlineOrders" :overflow-count="99" />
        </div>
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
          Thành Phần Sản Phẩm
        </template>
        <a-menu-item key="7" @click="router.push('/nguyen-lieu')">
          Nguyên liệu
        </a-menu-item>
        <a-menu-item key="8" @click="router.push('/topping')">
          Topping
        </a-menu-item>
        <a-menu-item key="ban-thanh-pham" @click="router.push('/ban-thanh-pham')">
          Nguyên liệu nền
        </a-menu-item>
      </a-sub-menu>
      <!-- <a-menu-item key="nhat-ky-he-thong" v-if="isAdmin" @click="router.push('/nhat-ky-he-thong')">
        📋 Nhật ký thao tác
      </a-menu-item> -->
    </a-menu>

  </a-layout-sider>

</template>

<style scoped>
.online-order-menu-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}

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
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { getDashboard } from "@/modules/dashboard/api/dashboardApi";
import { onDataChanged } from "@/utils/appSync";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.role === "ADMIN");

const selectedKeys = ref<string[]>([]);
const pendingOnlineOrders = ref(0);

const loadPendingOnlineOrders = async () => {
  try {
    const res = await getDashboard();
    pendingOnlineOrders.value = res.data.data?.donChoTiepNhan ?? 0;
  } catch (error) {
    console.error("Không thể tải số đơn online chờ tiếp nhận:", error);
  }
};

let cleanupAppSync: (() => void) | null = null;

onMounted(() => {
  loadPendingOnlineOrders();
  cleanupAppSync = onDataChanged((type) => {
    if (
      type === "ONLINE_ORDER_UPDATED" ||
      type === "GHN_UPDATED" ||
      type === "HOA_DON_UPDATED" ||
      type === "APP_REVALIDATE"
    ) {
      loadPendingOnlineOrders();
    }
  });
});

onUnmounted(() => {
  if (cleanupAppSync) cleanupAppSync();
});

watch(
  () => route.path,
  (path) => {
    if (path === "/pos/online-orders") {
      selectedKeys.value = ["pos-online-orders"];
    } else if (path === "/pos") {
      selectedKeys.value = ["pos"];
    } else if (path === "/") {
      selectedKeys.value = ["1"];
    } else if (path === "/nhan-vien") {
      selectedKeys.value = ["2"];
    } else if (path === "/khach-hang") {
      selectedKeys.value = ["3"];
    } else if (path === "/san-pham") {
      selectedKeys.value = ["4"];
    } else if (path === "/hoa-don") {
      selectedKeys.value = ["hoa-don"];
    } else if (path === "/voucher") {
      selectedKeys.value = ["6"];
    } else if (path === "/khuyen-mai") {
      selectedKeys.value = ["khuyen-mai"];
    } else if (path === "/nguyen-lieu") {
      selectedKeys.value = ["7"];
    } else if (path === "/topping") {
      selectedKeys.value = ["8"];
    } else if (path === "/ban-thanh-pham") {
      selectedKeys.value = ["ban-thanh-pham"];
    } else if (path === "/nhat-ky-he-thong") {
      selectedKeys.value = ["nhat-ky-he-thong"];
    }
  },
  { immediate: true }
);
</script>
