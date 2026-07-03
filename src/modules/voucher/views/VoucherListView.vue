<template>
  <a-card :bordered="false">

    <template #title>
      <span style="font-size:22px;font-weight:700">
        🎟️ Quản lý mã giảm giá (Voucher)
      </span>
    </template>

    <div class="toolbar">

      <div class="toolbar-left">
        <a-input-search v-model:value="keyword" placeholder="Nhập mã hoặc tên voucher..." allow-clear
          style="width:320px" @search="onSearch" />

        <a-select v-model:value="trangThai" placeholder="Trạng thái" allow-clear style="width:170px" @change="loadData">
          <a-select-option :value="1">Đang mở</a-select-option>
          <a-select-option :value="0">Đã khóa</a-select-option>
        </a-select>

        <a-tooltip title="Làm mới">
          <a-button shape="circle" @click="resetFilter">↻</a-button>
        </a-tooltip>
      </div>

      <div style="display: flex; gap: 12px;">
        <div style="display: flex; gap: 12px;">
        <a-button style="background: #52c41a; color: white" size="large" @click="handleTriggerBirthday">
          🎂 Quét Sinh Nhật
        </a-button>

        <a-button type="primary" size="large" @click="onAdd">
          + Thêm Voucher
        </a-button>
      </div>
      </div>
    </div>

    <VoucherTable :data="dsVoucher" :loading="loading" @edit="onEdit" @lock="onLock" @unlock="onUnlock" />

    <div style="display:flex; justify-content:flex-end; margin-top:20px;">
      <a-pagination :current="currentPage" :pageSize="pageSize" :total="total" show-size-changer
        :show-total="(total: number) => `Tổng ${total} voucher`" @change="onPageChange" />
    </div>

    <VoucherForm :open="openModal" :editData="editing" @close="handleCloseModal" @save="saveVoucher" />

  </a-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import type { AxiosError } from "axios";
import VoucherTable from "../components/VoucherTable.vue";
import VoucherForm from "../components/VoucherForm.vue";

import {
  getVoucher,
  createVoucher,
  lockVoucher,
  unlockVoucher,
  updateVoucher,
  triggerBirthday
} from "../api/voucherApi";

import type {
  Voucher,
  VoucherRequest,
} from "../types/voucher";

const dsVoucher = ref<Voucher[]>([]);
const loading = ref(false);
const openModal = ref(false);

const keyword = ref("");
const trangThai = ref<number>();
const currentPage = ref(1);
const pageSize = ref(5);
const total = ref(0);

const editing = ref<Voucher>();

const onAdd = () => {
  editing.value = undefined;
  openModal.value = true;
};

const onEdit = (record: Voucher) => {
  editing.value = { ...record };
  openModal.value = true;
};

const handleCloseModal = () => {
  editing.value = undefined;
  openModal.value = false;
};

const loadData = async () => {
  loading.value = true;
  try {
    const response = await getVoucher(
      keyword.value,
      trangThai.value,
      currentPage.value - 1,
      pageSize.value
    );
    dsVoucher.value = response.data.data.content;
    total.value = response.data.data.totalElements;
  } finally {
    loading.value = false;
  }
};

const saveVoucher = async (data: VoucherRequest) => {
  try {
    if (editing.value) {
      await updateVoucher(editing.value.idVoucher, data);
      message.success("Cập nhật mã giảm giá thành công");
    } else {
      await createVoucher(data);
      message.success("Thêm mới mã giảm giá thành công");
    }

    editing.value = undefined;
    openModal.value = false;
    await loadData();
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    message.error(err.response?.data?.message || "Có lỗi xảy ra");
  }
};

const onSearch = () => {
  currentPage.value = 1;
  loadData();
};

const onPageChange = (page: number, size: number) => {
  currentPage.value = page;
  pageSize.value = size;
  loadData();
};

const resetFilter = () => {
  keyword.value = "";
  trangThai.value = undefined;
  currentPage.value = 1;
  loadData();
};

const onLock = async (id: number) => {
  try {
    await lockVoucher(id);
    message.success("Đã khóa mã giảm giá");
    loadData();
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    message.error(err.response?.data?.message || "Có lỗi xảy ra");
  }
};

const onUnlock = async (id: number) => {
  try {
    await unlockVoucher(id);
    message.success("Đã mở khóa mã giảm giá");
    loadData();
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    message.error(err.response?.data?.message || "Có lỗi xảy ra");
  }
};

onMounted(() => {
  loadData();
});
const handleTriggerBirthday = async () => {
  try {
    loading.value = true;
    await triggerBirthday();
    message.success("Quét và gửi thư sinh nhật thành công!");
    await loadData(); // Tải lại bảng để thấy mã mới
  } catch (error) {
    message.error("Có lỗi xảy ra khi quét sinh nhật!");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.ant-card {
  border-radius: 12px;
}
</style>
