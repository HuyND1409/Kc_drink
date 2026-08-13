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

              <a-menu-item @click="openDetail(record)">
                <EyeOutlined />
                Xem chi tiết
              </a-menu-item>

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

  <a-modal
    v-model:open="detailVisible"
    :width="720"
    :bodyStyle="{ padding: '0' }"
    class="nv-detail-modal"
  >
    <template #title>
      <span class="nv-modal-title">Chi tiết nhân viên</span>
    </template>

    <div v-if="detailRecord" class="nv-detail-body">
      <!-- Header: Avatar + tên + username + tags -->
      <div class="nv-detail-header">
        <div class="nv-avatar">
          {{ detailRecord.tenNhanVien?.charAt(0)?.toUpperCase() }}
        </div>
        <div class="nv-header-info">
          <div class="nv-header-name">{{ detailRecord.tenNhanVien }}</div>
          <div class="nv-header-username">@{{ detailRecord.username }}</div>
          <div class="nv-header-tags">
            <a-tag :color="detailRecord.chucVu === 'Quản lý' ? 'purple' : 'blue'">
              {{ detailRecord.chucVu }}
            </a-tag>
            <a-tag :color="detailRecord.trangThai === 1 ? 'success' : 'error'">
              {{ detailRecord.trangThai === 1 ? 'Đang làm' : 'Đã khóa' }}
            </a-tag>
          </div>
        </div>
      </div>

      <!-- Grid 2 cột thông tin -->
      <div class="nv-info-grid">
        <div class="nv-info-card">
          <div class="nv-info-label">Số điện thoại</div>
          <div class="nv-info-value">{{ detailRecord.sdt || 'Chưa cập nhật' }}</div>
        </div>
        <div class="nv-info-card">
          <div class="nv-info-label">Email</div>
          <div class="nv-info-value nv-info-value--email">{{ detailRecord.email || 'Chưa cập nhật' }}</div>
        </div>
        <div class="nv-info-card">
          <div class="nv-info-label">Giới tính</div>
          <div class="nv-info-value">
            {{
              detailRecord.gioiTinh === null || detailRecord.gioiTinh === undefined
                ? 'Chưa cập nhật'
                : detailRecord.gioiTinh ? 'Nam' : 'Nữ'
            }}
          </div>
        </div>
        <div class="nv-info-card">
          <div class="nv-info-label">Ngày sinh</div>
          <div class="nv-info-value">{{ formatDate(detailRecord.ngaySinh) }}</div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="nv-modal-footer">
        <a-button @click="detailVisible = false">Đóng</a-button>
      </div>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { NhanVien } from "../types/nhanVien";

import {
  MoreOutlined,
  EditOutlined,
  LockOutlined,
  UnlockOutlined,
  EyeOutlined,
} from "@ant-design/icons-vue";

const formatDate = (val?: string | null): string => {
  if (!val) return 'Chưa cập nhật';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const detailVisible = ref(false);
const detailRecord = ref<NhanVien | null>(null);
const openDetail = (record: NhanVien) => {
  detailRecord.value = record;
  detailVisible.value = true;
};

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
/* ===== Table styles (giữ nguyên) ===== */
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

/* ===== Modal chi tiết nhân viên ===== */
:deep(.nv-detail-modal .ant-modal-content) {
  border-radius: 14px;
  overflow: hidden;
  padding: 0;
}

:deep(.nv-detail-modal .ant-modal-header) {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 0;
}

:deep(.nv-detail-modal .ant-modal-body) {
  padding: 0;
}

:deep(.nv-detail-modal .ant-modal-footer) {
  padding: 0;
  border-top: none;
}

.nv-modal-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: 0.01em;
}

/* Header section */
.nv-detail-body {
  padding: 24px;
}

.nv-detail-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 20px;
}

.nv-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 28px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
  letter-spacing: 0;
  user-select: none;
}

.nv-header-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nv-header-name {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.2;
}

.nv-header-username {
  font-size: 13px;
  color: #8c8c8c;
  font-weight: 400;
}

.nv-header-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

/* Info grid */
.nv-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.nv-info-card {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: box-shadow 0.2s;
}

.nv-info-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
}

.nv-info-label {
  font-size: 11.5px;
  font-weight: 600;
  color: #adb5bd;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.nv-info-value {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  word-break: break-word;
}

.nv-info-value--email {
  font-size: 13px;
  color: #3a86ff;
  word-break: break-all;
}

/* Footer */
.nv-modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 24px 16px;
  border-top: 1px solid #f0f0f0;
}

/* Responsive: 1 cột khi màn hình nhỏ */
@media (max-width: 600px) {
  .nv-info-grid {
    grid-template-columns: 1fr;
  }

  .nv-detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }
}
</style>
