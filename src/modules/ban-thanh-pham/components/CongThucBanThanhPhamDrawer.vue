<template>
  <a-drawer
    :open="props.open"
    width="860"
    :destroy-on-close="false"
    @close="emit('close')"
  >
    <template #title>
      <span style="font-size:17px;font-weight:700;">
        🧪 Công thức - {{ props.btp?.tenBanThanhPham }}
      </span>
    </template>

    <div v-if="!props.btp" style="text-align:center;padding:60px;">
      <a-empty description="Chưa chọn bán thành phẩm" />
    </div>

    <template v-else>
      <!-- Info -->
      <a-descriptions :column="3" size="small" bordered style="margin-bottom:20px;">
        <a-descriptions-item label="Đơn vị thành phẩm">
          <a-tag color="blue">{{ props.btp.donViTinh }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="Hạn sử dụng">
          {{ props.btp.hanSuDungGio != null ? `${props.btp.hanSuDungGio} giờ` : '—' }}
        </a-descriptions-item>
        <a-descriptions-item label="Tồn khả dụng">
          <span style="font-weight:700;color:#389e0d;">
            {{ formatNumber(props.btp.tongTon) }} {{ props.btp.donViTinh }}
          </span>
        </a-descriptions-item>
      </a-descriptions>

      <!-- San luong chuan -->
      <a-card size="small" style="margin-bottom:20px;background:#fafafa;">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <span style="font-weight:700;white-space:nowrap;">Sản lượng chuẩn:</span>
          <a-input-number
            v-model:value="standardOutput"
            :min="0.001"
            :step="100"
            style="width:160px;"
            :precision="3"
            placeholder="VD: 5000"
            :disabled="!isAdmin"
          />
          <span style="font-weight:600;">{{ props.btp.donViTinh }}</span>
          <a-button
            v-if="isAdmin && congThuc.length > 0 && standardOutput !== originalStandardOutput"
            type="primary"
            size="small"
            :loading="savingStandard"
            @click="saveStandardOutput"
          >
            Lưu sản lượng chuẩn
          </a-button>
          <span
            v-if="congThuc.length > 0 && standardOutput === originalStandardOutput"
            style="color:#8c8c8c;font-size:13px;"
          >
            (lấy từ công thức đầu tiên)
          </span>
        </div>
      </a-card>

      <!-- Loading -->
      <div v-if="loadingRecipe" style="text-align:center;padding:30px;">
        <a-spin />
      </div>

      <template v-else>
        <!-- Header bang cong thuc -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <span style="font-size:15px;font-weight:700;">
            📋 Nguyên liệu trong công thức
            <span v-if="standardOutput" style="color:#595959;font-size:13px;font-weight:400;">
              (cho {{ formatNumber(standardOutput) }} {{ props.btp.donViTinh }})
            </span>
          </span>
          <a-button v-if="isAdmin" type="primary" size="small" @click="openAddNL">
            + Thêm nguyên liệu
          </a-button>
        </div>

        <a-empty
          v-if="congThuc.length === 0"
          description="Chưa có nguyên liệu trong công thức"
          :image-style="{ height: '48px' }"
          style="padding:20px 0;"
        />

        <a-table
          v-else
          :columns="columns"
          :data-source="congThuc"
          :pagination="false"
          row-key="idCtBtp"
          size="small"
          bordered
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'tenNguyenLieu'">
              <span style="font-weight:500;">{{ record.tenNguyenLieu }}</span>
            </template>
            <template v-if="column.key === 'donViNguyenLieu'">
              <a-tag>{{ record.donViNguyenLieu }}</a-tag>
            </template>
            <template v-if="column.key === 'action'">
              <div v-if="isAdmin" style="display:flex;gap:4px;justify-content:center;">
                <a-button size="small" type="link" @click="openEdit(record)">Sửa</a-button>
                <a-divider type="vertical" style="margin:0;" />
                <a-popconfirm
                  title="Xóa nguyên liệu này khỏi công thức cốt?"
                  ok-text="Xóa"
                  cancel-text="Hủy"
                  ok-type="danger"
                  @confirm="deleteRow(record.idCtBtp)"
                >
                  <a-button size="small" type="link" danger>Xóa</a-button>
                </a-popconfirm>
              </div>
            </template>
          </template>
        </a-table>
      </template>
    </template>

    <!-- Modal them/sua nguyen lieu -->
    <a-modal
      v-model:open="nlModalOpen"
      :title="editingRow ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu vào công thức'"
      width="480px"
      ok-text="Lưu"
      cancel-text="Hủy"
      :confirm-loading="savingNL"
      :ok-button-props="{ disabled: savingNL }"
      @ok="submitNL"
      @cancel="closeNLModal"
    >
      <a-form layout="vertical">
        <a-form-item label="Nguyên liệu" required>
          <a-select
            v-model:value="nlForm.idNguyenLieu"
            show-search
            :filter-option="filterNLOption"
            placeholder="Tìm và chọn nguyên liệu..."
            style="width:100%"
            :loading="loadingNLList"
            @change="onSelectNL"
          >
            <a-select-option
              v-for="nl in allNguyenLieu"
              :key="nl.idNguyenLieu"
              :value="nl.idNguyenLieu"
              :disabled="isNLDisabled(nl.idNguyenLieu)"
              :label="`${nl.tenNguyenLieu} - ${nl.donViTinh}`"
            >
              <span :style="isNLDisabled(nl.idNguyenLieu) ? 'color:#bfbfbf;' : ''">
                {{ nl.tenNguyenLieu }} - {{ nl.donViTinh }}
              </span>
              <a-tag v-if="isNLDisabled(nl.idNguyenLieu)" color="default" style="margin-left:6px;font-size:11px;">Đã có</a-tag>
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Định lượng nguyên liệu" required>
              <a-input-number
                v-model:value="nlForm.soLuongNguyenLieu"
                :min="0.001"
                :step="1"
                :precision="3"
                style="width:100%"
                placeholder="VD: 0.1"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="Đơn vị">
              <a-input :value="nlForm.donViNguyenLieu" disabled placeholder="Chọn NL trước" />
            </a-form-item>
          </a-col>
        </a-row>
        <div style="background:#f6ffed;border:1px solid #b7eb8f;border-radius:8px;padding:10px;margin-top:4px;font-size:13px;">
          <strong>Sản lượng chuẩn:</strong>
          {{ standardOutput ? `${formatNumber(standardOutput)} ${props.btp?.donViTinh ?? ''}` : '(chưa nhập)' }}
        </div>
      </a-form>
    </a-modal>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { message, Modal } from "ant-design-vue";
import type { AxiosError } from "axios";
import type {
  BanThanhPham,
  CongThucBanThanhPham,
  CongThucBanThanhPhamRequest,
  NguyenLieuOption,
} from "../types/banThanhPham";
import { useAuthStore } from "@/modules/auth/store/authStore";
import {
  getCongThucBanThanhPham,
  createCongThucBanThanhPham,
  updateCongThucBanThanhPham,
  deleteCongThucBanThanhPham,
  getNguyenLieuForBtp,
} from "../api/banThanhPhamApi";

const props = defineProps<{
  open: boolean;
  btp?: BanThanhPham;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

// ============================================================
// Auth
// ============================================================
const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.role === "ADMIN");

// ============================================================
// Helpers
// ============================================================
const formatNumber = (v: number) =>
  new Intl.NumberFormat("vi-VN").format(v);

// ============================================================
// State
// ============================================================
const loadingRecipe = ref(false);
const congThuc = ref<CongThucBanThanhPham[]>([]);

// San luong chuan
const standardOutput = ref<number | null>(null);
const originalStandardOutput = ref<number | null>(null);
const savingStandard = ref(false);

const columns = computed(() => {
  const base = [
    { title: "Nguyên liệu", key: "tenNguyenLieu", ellipsis: true },
    {
      title: "Định lượng",
      dataIndex: "soLuongNguyenLieu",
      width: 130,
      align: "center" as const,
    },
    { title: "Đơn vị", key: "donViNguyenLieu", width: 90, align: "center" as const },
  ];
  if (isAdmin.value) {
    base.push({ title: "Thao tác", key: "action", width: 130, align: "center" as const });
  }
  return base;
});

// ============================================================
// Watch open
// ============================================================
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.btp) {
      allNguyenLieu.value = [];
      await loadRecipe();
    } else if (!isOpen) {
      congThuc.value = [];
      standardOutput.value = null;
      originalStandardOutput.value = null;
    }
  }
);

