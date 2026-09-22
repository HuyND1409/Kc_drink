<template>
  <a-drawer :open="open" :title="`📦 Lô hàng – ${topping?.tenTopping ?? ''}`" width="850" @close="$emit('close')">
    <!-- Header Drawer: Nút Import Excel & Nhập kho -->
    <template #extra>
      <div style="display: flex; gap: 8px;">
        <!-- Thẻ Input File ẩn -->
        <input ref="fileInputRef" type="file" accept=".xlsx" style="display: none" @change="handleFileUpload" />

        <!-- Nút Import Excel -->
        <a-tooltip title="Excel: A(Mã lô), B(ID Topping), C(Số lượng), D(Hạn SD), E(Đơn giá - tùy chọn). Dòng 1 là tiêu đề.">
          <a-button v-if="isAdmin" :loading="loadingImport" style="background-color: #217346; color: #fff; border-color: #217346;" @click="triggerFileInput">
            <template #icon>
              <FileExcelOutlined />
            </template>
            Import Excel
          </a-button>
        </a-tooltip>

        <!-- Nút Nhập kho thủ công cũ -->
        <a-button v-if="isAdmin" type="primary" @click="openNhapKho = true">
          <template #icon>
            <PlusOutlined />
          </template>
          Nhập kho
        </a-button>
      </div>
    </template>

    <!-- Bảng lô hàng (FEFO) -->
    <a-table :columns="loColumns" :data-source="dsLo" :loading="loadingLo" :pagination="false" rowKey="idLoTopping"
      bordered size="middle">
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

        <!-- ➕ Trạng thái Lô Topping -->
        <template v-if="column.key === 'trangThai'">
          <a-tag :color="record.trangThai === 1 || record.trangThai === null ? 'success' : 'error'">
            {{ record.trangThai === 1 || record.trangThai === null ? 'Đang Bán' : 'Đã khóa' }}
          </a-tag>
        </template>

        <!-- Đơn giá nhập -->
        <template v-if="column.key === 'donGiaNhap'">
          <span v-if="record.donGiaNhap == null" style="color: #8c8c8c; font-style: italic">Chưa ghi nhận</span>
          <span v-else style="font-weight: 600">
            {{ new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(record.donGiaNhap) }}&nbsp;đ
          </span>
        </template>

        <!-- ➕ Thao tác Khóa / Mở khóa -->
        <template v-if="column.key === 'action'">
          <div style="display: flex; justify-content: center; align-items: center;">
            <a-button v-if="record.trangThai === 1 || record.trangThai === null" type="primary" danger ghost
              size="small" style="border-radius: 6px; font-size: 12px;" @click="openLockConfirm(record)">
              <template #icon>
                <LockOutlined />
              </template>
              Khóa
            </a-button>

            <a-button v-else size="small"
              style="color: #52c41a; border-color: #b7eb8f; background: #f6ffed; border-radius: 6px; font-size: 12px;"
              @click="openUnlockConfirm(record)">
              <template #icon>
                <UnlockOutlined />
              </template>
              Mở khóa
            </a-button>
          </div>
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

        <a-form-item label="Đơn giá nhập" name="donGiaNhap">
          <a-input-number v-model:value="nhapKhoForm.donGiaNhap" :min="0" :precision="2"
            placeholder="Để trống nếu chưa ghi nhận" style="width: 100%"
            addon-after="VNĐ/phần" />
        </a-form-item>

      </a-form>
    </a-modal>

    <!-- ➕ Modal Xác nhận Khóa / Mở khóa (Căn giữa màn hình, hiển thị đẹp chuẩn UI) -->
    <a-modal v-model:open="openConfirm"
      :title="confirmType === 'lock' ? `Xác nhận khóa lô [${selectedLo?.maLo}]` : `Mở khóa lô [${selectedLo?.maLo}]`"
      :ok-text="confirmType === 'lock' ? 'Khóa lô' : 'Mở khóa'" :ok-type="confirmType === 'lock' ? 'danger' : 'primary'"
      cancel-text="Hủy" :confirm-loading="loadingConfirm" centered width="440px" @ok="handleConfirmSubmit">
      <div style="display: flex; align-items: flex-start; gap: 12px; padding: 12px 0;">
        <ExclamationCircleFilled
          :style="{ fontSize: '22px', color: confirmType === 'lock' ? '#ff4d4f' : '#52c41a', marginTop: '2px' }" />
        <div>
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #262626;">
            {{ confirmType === 'lock' ? 'Tạm dừng tính tồn kho lô này?' : 'Mở lại trạng thái hoạt động?' }}
          </p>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #595959;">
            {{ confirmType === 'lock'
              ? `Số lượng tồn (${selectedLo?.soLuongTon ?? 0} phần) sẽ tạm thời bị trừ khỏi Tổng tồn kho.`
              : `Số lượng tồn (${selectedLo?.soLuongTon ?? 0} phần) sẽ được cộng trả lại vào Tổng tồn kho.`
            }}
          </p>
        </div>
      </div>
    </a-modal>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted, onUnmounted } from "vue";
