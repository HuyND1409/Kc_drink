<template>
  <a-table :columns="columns" :data-source="data" :loading="loading" :pagination="false" rowKey="idDiaChi" bordered>
    <template #bodyCell="{ column, record }">

      <!-- Mặc định -->

      <template v-if="column.key === 'macDinh'">

        <a-tag :color="record.macDinh ? 'blue' : 'default'">
          {{ record.macDinh ? "🏠 Mặc định" : "-" }}
        </a-tag>

      </template>

      <!-- Trạng thái -->

      <template v-if="column.key === 'trangThai'">

        <a-tag :color="record.trangThai === 1 ? 'success' : 'error'">
          {{ record.trangThai === 1 ? "Đang dùng" : "Đã khóa" }}
        </a-tag>

      </template>

      <!-- Thao tác -->

      <template v-if="column.key === 'action'">

        <a-space>

          <a-button type="primary" ghost size="small" @click="$emit('edit', record)">
            Sửa
          </a-button>

          <a-button v-if="!record.macDinh && record.trangThai === 1" size="small" @click="$emit('default', record)">
            Đặt mặc định
          </a-button>

        </a-space>

      </template>

    </template>

  </a-table>
</template>

<script setup lang="ts">

import type { DiaChi } from "../types/diaChi";

defineProps<{

  data: DiaChi[];

  loading: boolean;

}>();

defineEmits<{

  (e: "edit", record: DiaChi): void;

  (e: "default", record: DiaChi): void;

}>();

const columns = [

  {
    title: "Người nhận",
    dataIndex: "tenNguoiNhan"
  },

  {
    title: "SĐT",
    dataIndex: "sdtNguoiNhan",
    width: 140
  },

  {
    title: "Địa chỉ",
    dataIndex: "diaChi"
  },

  {
    title: "Mặc định",
    key: "macDinh",
    width: 120
  },

  {
    title: "Trạng thái",
    key: "trangThai",
    width: 120
  },

  {
    title: "Thao tác",
    key: "action",
    width: 180
  }

];

</script>

<style scoped>
:deep(.ant-table-thead>tr>th) {

  background: #fafafa;

  font-weight: 700;

}

:deep(.ant-tag) {

  border-radius: 6px;

  padding: 2px 10px;

  font-weight: 600;

}
</style>
