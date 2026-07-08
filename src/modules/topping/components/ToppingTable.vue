<template>
  <a-table
    :columns="columns"
    :data-source="data"
    :loading="loading"
    :pagination="false"
    rowKey="idTopping"
    bordered
    :row-class-name="() => 'clickable-row'"
    @row-click="(record: Topping) => $emit('viewLo', record)"
  >
    <template #bodyCell="{ column, record }">
      <!-- Giá bán -->
      <template v-if="column.key === 'giaTopping'">
        <span class="price-cell">
          {{ formatCurrency(record.giaTopping) }}
        </span>
      </template>

      <!-- Tổng tồn kho -->
      <template v-if="column.key === 'tongTonKho'">
        <span style="font-weight: 600">
          {{ new Intl.NumberFormat('vi-VN').format(record.tongTonKho) }}
        </span>
        <span style="color: #8c8c8c; margin-left: 4px; font-size: 12px">
          Phần
        </span>
        <a-tag v-if="record.tongTonKho <= 0" color="error" style="margin-left: 6px">
          Hết hàng
        </a-tag>
        <a-tag v-else-if="record.tongTonKho <= 10" color="warning" style="margin-left: 6px">
          Sắp hết
        </a-tag>
      </template>

      <!-- Trạng thái -->
      <template v-if="column.key === 'trangThai'">
        <a-tag :color="record.trangThai === 1 ? 'success' : 'error'">
          {{ record.trangThai === 1 ? "Đang bán" : "Ngừng bán" }}
        </a-tag>
      </template>

      <!-- Hành động -->
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

          <a-tooltip v-if="userRole === 'ADMIN'" title="Chỉnh sửa">
            <a-button
              type="primary"
              ghost
              size="small"
              @click.stop="$emit('edit', record)"
            >
              <template #icon><EditOutlined /></template>
              Sửa
            </a-button>
          </a-tooltip>

          <a-tooltip v-if="userRole === 'ADMIN'" :title="record.trangThai === 1 ? 'Khóa topping' : 'Mở khóa topping'">
            <a-button
              v-if="record.trangThai === 1"
              danger
              size="small"
              @click.stop="$emit('lock', record.idTopping)"
            >
              <template #icon><LockOutlined /></template>
              Khóa
            </a-button>
            <a-button
              v-else
              type="default"
              size="small"
              style="color: #52c41a; border-color: #52c41a;"
              @click.stop="$emit('unlock', record.idTopping)"
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
import type { Topping } from "../types/topping";
import { DatabaseOutlined, EditOutlined, LockOutlined, UnlockOutlined } from "@ant-design/icons-vue";

defineProps<{
  data: Topping[];
  loading: boolean;
}>();

defineEmits<{
  (e: "viewLo", record: Topping): void;
  (e: "edit", record: Topping): void;
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
  { title: "#", dataIndex: "idTopping", width: 70, align: "center" as const },
  { title: "Tên Topping", dataIndex: "tenTopping" },
  { title: "Giá bán", key: "giaTopping", width: 160, align: "right" as const },
  { title: "Tổng tồn kho", key: "tongTonKho", width: 180, align: "center" as const },
  { title: "Trạng thái", key: "trangThai", width: 130, align: "center" as const },
  { title: "Thao tác", key: "action", width: 280, align: "center" as const },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};
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

.price-cell {
  font-weight: 600;
  color: #d46b08;
}
</style>