import { message } from "ant-design-vue";
import type { FormInstance, Rule } from "ant-design-vue/es/form";
import type { AxiosError } from "axios";
import dayjs, { type Dayjs } from "dayjs";
import {
  PlusOutlined,
  LockOutlined,
  UnlockOutlined,
  ExclamationCircleFilled,
  FileExcelOutlined,
} from "@ant-design/icons-vue";
import type { Topping, LoTopping } from "../types/topping";
import {
  getLoTopping,
  createLoTopping,
  lockLoToppingApi,
  unlockLoToppingApi,
  importLoToppingApi,
} from "../api/toppingApi";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { onDataChanged } from "@/utils/appSync";

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
  (e: "refreshMainList"): void;
}>();

const authStore = useAuthStore();

// ============================================================
// State: Quyền người dùng
// ============================================================
const isAdmin = computed(() => authStore.user?.role === "ADMIN");

// ============================================================
// State: Danh sách lô
// ============================================================
const dsLo = ref<LoTopping[]>([]);
const loadingLo = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// ============================================================
// State: Import Excel
// ============================================================
const fileInputRef = ref<HTMLInputElement | null>(null);
const loadingImport = ref(false);

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
  donGiaNhap: number | null;
}>({
  maLo: "",
  soLuongNhap: null,
  hanSuDung: null,
  donGiaNhap: null,
});

// ============================================================
// State: Modal xác nhận Khóa / Mở khóa
// ============================================================
const openConfirm = ref(false);
const confirmType = ref<'lock' | 'unlock'>('lock');
const selectedLo = ref<LoTopping | null>(null);
const loadingConfirm = ref(false);

// ============================================================
// Columns (Đã bổ sung cột Trạng thái & Thao tác)
// ============================================================
const loColumns = computed(() => {
  const baseCols = [
    { title: "#", dataIndex: "idLoTopping", width: 60, align: "center" as const },
    { title: "Mã lô", dataIndex: "maLo", width: 110, align: "center" as const },
    { title: "Số lượng tồn", key: "soLuongTon", width: 140, align: "center" as const },
    { title: "Đơn giá nhập", key: "donGiaNhap", width: 140, align: "right" as const },
    { title: "Hạn sử dụng (FEFO)", key: "hanSuDung", align: "center" as const },
    { title: "Ngày nhập", key: "ngayNhap", width: 150, align: "center" as const },
    { title: "Người nhập", dataIndex: "tenNhanVien", width: 130 },
    { title: "Trạng thái", key: "trangThai", align: "center" as const, width: 110 },
  ];
  if (isAdmin.value) {
    baseCols.push({ title: "Thao tác", key: "action", align: "center" as const, width: 110 });
  }
  return baseCols;
});

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

const getExpiryColor = (dateStr: string) => {
  if (isExpired(dateStr)) return "error";
  const diffDays = dayjs(dateStr).diff(dayjs(), "day");
  if (diffDays <= 10) return "warning";
  return "success";
};

