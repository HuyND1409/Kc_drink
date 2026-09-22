<template>
  <a-drawer
    :open="props.open"
    width="880"
    :destroy-on-close="false"
    @close="emit('close')"
  >
    <template #title>
      <span style="font-size:17px;font-weight:700;">
        🫖 Mẻ pha - {{ props.btp?.tenBanThanhPham }}
      </span>
    </template>

    <div v-if="!props.btp" style="text-align:center;padding:60px;">
      <a-empty description="Chưa chọn bán thành phẩm" />
    </div>

    <template v-else>
      <!-- Header info -->
      <a-descriptions :column="3" size="small" bordered style="margin-bottom:20px;">
        <a-descriptions-item label="Tồn khả dụng">
          <span style="font-weight:700;color:#389e0d;">
            {{ formatNumber(props.btp.tongTon) }} {{ props.btp.donViTinh }}
          </span>
        </a-descriptions-item>
        <a-descriptions-item label="Hạn sử dụng BTP">
          {{ props.btp.hanSuDungGio != null ? `${props.btp.hanSuDungGio} giờ` : 'Không giới hạn' }}
        </a-descriptions-item>
        <a-descriptions-item label="Trạng thái">
          <a-tag :color="props.btp.trangThai === 1 ? 'success' : 'error'">
            {{ props.btp.trangThai === 1 ? 'Đang dùng' : 'Ngừng dùng' }}
          </a-tag>
        </a-descriptions-item>
      </a-descriptions>

      <!-- Toolbar -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <span style="font-size:15px;font-weight:700;">📋 Lịch sử mẻ pha</span>
        <a-button
          v-if="canPhaChe"
          type="primary"
          :disabled="props.btp.trangThai !== 1 || !hasRecipe"
          @click="openTaoMe"
        >
          + Tạo mẻ pha
        </a-button>
      </div>

      <a-alert
        v-if="canPhaChe && !hasRecipe"
        type="warning"
        message="Bán thành phẩm chưa có công thức. Vui lòng cấu hình công thức trước khi tạo mẻ."
        show-icon
        style="margin-bottom:16px;"
      />

      <!-- Loading -->
      <div v-if="loadingMe" style="text-align:center;padding:30px;">
        <a-spin />
      </div>

      <template v-else>
        <a-empty
          v-if="meList.length === 0"
          description="Chưa có mẻ pha nào"
          :image-style="{ height: '48px' }"
          style="padding:20px 0;"
        />
        <a-table
          v-else
          :columns="columns"
          :data-source="meList"
          :pagination="{ pageSize: 10, showTotal: (t: number) => `Tổng ${t} mẻ` }"
          row-key="idMePha"
          size="small"
          bordered
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'ngayPha'">
              {{ formatDateTime(record.ngayPha) }}
            </template>
            <template v-if="column.key === 'tenNhanVien'">
              {{ record.tenNhanVien ?? '—' }}
            </template>
            <template v-if="column.key === 'soLuong'">
              <div>
                <div>Tạo: <strong>{{ formatNumber(record.soLuongTaoRa) }}</strong> {{ props.btp?.donViTinh }}</div>
                <div style="color:#389e0d;">Còn: <strong>{{ formatNumber(record.soLuongConLai) }}</strong> {{ props.btp?.donViTinh }}</div>
              </div>
            </template>
            <template v-if="column.key === 'hanSuDung'">
              {{ record.hanSuDung ? formatDateTime(record.hanSuDung) : '—' }}
            </template>
            <template v-if="column.key === 'trangThai'">
              <a-tag :color="getMeTrangThaiColor(record)">
                {{ getMeTrangThaiLabel(record) }}
              </a-tag>
            </template>
            <template v-if="column.key === 'ghiChu'">
              {{ record.ghiChu || '—' }}
            </template>
          </template>
        </a-table>
      </template>
    </template>

    <!-- Modal Tao Me Pha -->
    <a-modal
      v-model:open="taoMeOpen"
      title="Tạo mẻ pha"
      width="520px"
      ok-text="Tạo mẻ"
      cancel-text="Hủy"
      :confirm-loading="savingMe"
      :ok-button-props="{ disabled: savingMe || !meForm.soLuongTaoRa || meForm.soLuongTaoRa <= 0 }"
      @ok="submitTaoMe"
      @cancel="closeTaoMe"
    >
      <a-form layout="vertical">
        <a-form-item label="Bán thành phẩm">
          <a-input :value="props.btp?.tenBanThanhPham" disabled />
        </a-form-item>

        <a-form-item label="Số lượng muốn pha" required>
          <a-input-number
            v-model:value="meForm.soLuongTaoRa"
            style="width:100%"
            :min="0.001"
            :step="100"
            :precision="3"
            :placeholder="`VD: 5000 (${props.btp?.donViTinh})`"
            @change="calcPreview"
          />
        </a-form-item>

        <a-form-item label="Ghi chú">
          <a-textarea
            v-model:value="meForm.ghiChu"
            :rows="2"
            placeholder="VD: Pha đầu ca chiều..."
          />
        </a-form-item>

        <!-- Preview nguyen lieu -->
        <div v-if="preview.length > 0" style="margin-top:8px;">
          <div style="font-weight:700;margin-bottom:8px;color:#262626;">
            📦 Nguyên liệu cần dùng (dự kiến)
          </div>
          <a-table
            :columns="previewCols"
            :data-source="preview"
            :pagination="false"
            row-key="idNguyenLieu"
            size="small"
            style="background:#f6ffed;border-radius:8px;"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'soLuong'">
                <strong>{{ formatNumber3(record.soLuong) }}</strong> {{ record.donViTinh }}
              </template>
            </template>
          </a-table>
        </div>

        <a-alert
          v-else-if="meForm.soLuongTaoRa && congThucForPreview.length === 0"
          type="info"
          message="Công thức chưa được cấu hình — BE sẽ xử lý khi tạo mẻ."
          show-icon
          style="margin-top:8px;"
        />
      </a-form>
    </a-modal>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from "vue";