const loadRecipe = async () => {
  if (!props.btp) return;
  loadingRecipe.value = true;
  try {
    const res = await getCongThucBanThanhPham(props.btp.idBanThanhPham);
    const data: CongThucBanThanhPham[] = res.data.data ?? [];
    congThuc.value = data;

    // Lay san luong chuan tu dong dau tien
    if (data.length > 0) {
      const first = data[0].soLuongThanhPham;
      standardOutput.value = first;
      originalStandardOutput.value = first;
      // Canh bao neu cac dong khong dong nhat
      const inconsistent = data.some((row) => row.soLuongThanhPham !== first);
      if (inconsistent) {
        message.warning("Công thức hiện có dữ liệu sản lượng chuẩn chưa đồng nhất");
      }
    } else {
      standardOutput.value = null;
      originalStandardOutput.value = null;
    }
  } catch (err) {
    const e = err as AxiosError<{ message: string }>;
    message.error(e.response?.data?.message || "Không thể tải công thức");
  } finally {
    loadingRecipe.value = false;
  }
};

// ============================================================
// Luu san luong chuan: PUT tung dong, giu nguyen soLuongNguyenLieu
// ============================================================
const saveStandardOutput = async () => {
  if (!props.btp || !standardOutput.value || standardOutput.value <= 0) {
    message.warning("Sản lượng chuẩn phải lớn hơn 0");
    return;
  }

  const oldVal = originalStandardOutput.value ?? 0;
  const newVal = standardOutput.value;
  const donVi = props.btp.donViTinh;

  Modal.confirm({
    title: "Thay đổi sản lượng chuẩn",
    content: `Thay đổi sản lượng chuẩn từ ${formatNumber(oldVal)} ${donVi} thành ${formatNumber(newVal)} ${donVi}? Định lượng nguyên liệu hiện tại được giữ nguyên.`,
    okText: "Xác nhận",
    cancelText: "Hủy",
    onOk: async () => {
      savingStandard.value = true;
      try {
        await Promise.all(
          congThuc.value.map((row) =>
            updateCongThucBanThanhPham(row.idCtBtp, {
              idBanThanhPham: props.btp!.idBanThanhPham,
              idNguyenLieu: row.idNguyenLieu,
              soLuongNguyenLieu: row.soLuongNguyenLieu,
              soLuongThanhPham: newVal,
            })
          )
        );
        message.success("Đã cập nhật sản lượng chuẩn");
        originalStandardOutput.value = newVal;
        await loadRecipe();
      } catch (err) {
        const e = err as AxiosError<{ message: string }>;
        message.error(e.response?.data?.message || "Có lỗi xảy ra");
      } finally {
        savingStandard.value = false;
      }
    },
  });
};

