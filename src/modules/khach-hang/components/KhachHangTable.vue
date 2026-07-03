<template>
  <a-table :columns="columns" :data-source="data" :loading="loading" :pagination="false" rowKey="idKhachHang" bordered>
    <template #bodyCell="{ column, record }">

      <!-- Giới tính -->
      <template v-if="column.key === 'gioiTinh'">
        <a-tag :color="record.gioiTinh ? 'blue' : 'pink'">
          {{ record.gioiTinh ? "Nam" : "Nữ" }}
        </a-tag>
      </template>

      <!-- Điểm -->
      <template v-if="column.key === 'diemTichLuy'">
        <a-tag color="gold">
          ⭐ {{ record.diemTichLuy }}
        </a-tag>
      </template>

      <!-- Địa chỉ -->
      <template v-if="column.key === 'diaChiMacDinh'">

        <a-tooltip :title="record.diaChiMacDinh">

          <span class="address">

            {{ record.diaChiMacDinh || "-" }}

          </span>

        </a-tooltip>

      </template>

      <!-- Trạng thái -->
      <template v-if="column.key === 'trangThai'">
        <a-tag :color="record.trangThai === 1 ? 'success' : 'error'">
          {{ record.trangThai === 1 ? "Hoạt động" : "Đã khóa" }}
        </a-tag>
      </template>

      <!-- Thao tác -->
      <template v-if="column.key === 'action'">

        <a-dropdown>

          <a-button>

            <MoreOutlined />

          </a-button>

          <template #overlay>

            <a-menu>

              <a-menu-item @click="$emit('edit', record)">
                <EditOutlined />
                Sửa
              </a-menu-item>

              <a-menu-item @click="$emit('address', record)">
                <HomeOutlined />
                Địa chỉ
              </a-menu-item>

              <a-menu-item v-if="record.trangThai === 1" danger @click="$emit('lock', record.idKhachHang)">
                <LockOutlined />
                Khóa
              </a-menu-item>

              <a-menu-item v-else @click="$emit('unlock', record.idKhachHang)">
                <UnlockOutlined />
                Mở khóa
              </a-menu-item>

            </a-menu>

          </template>

        </a-dropdown>

      </template>

    </template>

  </a-table>
</template>

<script setup lang="ts">
import type { KhachHang } from "../types/khachHang";
import {
  MoreOutlined,
  EditOutlined,
  HomeOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons-vue";

defineProps<{
  data: KhachHang[];
  loading: boolean;
}>();

defineEmits<{
  (e: "edit", record: KhachHang): void;
  (e: "address", record: KhachHang): void;
  (e: "lock", id: number): void;
  (e: "unlock", id: number): void;
}>();

const columns = [
  { title: "Tên khách hàng", dataIndex: "tenKhachHang", width: 180 },
  { title: "SĐT", dataIndex: "sdt", width: 130 },
  { title: "Email", dataIndex: "email", width: 240 },
  { title: "Địa chỉ mặc định", key: "diaChiMacDinh", width: 320 },
  { title: "Giới tính", key: "gioiTinh", width: 110, align: "center" },
  { title: "Điểm", key: "diemTichLuy", width: 100, align: "center" },
  { title: "Trạng thái", key: "trangThai", width: 120, align: "center" },
  { title: "Thao tác", key: "action", width: 80, align: "center" }
];
</script>

<style scoped>
:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 700;
}

:deep(.ant-table-row:hover td) {
  background: #f5faff !important;
}

:deep(.ant-tag) {
  border-radius: 6px;
  padding: 2px 10px;
  font-weight: 600;
}

:deep(.ant-btn) {
  border-radius: 6px;
}

.address {

  display: block;

  max-width: 280px;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;

}
</style>