import { message } from "ant-design-vue";
import type { AxiosError } from "axios";
import { useAuthStore } from "@/modules/auth/store/authStore";
import type {
  BanThanhPham,
  MePhaChe,
  TaoMePhaCheRequest,
  CongThucBanThanhPham,
} from "../types/banThanhPham";
import {
  getMePhaCheList,
  createMePhaChe,
  getCongThucBanThanhPham,
} from "../api/banThanhPhamApi";
import { onDataChanged } from "@/utils/appSync";

const props = defineProps<{
  open: boolean;
  btp?: BanThanhPham;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "reloadBtp"): void;
}>();

const authStore = useAuthStore();
const canPhaChe = computed(() => authStore.user?.role === "ADMIN" || authStore.user?.role === "STAFF");

// ============================================================
// Helpers
// ============================================================
const formatNumber = (v: number) => new Intl.NumberFormat("vi-VN").format(v);
const formatNumber3 = (v: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(v);

const formatDateTime = (dt: string) => {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dt));
  } catch {
    return dt;
  }
};

const getMeTrangThaiLabel = (me: MePhaChe): string => {
  if (me.soLuongConLai <= 0) return "Hết";
  if (me.hanSuDung && new Date(me.hanSuDung) <= new Date()) return "Hết hạn";
  return "Còn dùng";
};

const getMeTrangThaiColor = (me: MePhaChe): string => {
  if (me.soLuongConLai <= 0) return "default";
  if (me.hanSuDung && new Date(me.hanSuDung) <= new Date()) return "error";
  return "success";
};

// ============================================================
// State: me pha
// ============================================================
const loadingMe = ref(false);
const allMePhaChe = ref<MePhaChe[]>([]);

const meList = computed(() =>
  props.btp
    ? allMePhaChe.value.filter((m) => m.idBanThanhPham === props.btp!.idBanThanhPham)
    : []
);

const columns = [
  { title: "Ngày pha", key: "ngayPha", width: 150 },
  { title: "Người pha", key: "tenNhanVien", width: 150, ellipsis: true },
  { title: "Số lượng", key: "soLuong", width: 170 },
  { title: "Hạn sử dụng", key: "hanSuDung", width: 150 },
  { title: "Trạng thái", key: "trangThai", width: 110, align: "center" as const },
  { title: "Ghi chú", key: "ghiChu", ellipsis: true },
];

// Cong thuc de preview
const congThucForPreview = ref<CongThucBanThanhPham[]>([]);
const hasRecipe = computed(() => congThucForPreview.value.length > 0);

// ============================================================
// Watch
// ============================================================
let detailSession = 0;
let fetchTimeout: ReturnType<typeof setTimeout> | null = null;
let isFetching = false;
let pendingRequests: Array<{ isBackground: boolean, resolve: () => void }> = [];
let pollingInterval: ReturnType<typeof setInterval> | null = null;
let unsubSync: (() => void) | null = null;
let isUnmounted = false;

