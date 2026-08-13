<template>
  <a-card title="Thanh toán QR payOS demo" style="max-width: 600px; margin: 0 auto">
    <a-form layout="vertical">
      <a-form-item label="Số tiền (VNĐ)">
        <a-input-number
          v-model:value="form.amount"
          :min="2000"
          :disabled="loading"
          style="width: 100%"
          :formatter="(value: number) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
          :parser="(value: string) => value.replace(/,/g, '')"
        />
      </a-form-item>

      <a-form-item label="Nội dung thanh toán">
        <a-input
          v-model:value="form.description"
          :disabled="loading"
          maxlength="25"
          show-count
        />
      </a-form-item>

      <a-form-item>
        <a-space>
          <a-button type="primary" :loading="loading" @click="handleCreate">
            {{ payment ? "Tạo lại mã QR" : "Tạo mã QR" }}
          </a-button>

          <a-button v-if="payment" :disabled="loading" @click="resetPayment">
            Làm mới
          </a-button>
        </a-space>
      </a-form-item>
    </a-form>

    <a-divider v-if="payment" />

    <div v-if="payment" style="text-align: center">
      <a-qrcode
        :value="payment.qrCode"
        :size="220"
        :status="payment.status === 'PAID' ? 'scanned' : 'active'"
        style="margin-bottom: 16px"
      />

      <a-alert
        v-if="payment.status === 'PAID'"
        message="Thanh toán thành công"
        description="KC Drink đã nhận được thanh toán."
        type="success"
        show-icon
        style="margin-bottom: 16px; text-align: left"
      />

      <a-descriptions bordered :column="1" size="small" style="margin-bottom: 16px">
        <a-descriptions-item label="Mã đơn hàng">
          {{ payment.orderCode }}
        </a-descriptions-item>

        <a-descriptions-item label="Số tiền">
          {{ formatCurrency(payment.amount) }}
        </a-descriptions-item>

        <a-descriptions-item label="Nội dung">
          {{ payment.description }}
        </a-descriptions-item>

        <a-descriptions-item label="Trạng thái">
          <a-tag :color="statusColor">
            {{ statusText }}
          </a-tag>
        </a-descriptions-item>
      </a-descriptions>

      <a-button
        type="default"
        :disabled="payment.status === 'PAID'"
        @click="openCheckout"
      >
        Mở trang thanh toán
      </a-button>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import { message, notification } from "ant-design-vue";
import {
  createPayOSPayment,
  getPayOSPayment,
  type PayOSCreateResponse,
} from "@/modules/payos/api/payosApi";

const form = ref({
  amount: 2000,
  description: "KC Drink demo",
});

const loading = ref(false);
const payment = ref<PayOSCreateResponse | null>(null);
let pollInterval: ReturnType<typeof setInterval> | null = null;
let pollingErrorCount = 0;

const statusText = computed(() => {
  switch (payment.value?.status) {
    case "PAID":
      return "Đã thanh toán";
    case "CANCELLED":
      return "Đã hủy";
    case "EXPIRED":
      return "Đã hết hạn";
    default:
      return "Chờ thanh toán";
  }
});

const statusColor = computed(() => {
  switch (payment.value?.status) {
    case "PAID":
      return "success";
    case "CANCELLED":
    case "EXPIRED":
      return "error";
    default:
      return "processing";
  }
});

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

function clearPoll() {
  if (pollInterval !== null) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

function validateForm() {
  if (!form.value.amount || form.value.amount < 2000) {
    message.warning("Số tiền thanh toán phải từ 2.000 VNĐ");
    return false;
  }

  if (!form.value.description.trim()) {
    message.warning("Vui lòng nhập nội dung thanh toán");
    return false;
  }

  return true;
}

function showSuccessNotification() {
  if (!payment.value) {
    return;
  }

  notification.success({
    message: "Thanh toán thành công",
    description: `KC Drink đã nhận ${formatCurrency(payment.value.amount)}. Mã giao dịch: ${payment.value.orderCode}`,
    placement: "topRight",
    duration: 6,
  });
}

function startPolling(orderCode: number) {
  clearPoll();
  pollingErrorCount = 0;

  pollInterval = setInterval(async () => {
    try {
      const res = await getPayOSPayment(orderCode);
      const status = res.data.data.status;

      if (!payment.value || payment.value.orderCode !== orderCode) {
        clearPoll();
        return;
      }

      payment.value.status = status;
      pollingErrorCount = 0;

      if (status === "PAID") {
        clearPoll();
        showSuccessNotification();
        return;
      }

      if (status === "CANCELLED" || status === "EXPIRED") {
        clearPoll();
        message.warning(
          status === "CANCELLED"
            ? "Giao dịch đã bị hủy"
            : "Mã thanh toán đã hết hạn"
        );
      }
    } catch {
      pollingErrorCount++;

      if (pollingErrorCount >= 3) {
        clearPoll();
        message.error("Không thể kiểm tra trạng thái thanh toán");
      }
    }
  }, 3000);
}

async function handleCreate() {
  if (!validateForm()) {
    return;
  }

  clearPoll();
  payment.value = null;
  loading.value = true;

  try {
    const request = {
      amount: Number(form.value.amount),
      description: form.value.description.trim(),
    };

    const res = await createPayOSPayment(request);

    if (!res.data.data?.qrCode || !res.data.data?.orderCode) {
      throw new Error("Dữ liệu thanh toán không hợp lệ");
    }

    payment.value = res.data.data;
    message.success("Tạo mã QR thành công");
    startPolling(payment.value.orderCode);
  } catch {
    message.error("Không thể tạo mã QR, vui lòng thử lại");
  } finally {
    loading.value = false;
  }
}

function resetPayment() {
  clearPoll();
  payment.value = null;
  pollingErrorCount = 0;
}

function openCheckout() {
  if (!payment.value?.checkoutUrl) {
    message.warning("Không tìm thấy đường dẫn thanh toán");
    return;
  }

  window.open(payment.value.checkoutUrl, "_blank", "noopener,noreferrer");
}

onUnmounted(() => {
  clearPoll();
});
</script>
