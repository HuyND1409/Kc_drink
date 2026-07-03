<template>
  <a-table :columns="columns" :data-source="data" :loading="loading" :pagination="false" rowKey="idVoucher" bordered>
    <template #bodyCell="{ column, record }">

      <template v-if="column.key === 'mucGiam'">
        <span v-if="!record.giaTriGiam">
          <a-tag color="default">Chưa thiết lập</a-tag>
        </span>
        <a-tag v-else color="volcano" style="font-size: 14px; font-weight: bold;">
          {{ record.loaiVoucher === 'PERCENT' ? record.giaTriGiam + '%' : formatCurrency(record.giaTriGiam) }}
        </a-tag>
      </template>

      <template v-if="column.key === 'dieuKien'">
        <span style="font-weight: 500; color: #1890ff;">
          Từ {{ formatCurrency(record.dieuKien) }}
        </span>
      </template>

      <template v-if="column.key === 'loaiMa'">
        <a-tag :color="record.idKhachHang ? 'cyan' : 'purple'">
          {{ record.idKhachHang ? `Cá nhân (ID: ${record.idKhachHang})` : "Mã dùng chung" }}
        </a-tag>
      </template>

      <template v-if="column.key === 'thoiGian'">
        <div style="font-size: 13px;">
          <div><span style="color: #52c41a;">Bắt đầu:</span> {{ formatDate(record.ngayBatDau) }}</div>
          <div><span style="color: #f5222d;">Kết thúc:</span> {{ formatDate(record.ngayKetThuc) }}</div>
        </div>
      </template>

      <template v-if="column.key === 'trangThai'">
        <a-tag v-if="record.ngayKetThuc && new Date(record.ngayKetThuc).getTime() < new Date().getTime()"
          color="default" style="color: #8c8c8c; background: #f5f5f5;">
          Đã hết hạn
        </a-tag>
        <a-tag v-else-if="record.trangThai === 0" color="error">
          Đã khóa
        </a-tag>
        <a-tag v-else color="success">
          Đang mở
        </a-tag>
      </template>

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

              <a-menu-item v-if="record.trangThai === 1" danger @click="$emit('lock', record.idVoucher)">
                <LockOutlined />
                Khóa mã
              </a-menu-item>

              <a-menu-item v-else @click="$emit('unlock', record.idVoucher)">
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
import type { Voucher } from "../types/voucher";
import {
  MoreOutlined,
  EditOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons-vue";

defineProps<{
  data: Voucher[];
  loading: boolean;
}>();

defineEmits<{
  (e: "edit", record: Voucher): void;
  (e: "lock", id: number): void;
  (e: "unlock", id: number): void;
}>();

// Đã fix lỗi TypeScript: Cho phép value nhận null hoặc undefined
const formatCurrency = (value?: number | null) => {
  if (!value) return "0 đ";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
};

// Đã fix lỗi TypeScript: Cho phép dateString nhận null hoặc undefined
const formatDate = (dateString?: string | null) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN") + " " + date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
};

// Cấu hình các cột của bảng
const columns = [
  { title: "Mã", dataIndex: "maVoucher", width: 120 },
  { title: "Tên chương trình", dataIndex: "tenVoucher", width: 200 },
  { title: "Mức giảm", key: "mucGiam", width: 120, align: "center" },
  { title: "Điều kiện", key: "dieuKien", width: 150 },
  { title: "SL", dataIndex: "soLuong", width: 80, align: "center" },
  { title: "Loại mã", key: "loaiMa", width: 150, align: "center" },
  { title: "Thời gian áp dụng", key: "thoiGian", width: 220 },
  { title: "Trạng thái", key: "trangThai", width: 110, align: "center" },
  { title: "Thao tác", key: "action", width: 90, align: "center" }
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
</style>
