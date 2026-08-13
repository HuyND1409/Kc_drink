<template>
  <a-modal :open="open" title="Chi tiết khách hàng" :width="720" @cancel="closeModal">
    <div v-if="khachHang" class="detail-wrapper">
      <div class="detail-header">
        <div class="avatar">
          {{ khachHang.tenKhachHang?.charAt(0)?.toUpperCase() }}
        </div>

        <div class="header-info">
          <div class="customer-name">
            {{ khachHang.tenKhachHang }}
          </div>

          <div v-if="khachHang.username" class="username">
            @{{ khachHang.username }}
          </div>

          <div class="tags">
            <a-tag :color="khachHang.gioiTinh ? 'blue' : 'pink'">
              {{ khachHang.gioiTinh ? "Nam" : "Nữ" }}
            </a-tag>

            <a-tag :color="khachHang.trangThai === 1 ? 'success' : 'error'">
              {{ khachHang.trangThai === 1 ? "Hoạt động" : "Đã khóa" }}
            </a-tag>
          </div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-card">
          <div class="info-label">
            Số điện thoại
          </div>

          <div class="info-value">
            {{ khachHang.sdt || "Chưa cập nhật" }}
          </div>
        </div>

        <div class="info-card">
          <div class="info-label">
            Email
          </div>

          <div class="info-value email-value">
            {{ khachHang.email || "Chưa cập nhật" }}
          </div>
        </div>

        <div class="info-card">
          <div class="info-label">
            Giới tính
          </div>

          <div class="info-value">
            {{
              khachHang.gioiTinh === null ||
                khachHang.gioiTinh === undefined
                ? "Chưa cập nhật"
                : khachHang.gioiTinh
                  ? "Nam"
                  : "Nữ"
            }}
          </div>
        </div>

        <div class="info-card">
          <div class="info-label">
            Ngày sinh
          </div>

          <div class="info-value">
            {{ formatDate(khachHang.ngaySinh) }}
          </div>
        </div>

        <div class="info-card">
          <div class="info-label">
            Điểm tích lũy
          </div>

          <div class="info-value point-value">
            ⭐ {{ khachHang.diemTichLuy ?? 0 }}
          </div>
        </div>

        <div class="info-card">
          <div class="info-label">
            Trạng thái
          </div>

          <div class="info-value">
            {{ khachHang.trangThai === 1 ? "Hoạt động" : "Đã khóa" }}
          </div>
        </div>

        <div class="info-card full-width">
          <div class="info-label">
            Địa chỉ mặc định
          </div>

          <div class="info-value">
            {{ khachHang.diaChiMacDinh || "Chưa cập nhật" }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <a-button @click="closeModal">
        Đóng
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import type { KhachHang } from "../types/khachHang";

defineProps<{
  open: boolean;
  khachHang?: KhachHang;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
}>();

const closeModal = () => {
  emit("update:open", false);
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return value;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};
</script>

<style scoped>
.detail-wrapper {
  padding: 6px 2px 4px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 4px 4px 22px;
  margin-bottom: 22px;
  border-bottom: 1px solid #f0f0f0;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg,
      #36d1dc 0%,
      #5b86e5 100%);
  color: #ffffff;
  font-size: 28px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 6px 16px rgba(91, 134, 229, 0.28);
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.customer-name {
  font-size: 20px;
  font-weight: 700;
  color: #1f1f1f;
  line-height: 1.3;
}

.username {
  font-size: 14px;
  color: #8c8c8c;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-card {
  min-height: 76px;
  padding: 14px 16px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: box-shadow 0.2s ease;
}

.info-card:hover {
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.07);
}

.full-width {
  grid-column: 1 / -1;
}

.info-label {
  margin-bottom: 5px;
  font-size: 11px;
  font-weight: 600;
  color: #a0a0a0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  line-height: 1.5;
  word-break: break-word;
}

.email-value {
  color: #1677ff;
  word-break: break-all;
}

.point-value {
  color: #d48806;
}

:deep(.ant-modal-content) {
  border-radius: 14px;
  overflow: hidden;
}

:deep(.ant-modal-header) {
  padding: 20px 24px 14px;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.ant-modal-title) {
  font-size: 18px;
  font-weight: 700;
  color: #1f1f1f;
}

:deep(.ant-modal-body) {
  padding: 20px 24px 8px;
}

:deep(.ant-modal-footer) {
  padding: 14px 24px 20px;
  border-top: none;
}

:deep(.ant-tag) {
  min-width: 72px;
  margin-inline-end: 0;
  border-radius: 6px;
  text-align: center;
  font-weight: 600;
}

:deep(.ant-btn) {
  min-width: 76px;
  height: 36px;
  border-radius: 8px;
  font-weight: 500;
}

@media (max-width: 650px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }

  .detail-header {
    align-items: flex-start;
  }
}
</style>
