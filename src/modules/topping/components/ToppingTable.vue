<template>
  <a-table :columns="columns" :data-source="data" :loading="loading" :pagination="false" rowKey="idTopping" bordered
    :row-class-name="() => 'clickable-row'" @row-click="(record: Topping) => $emit('viewLo', record)">
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
        <div style="display: flex; justify-content: center; align-items: center; gap: 8px;">
          <!-- Nút chính: Xem kho (Tất cả người dùng đều thấy) -->
          <a-button type="primary" ghost size="small" style="border-radius: 6px;" @click.stop="$emit('viewLo', record)">
            <template #icon>
              <DatabaseOutlined />
            </template>
            Xem kho
          </a-button>

          <!-- Nút 3 chấm xổ xuống menu (Chỉ ADMIN mới thấy) -->
          <a-dropdown v-if="isAdmin" :trigger="['click']" placement="bottomRight">
            <a-button size="small" style="border-radius: 6px; padding: 0 8px;" @click.stop>
              <MoreOutlined />
            </a-button>

            <template #overlay>
              <a-menu>
                <!-- Nút Chỉnh sửa -->
                <a-menu-item key="edit" @click="$emit('edit', record)">
                  <EditOutlined style="color: #1890ff; margin-right: 6px;" />
                  <span>Chỉnh sửa</span>
                </a-menu-item>

                <a-menu-divider />

                <!-- Nút Khóa / Mở khóa -->
                <a-menu-item key="toggle-lock" :danger="record.trangThai === 1"
                  @click="record.trangThai === 1 ? $emit('lock', record.idTopping) : $emit('unlock', record.idTopping)">
                  <LockOutlined v-if="record.trangThai === 1" style="margin-right: 6px;" />
                  <UnlockOutlined v-else style="color: #52c41a; margin-right: 6px;" />
                  <span>{{ record.trangThai === 1 ? 'Khóa topping' : 'Mở khóa' }}</span>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
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

import { computed } from 'vue';
import { useAuthStore } from "@/modules/auth/store/authStore";

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.role === "ADMIN");

const columns = [
  {
    title: "#", dataIndex: "idTopping", width: 70, align: "center" as const,
    customRender: ({ text }: { text: number }) => `TP0${String(text).padStart(2, '0')}`
  },
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