// ============================================================
// Nguyen lieu
// ============================================================
const nlModalOpen = ref(false);
const savingNL = ref(false);
const editingRow = ref<CongThucBanThanhPham | null>(null);
const loadingNLList = ref(false);
const allNguyenLieu = ref<NguyenLieuOption[]>([]);

const nlForm = ref<{
  idNguyenLieu: number | null;
  soLuongNguyenLieu: number | null;
  donViNguyenLieu: string;
}>({
  idNguyenLieu: null,
  soLuongNguyenLieu: null,
  donViNguyenLieu: "",
});

const isNLDisabled = (idNL: number): boolean =>
  congThuc.value.some(
    (row) =>
      row.idNguyenLieu === idNL &&
      (editingRow.value === null || row.idCtBtp !== editingRow.value.idCtBtp)
  );

const filterNLOption = (input: string, option: any): boolean => {
  const label: string = option?.label ?? "";
  return label.toLowerCase().includes(input.toLowerCase());
};

const loadNguyenLieu = async () => {
  if (allNguyenLieu.value.length > 0) return;
  loadingNLList.value = true;
  try {
    const res = await getNguyenLieuForBtp();
    allNguyenLieu.value = res.data.data?.content ?? res.data.data ?? [];
  } catch {
    allNguyenLieu.value = [];
  } finally {
    loadingNLList.value = false;
  }
};

