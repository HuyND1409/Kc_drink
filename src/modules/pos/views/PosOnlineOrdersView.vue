<template>
  <div class="pos-online-orders-view">
    <PosOnlineOrders />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import PosOnlineOrders from "../components/PosOnlineOrders.vue";

const pageTitle = ref("Đơn hàng online");
document.title = pageTitle.value;
</script>

<style scoped>
.pos-online-orders-view {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
  padding: 16px;
}


</style>