// ============================================================
// Data Loading
// ============================================================
let detailSession = 0;
let fetchTimeout: ReturnType<typeof setTimeout> | null = null;
let isFetching = false;
let pendingRequests: Array<{ isBackground: boolean, resolve: () => void }> = [];
let pollingInterval: ReturnType<typeof setInterval> | null = null;
let unsubSync: (() => void) | null = null;
let isUnmounted = false;

const loadLo = (isBackground = false): Promise<void> => {
  if (isUnmounted || !props.open || !props.topping) return Promise.resolve();

  return new Promise((resolve) => {
    if (isFetching) {
      pendingRequests.push({ isBackground, resolve });
      return;
    }
    isFetching = true;
    executeFetch(isBackground).then(() => {
      resolve();
      consumePending();
    });
  });
};

// ============================================================
// Import Excel
// ============================================================
let uploadRequestId = 0;

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (loadingImport.value) {
    target.value = "";
    return;
  }

  const idNhanVien = authStore.user?.idNhanVien;
  if (!idNhanVien) {
    message.error("Không xác định được nhân viên, vui lòng đăng nhập lại!");
    target.value = "";
    return;
  }

  if (!props.topping || isUnmounted || !props.open) {
    target.value = "";
    return;
  }

  const uploadSession = detailSession;
  const currentUploadId = ++uploadRequestId;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("idNhanVien", idNhanVien.toString());

  loadingImport.value = true;
  try {
    const res = await importLoToppingApi(formData);

    if (isUnmounted || uploadSession !== detailSession) {
      return;
    }

    if (res.data?.code === 200) {
      message.success(res.data?.message || "Import danh sách lô topping thành công!");
      detailSession++;
      currentPage.value = 1;
      await loadLo();
      emit("success");
      emit("refreshMainList");
    } else {
      message.error(res.data?.message || "Có lỗi xảy ra khi import file Excel!");
    }
  } catch (error: any) {
    if (!isUnmounted && uploadSession === detailSession) {
      const errorMsg = error.response?.data?.message || "Có lỗi xảy ra khi import file Excel!";
      message.error(errorMsg);
    }
  } finally {
    if (currentUploadId === uploadRequestId) {
      loadingImport.value = false;
      target.value = "";
    }
  }
};

const executeFetch = async (isBackground: boolean) => {
  const sessionForThisRun = detailSession;
  const currentId = props.topping!.idTopping;

  if (!isBackground) loadingLo.value = true;
  try {
    const res = await getLoTopping(
      currentId,
      currentPage.value - 1,
      pageSize.value
    );
    if (sessionForThisRun !== detailSession || !props.topping || props.topping.idTopping !== currentId || !props.open || isUnmounted) return;
    dsLo.value = res.data.data.content;
    total.value = res.data.data.totalElements;
  } catch (error: any) {
    if (sessionForThisRun === detailSession && !isUnmounted && !isBackground) {
      console.error(error);
    }
  } finally {
    if (sessionForThisRun === detailSession && !isUnmounted) {
      const nextIsForeground = pendingRequests.some(r => !r.isBackground);
      if (!isBackground && !nextIsForeground) {
        loadingLo.value = false;
      }
    }
  }
};

const consumePending = () => {
  if (isUnmounted || !props.open || !props.topping) {
    pendingRequests.forEach(req => req.resolve());
    pendingRequests = [];
    isFetching = false;
    return;
  }
  if (pendingRequests.length > 0) {
    const isBackground = pendingRequests.every(req => req.isBackground);
    if (isBackground && document.visibilityState !== 'visible') {
      isFetching = false;
      return;
    }
    const requestsToProcess = pendingRequests;
    pendingRequests = [];
    isFetching = true;
    executeFetch(isBackground).then(() => {
      requestsToProcess.forEach(req => req.resolve());
      consumePending();
    });
  } else {
    isFetching = false;
  }
};

const triggerRefresh = () => {
  if (isUnmounted || !props.open || !props.topping) return;
  if (fetchTimeout) clearTimeout(fetchTimeout);
  fetchTimeout = setTimeout(() => {
    if (document.visibilityState === 'visible') {
      loadLo(true);
    }
  }, 300);
};

