<template>
  <a-drawer :open="open" :title="`📦 Lô hàng – ${topping?.tenTopping ?? ''}`" width="760" @close="$emit('close')">
    <!-- Header Drawer: Nút Nhập kho -->
    <template #extra>
      <a-button v-if="userRole === 'ADMIN'" type="primary" @click="openNhapKho = true">
        <template #icon>
          <PlusOutlined />
        </template>
        Nhập kho
      </a-button>
    </template>

    <!-- Bảng lô hàng (FEFO) -->
    <a-table :columns="loColumns" :data-source="dsLo" :loading="loadingLo" :pagination="false" rowKey="idLoTopping" bordered
      size="middle">
      <template #bodyCell="{ column, record }">

        <!-- Số lượng tồn -->
        <template v-if="column.key === 'soLuongTon'">
          <span style="font-weight: 600">
            {{ new Intl.NumberFormat('vi-VN').format(record.soLuongTon) }}
          </span>
          <span style="color: #8c8c8c; margin-left: 4px; font-size: 12px">
            Phần
          </span>
        </template>

        <!-- Hạn sử dụng -->
        <template v-if="column.key === 'hanSuDung'">
          <a-tag :color="getExpiryColor(record.hanSuDung)">
            {{ formatDate(record.hanSuDung) }}
          </a-tag>
          <a-tag v-if="isExpired(record.hanSuDung)" color="error" style="margin-left:4px">
            Hết hạn!
          </a-tag>
          <a-tag v-else-if="isExpiringSoon(record.hanSuDung)" color="warning" style="margin-left:4px">
            Sắp hết hạn
          </a-tag>
        </template>

        <!-- Ngày nhập -->
        <template v-if="column.key === 'ngayNhap'">
          <span style="color: #595959; font-size: 13px">
            {{ formatDateTime(record.ngayNhap) }}
          </span>
        </template>

      </template>
    </a-table>

    <!-- Phân trang lô -->
    <div style="display: flex; justify-content: flex-end; margin-top: 20px">
      <a-pagination :current="currentPage" :pageSize="pageSize" :total="total" show-size-changer
        :show-total="(t: number) => `Tổng ${t} lô`" @change="onPageChange" />
    </div>

    <!-- Modal Nhập kho -->
    <a-modal :open="openNhapKho" title="Nhập kho topping" ok-text="Nhập kho" cancel-text="Hủy"
      :confirm-loading="loadingNhap" width="480px" @ok="handleNhapKho" @cancel="closeNhapKho">
      <a-form ref="nhapKhoFormRef" :model="nhapKhoForm" :rules="nhapKhoRules" layout="vertical">

        <a-form-item label="Topping">
          <a-input :value="topping?.tenTopping" disabled />
        </a-form-item>

        <a-form-item label="Mã lô" name="maLo">
          <a-input v-model:value="nhapKhoForm.maLo" :disabled="isUpdate" placeholder="Nhập mã lô" />
        </a-form-item>

        <a-form-item label="Số lượng nhập" name="soLuongNhap">
          <a-input-number v-model:value="nhapKhoForm.soLuongNhap" :min="1" placeholder="Nhập số lượng"
            style="width: 100%" addon-after="Phần" />
        </a-form-item>

        <a-form-item label="Hạn sử dụng" name="hanSuDung">
          <a-date-picker v-model:value="nhapKhoForm.hanSuDung" style="width: 100%" format="DD/MM/YYYY"
            :disabledDate="disabledPastDate" placeholder="Chọn hạn sử dụng (không được trong quá khứ)" />
        </a-form-item>

      </a-form>
    </a-modal>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { message } from "ant-design-vue";
import type { FormInstance, Rule } from "ant-design-vue/es/form";
import type { AxiosError } from "axios";
import dayjs, { type Dayjs } from "dayjs";
import { PlusOutlined } from "@ant-design/icons-vue";

import type { Topping, LoTopping } from "../types/topping";
import { getLoTopping, createLoTopping } from "../api/toppingApi";
import { useAuthStore } from "@/modules/auth/store/authStore";

// ============================================================
// Props & Emits
// ============================================================
const props = defineProps<{
  open: boolean;
  topping?: Topping;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "success"): void;
}>();

const authStore = useAuthStore();

// ============================================================
// State: Quyền người dùng
// ============================================================
import { onMounted } from 'vue';
const userRole = ref<string>('');

onMounted(() => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      userRole.value = user.role;
    } catch (e) {}
  }
});

// ============================================================
// State: Danh sách lô
// ============================================================
const dsLo = ref<LoTopping[]>([]);
const loadingLo = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// ============================================================
// State: Form nhập kho
// ============================================================
const openNhapKho = ref(false);
const loadingNhap = ref(false);
const nhapKhoFormRef = ref<FormInstance>();

const isUpdate = ref(false);

const nhapKhoForm = reactive<{
  maLo: string;
  soLuongNhap: number | null;
  hanSuDung: Dayjs | null;
}>({
  maLo: "",
  soLuongNhap: null,
  hanSuDung: null,
});