const loadMePhaChe = (isBackground = false): Promise<void> => {
  if (isUnmounted || !props.open || !props.btp) return Promise.resolve();

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

const executeFetch = async (isBackground: boolean) => {
  const sessionForThisRun = detailSession;
  const currentId = props.btp!.idBanThanhPham;

  if (!isBackground) loadingMe.value = true;
  try {
    const res = await getMePhaCheList();
    if (sessionForThisRun !== detailSession || !props.btp || props.btp.idBanThanhPham !== currentId || !props.open || isUnmounted) return;
    allMePhaChe.value = res.data.data ?? [];
  } catch (error: any) {
    if (sessionForThisRun === detailSession && !isUnmounted && !isBackground) {
      console.error(error);
      const e = error as AxiosError<{ message: string }>;
      message.error(e.response?.data?.message || "Không thể tải danh sách mẻ pha");
    }
  } finally {
    if (sessionForThisRun === detailSession && !isUnmounted) {
      const nextIsForeground = pendingRequests.some(r => !r.isBackground);
      if (!isBackground && !nextIsForeground) {
        loadingMe.value = false;
      }
    }
  }
};

const consumePending = () => {
  if (isUnmounted || !props.open || !props.btp) {
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
  if (isUnmounted || !props.open || !props.btp) return;
  if (fetchTimeout) clearTimeout(fetchTimeout);
  fetchTimeout = setTimeout(() => {
    if (document.visibilityState === 'visible') {
      loadMePhaChe(true);
    }
  }, 300);
};

const loadCongThucForPreview = async () => {
  const sessionForThisRun = detailSession;
  const currentId = props.btp?.idBanThanhPham;
  if (!currentId) return;
  try {
    const res = await getCongThucBanThanhPham(currentId);
    if (isUnmounted || !props.open || sessionForThisRun !== detailSession || !props.btp || props.btp.idBanThanhPham !== currentId) return;
    congThucForPreview.value = res.data.data ?? [];
  } catch {
    if (isUnmounted || !props.open || sessionForThisRun !== detailSession || !props.btp || props.btp.idBanThanhPham !== currentId) return;
    congThucForPreview.value = [];
  }
};

watch(
  () => [props.open, props.btp] as const,
  async (newValues, oldValues) => {
    const [isOpen, btp] = newValues;
    const [oldIsOpen, oldBtp] = oldValues || [false, null];

    if (!isOpen || !btp) {
      detailSession++;
      pendingRequests.forEach(req => req.resolve());
      pendingRequests = [];
      if (fetchTimeout) clearTimeout(fetchTimeout);
      loadingMe.value = false;
      allMePhaChe.value = [];
      congThucForPreview.value = [];
    } else if (isOpen && (!oldBtp || btp.idBanThanhPham !== oldBtp.idBanThanhPham)) {
      detailSession++;
      allMePhaChe.value = [];
      congThucForPreview.value = [];
      await Promise.all([loadMePhaChe(), loadCongThucForPreview()]);
    } else if (isOpen && !oldIsOpen) {
      await Promise.all([loadMePhaChe(), loadCongThucForPreview()]);
    }
  },
  { immediate: true }
);

onMounted(() => {
  unsubSync = onDataChanged((type) => {
    if (['BAN_THANH_PHAM_UPDATED', 'INVENTORY_UPDATED', 'APP_REVALIDATE'].includes(type)) {
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

// ============================================================
// Tao me pha
// ============================================================
const taoMeOpen = ref(false);
const savingMe = ref(false);

const meForm = ref<{
  soLuongTaoRa: number | null;
  ghiChu: string;
}>({
  soLuongTaoRa: null,
  ghiChu: "",
});

// Preview nguyen lieu
interface PreviewRow {
  idNguyenLieu: number;
  tenNguyenLieu: string;
  donViTinh: string;
  soLuong: number;
}
const preview = ref<PreviewRow[]>([]);

const previewCols = [
  { title: "Nguyên liệu", dataIndex: "tenNguyenLieu", ellipsis: true },
  { title: "Cần dùng", key: "soLuong", width: 160, align: "center" as const },
];

const calcPreview = () => {
  if (!meForm.value.soLuongTaoRa || meForm.value.soLuongTaoRa <= 0 || congThucForPreview.value.length === 0) {
    preview.value = [];
    return;
  }
  preview.value = congThucForPreview.value.map((row) => {
    const tiLe = meForm.value.soLuongTaoRa! / row.soLuongThanhPham;
    return {
      idNguyenLieu: row.idNguyenLieu,
      tenNguyenLieu: row.tenNguyenLieu,
      donViTinh: row.donViNguyenLieu,
      soLuong: row.soLuongNguyenLieu * tiLe,
    };
  });
};

const openTaoMe = () => {
  meForm.value = { soLuongTaoRa: null, ghiChu: "" };
  preview.value = [];
  taoMeOpen.value = true;
};

const closeTaoMe = () => {
  taoMeOpen.value = false;
};

const submitTaoMe = async () => {
  if (!props.btp) return;
  if (!meForm.value.soLuongTaoRa || meForm.value.soLuongTaoRa <= 0) {
    message.warning("Số lượng muốn pha phải lớn hơn 0");
    return;
  }

  savingMe.value = true;
  try {
    const body: TaoMePhaCheRequest = {
      idBanThanhPham: props.btp.idBanThanhPham,
      soLuongTaoRa: meForm.value.soLuongTaoRa,
      ghiChu: meForm.value.ghiChu.trim() || null,
    };
    await createMePhaChe(body);
    message.success("Tạo mẻ pha thành công");
    taoMeOpen.value = false;
    // Reload me pha + bao parent reload tongTon
    detailSession++;
    await loadMePhaChe();
    emit("reloadBtp");
  } catch (err) {
    const e = err as AxiosError<{ message: string }>;
    message.error(e.response?.data?.message || "Có lỗi xảy ra khi tạo mẻ pha");
  } finally {
    savingMe.value = false;
  }
};
</script>

<style scoped>
:deep(.ant-drawer-title) { font-size: 17px; font-weight: 700; }
:deep(.ant-table-thead > tr > th) { background: #fafafa; font-weight: 700; }
:deep(.ant-descriptions-item-label) { font-weight: 600; background: #fafafa; }
</style>
