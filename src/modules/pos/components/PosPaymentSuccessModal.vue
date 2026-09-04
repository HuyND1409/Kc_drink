<template>
  <a-modal
    :open="open"
    title="Hoàn tất đơn hàng"
    :mask-closable="false"
    :keyboard="false"
    :closable="false"
    @cancel="onClose"
    width="500px"
    class="payment-success-modal"
  >
    <template #footer>
      <div class="modal-footer-actions">
        <a-button @click="onPrint" type="default" size="large">
          In hóa đơn
        </a-button>
        <a-button type="primary" size="large" @click="onClose">
          Đóng
        </a-button>
      </div>
    </template>

    <div class="success-content" v-if="hoaDon">
      <div class="success-icon">
        <check-circle-filled style="color: #52c41a; font-size: 64px" />
      </div>
      <h3 class="success-title">Thanh toán thành công!</h3>

      <div class="info-card">
        <div class="info-row">
          <span class="info-label">Mã hóa đơn:</span>
          <span class="info-value fw-600">{{ hoaDon.maHoaDon }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Thành tiền:</span>
          <span class="info-value total-value">{{ formatVND(hoaDon.thanhTien ?? hoaDon.tongTien) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Phương thức:</span>
          <span class="info-value">{{ getPaymentMethodName(hoaDon.hinhThucThanhToan) }}</span>
        </div>
      </div>

      <div v-if="vanDon" class="info-card delivery-card">
        <h4 class="delivery-title">Thông tin giao hàng</h4>
        <div class="info-row">
          <span class="info-label">Mã vận đơn:</span>
          <span class="info-value tracking-code-row">
            <span class="tracking-code fw-600 text-primary">{{ vanDon.maVanDonGhn || 'Đang xử lý' }}</span>
            <a-button
              v-if="vanDon.maVanDonGhn"
              type="text"
              size="small"
              @click="onCopy(vanDon.maVanDonGhn)"
              class="btn-copy"
            >
              Sao chép
            </a-button>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Người nhận:</span>
          <span class="info-value">{{ vanDon.tenNguoiNhan }} - {{ vanDon.sdtNguoiNhan }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Địa chỉ:</span>
          <span class="info-value">{{ vanDon.diaChiGiaoHang }}</span>
        </div>
        <div class="info-row" v-if="vanDon.trangThaiGhn">
          <span class="info-label">Trạng thái:</span>
          <span class="info-value">{{ vanDon.trangThaiGhn }}</span>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { message } from "ant-design-vue";
import { CheckCircleFilled } from "@ant-design/icons-vue";
import type { HoaDon, VanDonGhnResponse } from "../types/pos";

const props = defineProps<{
  open: boolean;
  hoaDon: HoaDon | null;
  vanDon: VanDonGhnResponse | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const formatVND = (val: number) =>
  (val ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const getPaymentMethodName = (method?: string | null) => {
  if (method === "TIEN_MAT") return "Tiền mặt";
  if (method === "CHUYEN_KHOAN") return "Chuyển khoản QR";
  return method || "Chưa xác định";
};

const onCopy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    message.success("Đã sao chép mã vận đơn");
  } catch (err) {
    message.error("Lỗi khi sao chép");
  }
};

const onClose = () => {
  emit("close");
};

// ============================================================
// Helper escape HTML để chống XSS khi in
// ============================================================
const escapeHtml = (unsafe: string) => {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const onPrint = () => {
  if (!props.hoaDon) return;

  const hd = props.hoaDon;
  const vd = props.vanDon;
  const printWindow = window.open("", "_blank", "width=600,height=800");
  if (!printWindow) {
    message.warning("Vui lòng cho phép popup để in hóa đơn");
    return;
  }

  const now = new Date().toLocaleString("vi-VN");
  let deliveryHtml = "";

  if (vd) {
    deliveryHtml = `
      <div class="delivery-info">
        <h3>Thông tin giao hàng</h3>
        <p><strong>Mã vận đơn GHN:</strong> ${escapeHtml(vd.maVanDonGhn || '')}</p>
        <p><strong>Người nhận:</strong> ${escapeHtml(vd.tenNguoiNhan)} - ${escapeHtml(vd.sdtNguoiNhan)}</p>
        <p><strong>Địa chỉ:</strong> ${escapeHtml(vd.diaChiGiaoHang)}</p>
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Hóa đơn ${escapeHtml(hd.maHoaDon)}</title>
      <style>
        body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; }
        .receipt { max-width: 400px; margin: 0 auto; border: 1px dashed #000; padding: 20px; }
        .text-center { text-align: center; }
        .header h2 { margin: 0 0 10px; }
        .divider { border-top: 1px dashed #000; margin: 15px 0; }
        .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .total-row { font-size: 1.2em; font-weight: bold; margin-top: 10px; }
        .delivery-info { margin-top: 20px; border-top: 1px solid #000; padding-top: 10px; }
        .delivery-info h3 { margin-top: 0; font-size: 1.1em; }
        .delivery-info p { margin: 5px 0; }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header text-center">
          <h2>KC Drink</h2>
          <p>Hóa đơn bán hàng</p>
          <p>Thời gian: ${escapeHtml(now)}</p>
        </div>

        <div class="divider"></div>

        <div class="row">
          <span>Mã HĐ:</span>
          <span>${escapeHtml(hd.maHoaDon)}</span>
        </div>
        <div class="row">
          <span>Hình thức TT:</span>
          <span>${escapeHtml(getPaymentMethodName(hd.hinhThucThanhToan))}</span>
        </div>

        <div class="divider"></div>

        <div class="row total-row">
          <span>Thành tiền:</span>
          <span>${escapeHtml(formatVND(hd.thanhTien ?? hd.tongTien))}</span>
        </div>

        ${deliveryHtml}

        <div class="divider"></div>
        <div class="text-center">
          <p>Cảm ơn quý khách!</p>
          <p>Hẹn gặp lại</p>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, 250);
};
</script>

<style scoped>
.payment-success-modal .success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
}

.success-icon {
  margin-bottom: 16px;
}

.success-title {
  margin-top: 0;
  margin-bottom: 24px;
  color: #262626;
  font-size: 20px;
  font-weight: 600;
}

.info-card {
  width: 100%;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.delivery-card {
  background: #f0f5ff;
  border-color: #d6e4ff;
}

.delivery-title {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 14px;
  color: #1677ff;
  font-weight: 600;
  border-bottom: 1px solid #d6e4ff;
  padding-bottom: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #8c8c8c;
  font-size: 14px;
  min-width: 100px;
}

.info-value {
  color: #262626;
  font-size: 14px;
  text-align: right;
  word-break: break-word;
}

.total-value {
  font-size: 16px;
  font-weight: 700;
  color: #ff4d4f;
}

.fw-600 {
  font-weight: 600;
}

.text-primary {
  color: #1677ff;
}

.tracking-code-row {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.tracking-code {
  font-size: 15px;
}

.btn-copy {
  padding: 0 4px;
  height: 22px;
  line-height: 1;
}

.modal-footer-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}
</style>