const openAddNL = async () => {
  if (!standardOutput.value || standardOutput.value <= 0) {
    message.warning("Vui lòng nhập sản lượng chuẩn trước");
    return;
  }
  editingRow.value = null;
  nlForm.value = { idNguyenLieu: null, soLuongNguyenLieu: null, donViNguyenLieu: "" };
  await loadNguyenLieu();
  nlModalOpen.value = true;
};

const openEdit = async (record: CongThucBanThanhPham) => {
  editingRow.value = record;
  nlForm.value = {
    idNguyenLieu: record.idNguyenLieu,
    soLuongNguyenLieu: record.soLuongNguyenLieu,
    donViNguyenLieu: record.donViNguyenLieu,
  };
  await loadNguyenLieu();
  nlModalOpen.value = true;
};

const onSelectNL = (idNL: number) => {
  const nl = allNguyenLieu.value.find((n) => n.idNguyenLieu === idNL);
  nlForm.value.donViNguyenLieu = nl?.donViTinh ?? "";
};

const closeNLModal = () => {
  nlModalOpen.value = false;
  editingRow.value = null;
};

const submitNL = async () => {
  if (!nlForm.value.idNguyenLieu) {
    message.warning("Vui lòng chọn nguyên liệu");
    return;
  }
  if (!nlForm.value.soLuongNguyenLieu || nlForm.value.soLuongNguyenLieu <= 0) {
    message.warning("Định lượng phải lớn hơn 0");
    return;
  }
  if (!props.btp || !standardOutput.value) return;

  savingNL.value = true;
  try {
    const body: CongThucBanThanhPhamRequest = {
      idBanThanhPham: props.btp.idBanThanhPham,
      idNguyenLieu: nlForm.value.idNguyenLieu,
      soLuongNguyenLieu: nlForm.value.soLuongNguyenLieu,
      soLuongThanhPham: standardOutput.value,
    };

    if (editingRow.value) {
      await updateCongThucBanThanhPham(editingRow.value.idCtBtp, body);
      message.success("Cập nhật nguyên liệu thành công");
    } else {
      await createCongThucBanThanhPham(body);
      message.success("Thêm nguyên liệu thành công");
    }
    nlModalOpen.value = false;
    editingRow.value = null;
    await loadRecipe();
  } catch (err) {
    const e = err as AxiosError<{ message: string }>;
    message.error(e.response?.data?.message || "Có lỗi xảy ra");
  } finally {
    savingNL.value = false;
  }
};

const deleteRow = async (idCtBtp: number) => {
  if (!props.btp) return;
  try {
    await deleteCongThucBanThanhPham(idCtBtp);
    message.success("Đã xóa nguyên liệu khỏi công thức");
    await loadRecipe();
  } catch (err) {
    const e = err as AxiosError<{ message: string }>;
    message.error(e.response?.data?.message || "Có lỗi xảy ra");
  }
};
</script>

<style scoped>
:deep(.ant-drawer-title) { font-size: 17px; font-weight: 700; }
:deep(.ant-table-thead > tr > th) { background: #fafafa; font-weight: 700; }
:deep(.ant-descriptions-item-label) { font-weight: 600; background: #fafafa; }
</style>
