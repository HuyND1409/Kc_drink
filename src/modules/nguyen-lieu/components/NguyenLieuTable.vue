<template>
  <a-table
    :columns="columns"
    :data-source="data"
    :loading="loading"
    :pagination="false"
    rowKey="idNguyenLieu"
    bordered
    :row-class-name="() => 'clickable-row'"
    @row-click="(record: NguyenLieu) => $emit('viewLo', record)"
  >
    <template #bodyCell="{ column, record }">

      <!-- Đơn vị tính -->
      <template v-if="column.key === 'donViTinh'">
        <a-tag color="blue">{{ record.donViTinh }}</a-tag>
      </template>

      <!-- Tổng tồn kho -->
      <template v-if="column.key === 'tongTonKho'">
        <span style="font-weight: 600">
          {{ new Intl.NumberFormat('vi-VN').format(record.tongTonKho) }}
        </span>
        <span style="color: #8c8c8c; margin-left: 4px; font-size: 12px">
          {{ record.donViTinh }}
        </span>
        <a-tag v-if="record.tongTonKho <= 0" color="error" style="margin-left: 6px">
          Hết hàng
        </a-tag>
        <a-tag v-else-if="record.tongTonKho <= record.nguongTonKho" color="warning" style="margin-left: 6px">
          Sắp hết
        </a-tag>
      </template>

      <!-- Trạng thái -->
      <template v-if="column.key === 'trangThai'">
        <a-tag :color="record.trangThai === 1 ? 'success' : 'error'">
          {{ record.trangThai === 1 ? "Hoạt động" : "Đã khóa" }}
        </a-tag>
      </template>

      <!-- Thao tác -->
      <template v-if="column.key === 'action'">
        <div class="action-cell">
          <a-tooltip title="Xem lô hàng">
            <a-button
              type="primary"
              ghost
              size="small"
              @click.stop="$emit('viewLo', record)"
            >
              <template #icon><DatabaseOutlined /></template>
              Xem kho
            </a-button>
          </a-tooltip>

          <a-tooltip v-if="userRole === 'ADMIN'" :title="record.trangThai === 1 ? 'Khóa nguyên liệu' : 'Mở khóa nguyên liệu'">
            <a-button
              v-if="record.trangThai === 1"
              danger
              size="small"
              @click.stop="$emit('lock', record.idNguyenLieu)"
            >
              <template #icon><LockOutlined /></template>
              Khóa
            </a-button>
            <a-button
              v-else
              type="default"
              size="small"
              style="color: #52c41a; border-color: #52c41a;"
              @click.stop="$emit('unlock', record.idNguyenLieu)"
            >
              <template #icon><UnlockOutlined /></template>
              Mở khóa
            </a-button>
          </a-tooltip>
        </div>
      </template>

    </template>
  </a-table>
</template>

<script setup lang="ts">
import type { NguyenLieu } from "../types/nguyenLieu";
import { DatabaseOutlined, LockOutlined, UnlockOutlined } from "@ant-design/icons-vue";

defineProps<{
  data: NguyenLieu[];
  loading: boolean;
}>();

defineEmits<{
  (e: "viewLo", record: NguyenLieu): void;
  (e: "lock", id: number): void;
  (e: "unlock", id: number): void;
}>();

import { ref, onMounted } from 'vue';

const userRole = ref<string>('');

onMounted(() => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      userRole.value = user.role;
    } catch (e) {}
  }
});

const columns = [
  { title: "#", dataIndex: "idNguyenLieu", width: 70, align: "center" },
  { title: "Tên nguyên liệu", dataIndex: "tenNguyenLieu" },
  { title: "Đơn vị tính", key: "donViTinh", width: 150, align: "center" },
  { title: "Tổng tồn kho", key: "tongTonKho", width: 160, align: "center" },
  { title: "Trạng thái", key: "trangThai", width: 130, align: "center" },
  { title: "Thao tác", key: "action", width: 220, align: "center" },
];
</script>

<style scoped>
:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 700;
}

:deep(.ant-table-row:hover td) {
  background: #f0f9ff !important;
  cursor: pointer;
}

:deep(.ant-tag) {
  border-radius: 6px;
  padding: 2px 10px;
  font-weight: 600;
}

:deep(.ant-btn) {
  border-radius: 6px;
}

.action-cell {
  display: flex;
  justify-content: center;
  gap: 8px;
}
</style>