const onPageChange = (page: number, size: number) => {
  detailSession++;
  currentPage.value = page;
  pageSize.value = size;
  loadLo();
};

// ============================================================
// Thao tác Khóa / Mở khóa lô Topping (Giữ nguyên logic gốc)
// ============================================================
const handleLockLo = async (idLoTopping: number) => {
  try {
    await lockLoToppingApi(idLoTopping);
    message.success('Đã khóa lô topping thành công!');
    detailSession++;
    await loadLo();
    emit('success');
    emit('refreshMainList');
  } catch (error: any) {
    message.error(error.response?.data?.message || 'Có lỗi xảy ra khi khóa lô topping!');
  }
};

const handleUnlockLo = async (idLoTopping: number) => {
  try {
    await unlockLoToppingApi(idLoTopping);
    message.success('Đã mở khóa lô topping thành công!');
    detailSession++;
    await loadLo();
    emit('success');
    emit('refreshMainList');
  } catch (error: any) {
    message.error(error.response?.data?.message || 'Có lỗi xảy ra khi mở khóa lô topping!');
  }
};

// ➕ Hàm kích hoạt bật Modal xác nhận
const openLockConfirm = (record: LoTopping) => {
  selectedLo.value = record;
  confirmType.value = 'lock';
  openConfirm.value = true;
};

const openUnlockConfirm = (record: LoTopping) => {
  selectedLo.value = record;
  confirmType.value = 'unlock';
  openConfirm.value = true;
};

// ➕ Hàm xử lý khi bấm nút xác nhận trên Modal
const handleConfirmSubmit = async () => {
  if (!selectedLo.value) return;
  loadingConfirm.value = true;
  try {
    if (confirmType.value === 'lock') {
      await handleLockLo(selectedLo.value.idLoTopping);
    } else {
      await handleUnlockLo(selectedLo.value.idLoTopping);
    }
    openConfirm.value = false;
  } finally {
    loadingConfirm.value = false;
  }
};
// ============================================================
// Nhập kho
// ============================================================
const closeNhapKho = () => {
  nhapKhoForm.maLo = "";
  nhapKhoForm.soLuongNhap = null;
  nhapKhoForm.hanSuDung = null;
  nhapKhoForm.donGiaNhap = null;
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
      donGiaNhap: nhapKhoForm.donGiaNhap ?? null,
    });

    message.success("Nhập kho thành công!");
    closeNhapKho();
    detailSession++;
    currentPage.value = 1;
    await loadLo();
    emit("success");
    emit("refreshMainList");
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
// Watch
// ============================================================
watch(
  () => [props.open, props.topping] as const,
  (newValues, oldValues) => {
    const [isOpen, topping] = newValues;
    const [oldIsOpen, oldTopping] = oldValues || [false, null];

    if (!isOpen || !topping) {
      detailSession++;
      pendingRequests.forEach(req => req.resolve());
      pendingRequests = [];
      if (fetchTimeout) clearTimeout(fetchTimeout);
      loadingLo.value = false;
      loadingImport.value = false;
      dsLo.value = [];
    } else if (isOpen && (!oldTopping || topping.idTopping !== oldTopping.idTopping)) {
      detailSession++;
      loadingImport.value = false;
      currentPage.value = 1;
      dsLo.value = [];
      loadLo();
    } else if (isOpen && !oldIsOpen) {
      loadLo();
    }
  },
  { immediate: true }
);

onMounted(() => {
  unsubSync = onDataChanged((type) => {
    if (['TOPPING_UPDATED', 'INVENTORY_UPDATED', 'APP_REVALIDATE'].includes(type)) {
      triggerRefresh();
    }
  });

  pollingInterval = setInterval(() => {
    triggerRefresh();
  }, 10000);
});

onUnmounted(() => {
  isUnmounted = true;
  detailSession++;
  if (unsubSync) unsubSync();
  if (pollingInterval) clearInterval(pollingInterval);
  if (fetchTimeout) clearTimeout(fetchTimeout);
});
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