// ============================================================
// Columns
// ============================================================
const loColumns = [
  { title: "#", dataIndex: "idLoTopping", width: 70, align: "center" as const },
  { title: "Mã lô", dataIndex: "maLo", width: 120, align: "center" as const },
  { title: "Số lượng tồn", key: "soLuongTon", width: 160, align: "center" as const },
  { title: "Hạn sử dụng (FEFO)", key: "hanSuDung", align: "center" as const },
  { title: "Ngày nhập", key: "ngayNhap", width: 180, align: "center" as const },
  { title: "Người nhập", dataIndex: "tenNhanVien", width: 150 },
];

// ============================================================
// Validation Rules
// ============================================================
const nhapKhoRules: Record<string, Rule[]> = {
  maLo: [
    { required: true, message: "Vui lòng nhập mã lô", trigger: "blur" },
  ],
  soLuongNhap: [
    { required: true, message: "Vui lòng nhập số lượng", trigger: "blur" },
    {
      validator: (_: Rule, value: number) => {
        if (!value || value < 1) {
          return Promise.reject("Số lượng phải lớn hơn 0");
        }
        return Promise.resolve();
      },
      trigger: "blur",
    },
  ],
  hanSuDung: [
    { required: true, message: "Vui lòng chọn hạn sử dụng", trigger: "change" },
  ],
};

// Không cho chọn ngày trong quá khứ
const disabledPastDate = (current: Dayjs) => {
  return current && current.isBefore(dayjs().startOf("day"));
};

// ============================================================
// Helpers
// ============================================================
const formatDate = (dateStr: string) => {
  return dayjs(dateStr).format("DD/MM/YYYY");
};

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "-";
  return dayjs(dateStr).format("DD/MM/YYYY HH:mm");
};

const isExpired = (dateStr: string) => {
  return dayjs(dateStr).isBefore(dayjs(), "day");
};

const isExpiringSoon = (dateStr: string) => {
  const diffDays = dayjs(dateStr).diff(dayjs(), "day");
  return diffDays >= 0 && diffDays <= 10;
};

/**
 * Trả về màu tag phù hợp theo yêu cầu:
 * - Còn hạn trên 30 ngày → success (xanh lá)
 * - Sắp hết hạn (dưới 10 ngày) → warning (cam)
 * - Hết hạn → error (đỏ)
 */
const getExpiryColor = (dateStr: string) => {
  if (isExpired(dateStr)) return "error";
  const diffDays = dayjs(dateStr).diff(dayjs(), "day");
  if (diffDays <= 10) return "warning";
  return "success";
};

// ============================================================
// Data Loading
// ============================================================
const loadLo = async () => {
  if (!props.topping) return;
  loadingLo.value = true;
  try {
    const res = await getLoTopping(
      props.topping.idTopping,
      currentPage.value - 1,
      pageSize.value
    );
    dsLo.value = res.data.data.content;
    total.value = res.data.data.totalElements;
  } finally {
    loadingLo.value = false;
  }
};

const onPageChange = (page: number, size: number) => {
  currentPage.value = page;
  pageSize.value = size;
  loadLo();
};

// ============================================================
// Nhập kho
// ============================================================
const closeNhapKho = () => {
  nhapKhoForm.maLo = "";
  nhapKhoForm.soLuongNhap = null;
  nhapKhoForm.hanSuDung = null;
  isUpdate.value = false;
  nhapKhoFormRef.value?.clearValidate();
  openNhapKho.value = false;
};

const handleNhapKho = async () => {
  try {
    await nhapKhoFormRef.value?.validate();
    loadingNhap.value = true;

    await createLoTopping({
      maLo: nhapKhoForm.maLo,
      idTopping: props.topping!.idTopping,
      soLuongNhap: nhapKhoForm.soLuongNhap!,
      hanSuDung: dayjs(nhapKhoForm.hanSuDung!).format("YYYY-MM-DD"),
      idNhanVien: authStore.user?.idNhanVien ?? 1,
    });

    message.success("Nhập kho thành công!");
    closeNhapKho();
    currentPage.value = 1;
    await loadLo();
    emit("success");
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    if (err.response?.status === 403) {
      message.error(err.response?.data?.message || "Bạn không có quyền thực hiện hành động này");
    } else if (err.response) {
      message.error(err.response?.data?.message || "Có lỗi xảy ra khi nhập kho");
    }
  } finally {
    loadingNhap.value = false;
  }
};

// ============================================================
// Watch: Khi Drawer mở (topping thay đổi) → load lô mới
// ============================================================
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.topping) {
      currentPage.value = 1;
      dsLo.value = [];
      loadLo();
    }
  }
);
</script>

<style scoped>
:deep(.ant-drawer-title) {
  font-size: 18px;
  font-weight: 700;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 700;
}

:deep(.ant-tag) {
  border-radius: 6px;
  padding: 2px 10px;
  font-weight: 600;
}

:deep(.ant-btn) {
  border-radius: 6px;
}

:deep(.ant-input),
:deep(.ant-select-selector),
:deep(.ant-picker),
:deep(.ant-input-number) {
  border-radius: 8px !important;
}

:deep(.ant-modal-title) {
  font-size: 18px;
  font-weight: 700;
}

:deep(.ant-form-item-label > label) {
  font-weight: 600;
}
</style>
