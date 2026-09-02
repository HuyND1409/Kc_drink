<template>
  <a-modal
    :open="open"
    title="Áp dụng voucher"
    :footer="null"
    width="520px"
    @cancel="$emit('close')"
    :destroyOnClose="true"
  >
    <div class="voucher-picker">
      <!-- Nhập mã voucher thủ công — giữ nguyên -->
      <a-input
        v-model:value="maVoucher"
        placeholder="Nhập mã voucher"
        allow-clear
        @pressEnter="onApply"
      />
      <div class="actions">
        <a-button @click="$emit('close')">Hủy</a-button>
        <a-button type="primary" :loading="loading" @click="onApply">Áp dụng</a-button>
      </div>

      <!-- Danh sách voucher khả dụng -->
      <template v-if="idHoaDon">
        <a-divider style="margin: 8px 0">Voucher khả dụng</a-divider>

        <a-spin :spinning="voucherLoading">
          <div v-if="voucherKhaDung.length === 0 && !voucherLoading" class="empty-text">
            Không có voucher khả dụng
          </div>

          <div v-else class="voucher-list">
            <div
              v-for="(voucher, index) in voucherKhaDung"
              :key="voucher.idVoucher"
              class="voucher-card"
            >
              <div class="voucher-card__header">
                <span class="voucher-code">{{ voucher.maVoucher }}</span>
                <div class="voucher-tags">
                  <!-- Tag "Ưu đãi tốt nhất" chỉ hiển thị cho phần tử đầu tiên của page 1 -->
                  <a-tag v-if="currentPage === 1 && index === 0" color="gold">Ưu đãi tốt nhất</a-tag>
                  <!-- Tag "Voucher riêng" nếu idKhachHang khác null -->
                  <a-tag v-if="voucher.idKhachHang != null" color="purple">Voucher riêng</a-tag>
                  <!-- Tag "Đang áp dụng" nếu trùng với voucher hiện tại của hóa đơn -->
                  <a-tag v-if="voucher.maVoucher === currentVoucherCode" color="green">Đang áp dụng</a-tag>
                </div>
              </div>

              <div class="voucher-card__name">{{ voucher.tenVoucher }}</div>

              <div class="voucher-card__info">
                <span class="voucher-type">
                  {{ voucher.loaiVoucher === 'PHAN_TRAM' ? 'Giảm %' : 'Giảm tiền' }}
                </span>
                <span class="voucher-save">
                  Tiết kiệm: <strong>{{ formatCurrency(voucher.soTienGiam) }}</strong>
                </span>
              </div>

              <div class="voucher-card__conditions">
                <span v-if="voucher.dieuKien != null" class="condition-text">
                  Đơn tối thiểu: {{ formatCurrency(voucher.dieuKien) }}
                </span>
                <span v-if="voucher.ngayKetThuc != null" class="expire-text">
                  HSD: {{ formatDate(voucher.ngayKetThuc) }}
                </span>
              </div>

              <a-button
                type="primary"
                size="small"
                class="voucher-card__apply-btn"
                :disabled="voucher.maVoucher === currentVoucherCode"
                @click="onApplyFromList(voucher.maVoucher)"
              >
                Áp dụng
              </a-button>
            </div>
          </div>
        </a-spin>

        <!-- Phân trang -->
        <a-pagination
          v-if="totalElements > 0"
          :current="currentPage"
          :page-size="pageSize"
          :total="totalElements"
          :show-size-changer="false"
          size="small"
          style="margin-top: 12px; text-align: center"
          @change="onPageChange"
        />
      </template>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { message } from "ant-design-vue";
import { getVoucherKhaDung } from "../api/posApi";
import type { VoucherKhaDung } from "../types/pos";

const props = defineProps<{
  open: boolean;
  loading?: boolean;
  idHoaDon?: number;
  currentVoucherCode?: string | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "apply", payload: { maVoucher: string }): void;
}>();

// ─── State nhập mã (giữ nguyên) ───────────────────────────────
const maVoucher = ref("");

// ─── State danh sách voucher khả dụng ─────────────────────────
const voucherKhaDung = ref<VoucherKhaDung[]>([]);
const voucherLoading = ref(false);
const currentPage = ref(1);   // Ant Design pagination: bắt đầu từ 1
const totalElements = ref(0);
const pageSize = 5;

// ─── Gọi API danh sách voucher khả dụng ───────────────────────
const loadVoucherKhaDung = async () => {
  if (!props.idHoaDon) return;
  voucherLoading.value = true;
  try {
    // FE page bắt đầu từ 1, BE page bắt đầu từ 0 → trừ 1 khi gửi lên
    const res = await getVoucherKhaDung(props.idHoaDon, currentPage.value - 1, pageSize);
    const data = res.data.data;
    voucherKhaDung.value = data.content ?? [];
    totalElements.value = data.totalElements ?? 0;
  } catch {
    voucherKhaDung.value = [];
    totalElements.value = 0;
  } finally {
    voucherLoading.value = false;
  }
};

// ─── Khi modal mở hoặc idHoaDon thay đổi: reset về page 1 rồi load ─
watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      maVoucher.value = "";
      currentPage.value = 1;
      loadVoucherKhaDung();
    }
  }
);

watch(
  () => props.idHoaDon,
  () => {
    if (props.open) {
      currentPage.value = 1;
      loadVoucherKhaDung();
    }
  }
);

// ─── Đổi trang ────────────────────────────────────────────────
const onPageChange = (page: number) => {
  currentPage.value = page;
  loadVoucherKhaDung();
};

// ─── Áp dụng từ input thủ công (giữ nguyên logic cũ) ─────────
const onApply = () => {
  const code = maVoucher.value.trim();
  if (!code) {
    message.warning("Vui lòng nhập mã voucher");
    return;
  }
  emit("apply", { maVoucher: code });
};

// ─── Áp dụng từ danh sách — dùng chung event "apply" ─────────
const onApplyFromList = (ma: string) => {
  emit("apply", { maVoucher: ma });
};

// ─── Helpers hiển thị ─────────────────────────────────────────
const formatCurrency = (value: number | null | undefined) => {
  if (value == null) return "";
  return value.toLocaleString("vi-VN") + "₫";
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN");
};
</script>

<style scoped>
.voucher-picker {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.empty-text {
  text-align: center;
  color: #999;
  padding: 16px 0;
}

.voucher-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 360px;
  overflow-y: auto;
}

.voucher-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 10px 12px;
  background: #fafafa;
  position: relative;
}

.voucher-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.voucher-code {
  font-weight: 700;
  font-size: 14px;
  color: #1677ff;
  letter-spacing: 0.5px;
}

.voucher-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.voucher-card__name {
  font-size: 13px;
  color: #333;
  margin-bottom: 6px;
}

.voucher-card__info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  margin-bottom: 4px;
}

.voucher-type {
  background: #e6f4ff;
  color: #1677ff;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.voucher-save {
  color: #555;
}

.voucher-card__conditions {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #888;
  margin-bottom: 6px;
}

.voucher-card__apply-btn {
  width: 100%;
}
</style>
