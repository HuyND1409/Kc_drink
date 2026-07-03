<template>
  <a-table :columns="columns" :data-source="data" :loading="loading" :pagination="false" rowKey="idNhanVien" bordered>
    <template #bodyCell="{ column, record }">

      <template v-if="column.key === 'chucVu'">
        <a-tag :color="record.chucVu === 'Quản lý'
          ? 'purple'
          : 'blue'">
          {{ record.chucVu }}
        </a-tag>
      </template>

      <template v-if="column.key === 'trangThai'">
        <a-tag :color="record.trangThai === 1
          ? 'success'
          : 'error'">
          {{
            record.trangThai === 1
              ? "Đang làm"
              : "Đã khóa"
          }}
        </a-tag>
      </template>

      <template v-if="column.key === 'action'">
        <a-dropdown trigger="click">
          <a-button type="text" shape="circle">
            <MoreOutlined />
          </a-button>

          <template #overlay>
            <a-menu>

              <a-menu-item :disabled="record.idTaiKhoan === currentUserId"
                :title="record.idTaiKhoan === currentUserId ? 'Vui lòng sang trang Thông tin cá nhân để sửa chính mình' : ''"
                @click="record.idTaiKhoan !== currentUserId && $emit('edit', record)">
                <EditOutlined />
                Sửa
              </a-menu-item>

              <a-menu-item v-if="record.trangThai === 1" danger :disabled="record.idTaiKhoan === currentUserId"
                :title="record.idTaiKhoan === currentUserId ? 'Không thể tự khóa tài khoản của chính mình' : ''"
                @click="record.idTaiKhoan !== currentUserId && $emit('lock', record.idNhanVien)">
                <LockOutlined />
                Khóa
              </a-menu-item>

              <a-menu-item v-else :disabled="record.idTaiKhoan === currentUserId"
                @click="record.idTaiKhoan !== currentUserId && $emit('unlock', record.idNhanVien)">
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
import type { NhanVien } from "../types/nhanVien";

import {
  MoreOutlined,
  EditOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons-vue";

// ĐÃ THÊM: currentUserId để nhận biết ai đang đăng nhập
defineProps<{
  data: NhanVien[];
  loading: boolean;
  currentUserId?: number;
}>();

defineEmits<{
  (e: "edit", record: NhanVien): void;
  (e: "lock", id: number): void;
  (e: "unlock", id: number): void;
}>();

const columns = [
  {
    title: "Tên nhân viên",
    dataIndex: "tenNhanVien",
    key: "tenNhanVien",
    width: 180,
  },
  {
    title: "Username",
    dataIndex: "username",
    key: "username",
    width: 150,
    align: "center",
  },
  {
    title: "SĐT",
    dataIndex: "sdt",
    key: "sdt",
    width: 140,
    align: "center",
  },
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
    width: 250,
    ellipsis: true,
  },
  {
    title: "Chức vụ",
    key: "chucVu",
    width: 120,
    align: "center",
  },
  {
    title: "Trạng thái",
    key: "trangThai",
    width: 130,
    align: "center",
  },
  {
    title: "Thao tác",
    key: "action",
    width: 80,
    align: "center",
  },
];
</script>

<style scoped>
:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 700;
  text-align: center;
}

:deep(.ant-table-cell) {
  vertical-align: middle;
}

:deep(.ant-table-row:hover td) {
  background: #f5faff !important;
}

:deep(.ant-tag) {
  border-radius: 6px;
  min-width: 70px;
  text-align: center;
  font-weight: 600;
}

:deep(.ant-btn) {
  border-radius: 6px;
}
</style>
