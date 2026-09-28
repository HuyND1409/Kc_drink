<template>
  <a-drawer
    :open="props.open"
    width="960"
    :destroy-on-close="false"
    @close="emit('close')"
  >
    <template #title>
      <span style="font-size:18px;font-weight:700;">
        📋 Công thức - {{ props.sanPham?.tenSanPham }}
      </span>
    </template>

    <!-- Loading sizes -->
    <div v-if="loadingSizes" style="text-align:center;padding:60px;">
      <a-spin size="large" />
    </div>

    <!-- Chua co size -->
    <a-empty
      v-else-if="sanPhamSizes.length === 0"
      description="Sản phẩm chưa được cấu hình size. Vui lòng thêm size trước."
      style="margin-top:80px;"
    />

    <!-- Co size -->
    <template v-else>

      <!-- INFO BAR: gia / phu thu / gia ban -->
      <a-descriptions
        v-if="currentSizeMeta"
        :column="4"
        size="small"
        bordered
        style="margin-bottom:16px;"
      >
        <a-descriptions-item label="Giá gốc">
          <span style="font-weight:600;color:#d46b08;">
            {{ formatCurrency(props.sanPham!.gia) }}
          </span>
        </a-descriptions-item>
        <a-descriptions-item label="Size hiện tại">
          <a-tag color="blue" style="font-weight:700;">{{ currentSizeMeta.tenSize }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="Phụ thu">
          <span style="color:#389e0d;font-weight:600;">
            +{{ formatCurrency(currentSizeMeta.phuThu) }}
          </span>
        </a-descriptions-item>
        <a-descriptions-item label="Giá bán (tham khảo)">
          <span style="font-weight:700;color:#d46b08;">
            {{ formatCurrency(props.sanPham!.gia + currentSizeMeta.phuThu) }}
          </span>
        </a-descriptions-item>
      </a-descriptions>

      <!-- TABS SIZE -->
      <a-tabs v-model:activeKey="currentSizeId" @change="onTabChange" style="margin-bottom:8px;">
        <a-tab-pane
          v-for="s in sanPhamSizes"
          :key="s.idSize"
          :tab="s.tenSize"
        />
      </a-tabs>

      <!-- TRANG THAI CHE DO NGUYEN LIEU -->
      <div
        v-if="currentSizeMeta"
        style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:8px 12px;background:#fafafa;border:1px solid #f0f0f0;border-radius:8px;"
      >
        <!-- Size goc: chi hien tag -->
        <template v-if="isCurrentBaseSize">
          <a-tag color="gold" style="font-weight:700;margin:0;">⭐ Size gốc</a-tag>
          <span style="font-size:12px;color:#8c8c8c;">Công thức size gốc được chỉnh trực tiếp.</span>
        </template>

        <!-- Size khac: hien control doi mode -->
        <template v-else>
          <span style="font-size:13px;color:#595959;white-space:nowrap;">Chế độ nguyên liệu:</span>
          <a-segmented
            :value="currentSizeMeta.tuDongTinhNguyenLieu === false ? 'manual' : 'auto'"
            :options="[
              { label: '⚙️ Tự động', value: 'auto' },
              { label: '✏️ Nhập tay', value: 'manual' },
            ]"
            :disabled="loadingModeSwitch || !isAdmin"
            @change="(val: string) => handleChangeModeNguyenLieu(val === 'auto')"
          />
          <a-spin v-if="loadingModeSwitch" size="small" />
          <span
            v-if="currentSizeMeta.tuDongTinhNguyenLieu !== false"
            style="font-size:12px;color:#8c8c8c;"
          >
            Công thức được tính tự động theo size gốc.
          </span>
          <span v-else style="font-size:12px;color:#8c8c8c;">
            Công thức được nhập tay.
          </span>
        </template>
      </div>

      <!-- Loading cong thuc -->
      <div v-if="loadingRecipe" style="text-align:center;padding:40px;">
        <a-spin />
      </div>

      <template v-else>

        <!-- ====== NGUYEN LIEU TRUC TIEP ====== -->
        <div style="margin-bottom:36px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-size:15px;font-weight:700;color:#262626;">
              🧪 Nguyên liệu trực tiếp
            </span>
            <a-button v-if="isAdmin && canEditCurrentRecipe" type="primary" size="small" @click="openAddNL">
              + Thêm nguyên liệu
            </a-button>
          </div>

          <a-empty
            v-if="congThucNL.length === 0"
            description="Chưa có nguyên liệu trực tiếp"
            :image-style="{ height: '48px' }"
            style="padding:20px 0;"
          />

          <a-table
            v-else
            :columns="nlColumns"
            :data-source="congThucNL"
            :pagination="false"
            :loading="false"
            row-key="idCtsp"
            size="small"
            bordered
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'tenNguyenLieu'">
                <span style="font-weight:500;">{{ record.nguyenLieu.tenNguyenLieu }}</span>
              </template>
              <template v-if="column.key === 'donViTinh'">
                <a-tag>{{ record.nguyenLieu.donViTinh }}</a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <div v-if="isAdmin && canEditCurrentRecipe" style="display:flex;gap:6px;justify-content:center;">
                  <a-button size="small" type="link" @click="openEditNL(record)">Sửa</a-button>
                  <a-divider type="vertical" style="margin:0;" />
                  <a-popconfirm
                    title="Xóa nguyên liệu này khỏi công thức?"
                    ok-text="Xóa"
                    cancel-text="Hủy"
                    ok-type="danger"
                    @confirm="deleteNL(record.idCtsp)"
                  >
                    <a-button size="small" type="link" danger>Xóa</a-button>
                  </a-popconfirm>
                </div>
              </template>
            </template>
          </a-table>
        </div>

        <!-- ====== BAN THANH PHAM ====== -->
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-size:15px;font-weight:700;color:#262626;">
              🧫 Bán thành phẩm
            </span>
            <a-button v-if="isAdmin && canEditCurrentRecipe" type="primary" size="small" @click="openAddBtp">
              + Thêm bán thành phẩm
            </a-button>
          </div>

          <a-empty
            v-if="congThucBtp.length === 0"
            description="Chưa sử dụng bán thành phẩm"
            :image-style="{ height: '48px' }"
            style="padding:20px 0;"
          />

          <a-table
            v-else
            :columns="btpColumns"
            :data-source="congThucBtp"
            :pagination="false"
            :loading="false"
            row-key="id"
            size="small"
            bordered
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'tenBanThanhPham'">
                <span style="font-weight:500;">{{ record.tenBanThanhPham }}</span>
              </template>
              <template v-if="column.key === 'donViTinh'">
                <a-tag>{{ record.donViTinh }}</a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <div v-if="isAdmin && canEditCurrentRecipe" style="display:flex;gap:6px;justify-content:center;">
                  <a-button size="small" type="link" @click="openEditBtp(record)">Sửa</a-button>
                  <a-divider type="vertical" style="margin:0;" />
                  <a-popconfirm
                    title="Xóa bán thành phẩm này khỏi công thức?"
                    ok-text="Xóa"
                    cancel-text="Hủy"
                    ok-type="danger"
                    @confirm="deleteBtp(record.id)"
                  >
                    <a-button size="small" type="link" danger>Xóa</a-button>
                  </a-popconfirm>
                </div>
              </template>
            </template>
          </a-table>
        </div>

      </template>
    </template>

    <!-- ====== MODAL NGUYEN LIEU ====== -->
    <a-modal
      v-model:open="nlModalOpen"
      :title="editingNL ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu'"
      ok-text="Lưu"
      cancel-text="Hủy"
      :confirm-loading="savingNL"
      width="480px"
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
              <a-tag v-if="isNLDisabled(nl.idNguyenLieu)" color="default" style="margin-left:8px;font-size:11px;">
                Đã có
              </a-tag>
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Định lượng" required>
              <a-input-number
                v-model:value="nlForm.soLuong"
                :min="0.001"
                :step="1"
                :precision="3"
                style="width:100%"
                placeholder="VD: 5"
                :disabled="!isAdmin"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="Đơn vị">
              <a-input :value="nlForm.donViTinh" disabled placeholder="Chọn nguyên liệu trước" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- ====== MODAL BAN THANH PHAM ====== -->
    <a-modal
      v-model:open="btpModalOpen"
      :title="editingBtp ? 'Sửa bán thành phẩm' : 'Thêm bán thành phẩm'"
      ok-text="Lưu"
      cancel-text="Hủy"
      :confirm-loading="savingBtp"
      width="480px"
      :ok-button-props="{ disabled: savingBtp }"
      @ok="submitBtp"
      @cancel="closeBtpModal"
    >
      <a-form layout="vertical">
        <a-form-item label="Bán thành phẩm" required>
          <a-select
            v-model:value="btpForm.idBanThanhPham"
            show-search
            :filter-option="filterBtpOption"
            placeholder="Tìm và chọn bán thành phẩm..."
            style="width:100%"
            :loading="loadingBtpList"
            @change="onSelectBtp"
          >
            <a-select-option
              v-for="b in allBtp"
              :key="b.idBanThanhPham"
              :value="b.idBanThanhPham"
              :disabled="isBtpDisabled(b.idBanThanhPham) || b.trangThai !== 1"
              :label="`${b.tenBanThanhPham} - ${b.donViTinh}`"
            >
              <span :style="(isBtpDisabled(b.idBanThanhPham) || b.trangThai !== 1) ? 'color:#bfbfbf;' : ''">
                {{ b.tenBanThanhPham }} - {{ b.donViTinh }}
              </span>
              <a-tag v-if="isBtpDisabled(b.idBanThanhPham)" color="default" style="margin-left:8px;font-size:11px;">
                Đã có
              </a-tag>
              <a-tag v-else-if="b.trangThai !== 1" color="error" style="margin-left:8px;font-size:11px;">
                Ngừng dùng
              </a-tag>
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Định lượng" required>
              <a-input-number
                v-model:value="btpForm.soLuong"
                :min="0.001"
                :step="1"
                :precision="3"
                style="width:100%"
                placeholder="VD: 100"
                :disabled="!isAdmin"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="Đơn vị">
              <a-input :value="btpForm.donViTinh" disabled placeholder="Chọn BTP trước" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

  </a-drawer>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { message, Modal } from "ant-design-vue";
import { useAuthStore } from "@/modules/auth/store/authStore";
import type { AxiosError } from "axios";
import type {
  SanPham,
  SanPhamSize,
  CongThucNguyenLieu,
  CongThucBtp,
  NguyenLieuCongThuc,
  BanThanhPham,
  CongThucNguyenLieuRequest,
  CongThucBtpRequest,
} from "../types/sanPham";
import {
  getSanPhamSizeByProduct,
  getCongThucNguyenLieu,
  createCongThucNguyenLieu,
  updateCongThucNguyenLieu,
  deleteCongThucNguyenLieu,
  getNguyenLieuForFormula,
  getBanThanhPham,
  getCongThucBtp,
  createCongThucBtp,
  updateCongThucBtp,
  deleteCongThucBtp,
  updateSanPhamSizeNguyenLieu,
} from "../api/sanPhamApi";

// ============================================================
// Props / Emits
// ============================================================
const props = defineProps<{
  open: boolean;
  sanPham?: SanPham;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

// ============================================================
// Helpers
// ============================================================
const formatCurrency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

// ============================================================
// State: sizes + recipe
// ============================================================
const loadingSizes = ref(false);
const loadingRecipe = ref(false);
const sanPhamSizes = ref<SanPhamSize[]>([]);
const currentSizeId = ref<number | null>(null);

const congThucNL = ref<CongThucNguyenLieu[]>([]);
const congThucBtp = ref<CongThucBtp[]>([]);

// Meta cua size dang active (lay phuThu tu SanPhamSize, KHONG dung Size.phuThu global)
const currentSizeMeta = computed<SanPhamSize | undefined>(() =>
  sanPhamSizes.value.find((s) => s.idSize === currentSizeId.value)
);

// Size goc: co thuTu nho nhat
const baseSizeMeta = computed<SanPhamSize | undefined>(() => {
  if (sanPhamSizes.value.length === 0) return undefined;
  return [...sanPhamSizes.value].sort((a, b) => a.thuTu - b.thuTu)[0];
});

const isCurrentBaseSize = computed<boolean>(
  () => !!currentSizeMeta.value && !!baseSizeMeta.value &&
    currentSizeMeta.value.idSize === baseSizeMeta.value.idSize
);

// Co the chinh sua cong thuc: la size goc HOAC Manual
const canEditCurrentRecipe = computed<boolean>(
  () => isCurrentBaseSize.value || currentSizeMeta.value?.tuDongTinhNguyenLieu === false
);

// Loading rieng khi doi mode
const loadingModeSwitch = ref(false);

// ============================================================
// Columns
// ============================================================
const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.role === "ADMIN");

const nlColumns = computed(() => {
  const base: any[] = [
    { title: "Nguyên liệu", key: "tenNguyenLieu", ellipsis: true },
    { title: "Định lượng", dataIndex: "soLuongCanDung", width: 120, align: "center" as const },
    { title: "Đơn vị", key: "donViTinh", width: 90, align: "center" as const },
  ];
  if (isAdmin.value && canEditCurrentRecipe.value) {
    base.push({ title: "Thao tác", key: "action", width: 130, align: "center" as const });
  }
  return base;
});

const btpColumns = computed(() => {
  const base: any[] = [
    { title: "Bán thành phẩm", key: "tenBanThanhPham", ellipsis: true },
    { title: "Định lượng", dataIndex: "soLuongCanDung", width: 120, align: "center" as const },
    { title: "Đơn vị", key: "donViTinh", width: 90, align: "center" as const },
  ];
  if (isAdmin.value && canEditCurrentRecipe.value) {
    base.push({ title: "Thao tác", key: "action", width: 130, align: "center" as const });
  }
  return base;
});

// ============================================================
// Watch: khi drawer mo
// ============================================================
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.sanPham) {
      // Reset cache nguyen lieu / BTP de dam bao fresh data khi mo lai
      allNguyenLieu.value = [];
      allBtp.value = [];
      await loadSizes();
    } else if (!isOpen) {
      // Reset state khi dong
      sanPhamSizes.value = [];
      currentSizeId.value = null;
      congThucNL.value = [];
      congThucBtp.value = [];
    }
  }
);

// ============================================================
// Load sizes
// ============================================================
const loadSizes = async () => {
  if (!props.sanPham) return;
  loadingSizes.value = true;
  try {
    const res = await getSanPhamSizeByProduct(props.sanPham.idSanPham);
    const data: SanPhamSize[] = res.data.data ?? [];
    sanPhamSizes.value = [...data].sort((a, b) => a.thuTu - b.thuTu);
    if (sanPhamSizes.value.length > 0) {
      currentSizeId.value = sanPhamSizes.value[0].idSize;
      await loadRecipe();
    } else {
      currentSizeId.value = null;
      congThucNL.value = [];
      congThucBtp.value = [];
    }
  } catch (err) {
    const e = err as AxiosError<{ message: string }>;
    message.error(e.response?.data?.message || "Không thể tải danh sách size");
  } finally {
    loadingSizes.value = false;
  }
};

// ============================================================
// Load cong thuc theo size hien tai
// ============================================================
const loadRecipe = async () => {
  if (!props.sanPham || !currentSizeId.value) return;
  loadingRecipe.value = true;
  try {
    const [nlRes, btpRes] = await Promise.all([
      getCongThucNguyenLieu(props.sanPham.idSanPham, currentSizeId.value),
      getCongThucBtp(props.sanPham.idSanPham, currentSizeId.value),
    ]);
    // BE co the tra ve paginated hoac array thang
    congThucNL.value = nlRes.data.data?.content ?? nlRes.data.data ?? [];
    congThucBtp.value = btpRes.data.data ?? [];
  } catch (err) {
    const e = err as AxiosError<{ message: string }>;
    message.error(e.response?.data?.message || "Không thể tải công thức");
    congThucNL.value = [];
    congThucBtp.value = [];
  } finally {
    loadingRecipe.value = false;
  }
};

const onTabChange = async (key: number) => {
  currentSizeId.value = key;
  congThucNL.value = [];
  congThucBtp.value = [];
  await loadRecipe();
};

// ============================================================
// DOI MODE NGUYEN LIEU (tuDongTinhNguyenLieu)
// ============================================================
const handleChangeModeNguyenLieu = async (toAuto: boolean) => {
  const meta = currentSizeMeta.value;
  if (!meta || !props.sanPham) return;

  const doUpdate = async () => {
    loadingModeSwitch.value = true;
    try {
      const res = await updateSanPhamSizeNguyenLieu(
        meta.id,
        meta.idSanPham,
        meta.idSize,
        toAuto
      );
      // Cap nhat object SanPhamSize trong danh sach, giu nguyen tab
      const updatedMeta: SanPhamSize = res.data.data ?? { ...meta, tuDongTinhNguyenLieu: toAuto };
      const idx = sanPhamSizes.value.findIndex((s) => s.idSize === meta.idSize);
      if (idx !== -1) {
        sanPhamSizes.value = [
          ...sanPhamSizes.value.slice(0, idx),
          { ...sanPhamSizes.value[idx], tuDongTinhNguyenLieu: updatedMeta.tuDongTinhNguyenLieu },
          ...sanPhamSizes.value.slice(idx + 1),
        ];
      }
      await loadRecipe();
      message.success(toAuto ? "Đã chuyển sang Tự động" : "Đã chuyển sang Nhập tay");
    } catch (err) {
      const e = err as AxiosError<{ message: string }>;
      message.error(e.response?.data?.message || "Có lỗi khi đổi chế độ nguyên liệu");
    } finally {
      loadingModeSwitch.value = false;
    }
  };

  if (toAuto) {
    // MANUAL -> AUTO: can canh bao
    Modal.confirm({
      title: "Chuyển sang Tự động?",
      content:
        "Chuyển sang Tự động sẽ tính lại công thức nguyên liệu và bán thành phẩm theo size gốc. Dữ liệu nhập tay hiện tại sẽ bị ghi đè.",
      okText: "Xác nhận",
      cancelText: "Hủy",
      okType: "danger",
      onOk: doUpdate,
    });
  } else {
    // AUTO -> MANUAL: doi ngay, backend giu nguyen cong thuc
    await doUpdate();
  }
};

// ============================================================
// NGUYEN LIEU
// ============================================================
const nlModalOpen = ref(false);
const savingNL = ref(false);
const editingNL = ref<CongThucNguyenLieu | null>(null);
const loadingNLList = ref(false);
const allNguyenLieu = ref<NguyenLieuCongThuc[]>([]);

const nlForm = ref<{
  idNguyenLieu: number | null;
  soLuong: number | null;
  donViTinh: string;
}>({
  idNguyenLieu: null,
  soLuong: null,
  donViTinh: "",
});

// Kiem tra NL da co trong cong thuc (tru row dang sua)
const isNLDisabled = (idNL: number): boolean => {
  return congThucNL.value.some(
    (row) =>
      row.nguyenLieu.idNguyenLieu === idNL &&
      (editingNL.value === null || row.idCtsp !== editingNL.value.idCtsp)
  );
};

// Filter cho a-select show-search (dung option.label)
const filterNLOption = (input: string, option: any): boolean => {
  const label: string = option?.label ?? "";
  return label.toLowerCase().includes(input.toLowerCase());
};

const filterBtpOption = (input: string, option: any): boolean => {
  const label: string = option?.label ?? "";
  return label.toLowerCase().includes(input.toLowerCase());
};

const loadNguyenLieu = async () => {
  if (allNguyenLieu.value.length > 0) return;
  loadingNLList.value = true;
  try {
    const res = await getNguyenLieuForFormula();
    allNguyenLieu.value = res.data.data?.content ?? res.data.data ?? [];
  } catch {
    allNguyenLieu.value = [];
  } finally {
    loadingNLList.value = false;
  }
};

const openAddNL = async () => {
  editingNL.value = null;
  nlForm.value = { idNguyenLieu: null, soLuong: null, donViTinh: "" };
  await loadNguyenLieu();
  nlModalOpen.value = true;
};

const openEditNL = async (record: CongThucNguyenLieu) => {
  editingNL.value = record;
  nlForm.value = {
    idNguyenLieu: record.nguyenLieu.idNguyenLieu,
    soLuong: record.soLuongCanDung,
    donViTinh: record.nguyenLieu.donViTinh,
  };
  await loadNguyenLieu();
  nlModalOpen.value = true;
};

const onSelectNL = (idNL: number) => {
  const nl = allNguyenLieu.value.find((n) => n.idNguyenLieu === idNL);
  nlForm.value.donViTinh = nl?.donViTinh ?? "";
};

const closeNLModal = () => {
  nlModalOpen.value = false;
  editingNL.value = null;
};

const submitNL = async () => {
  if (!nlForm.value.idNguyenLieu) {
    message.warning("Vui lòng chọn nguyên liệu");
    return;
  }
  if (!nlForm.value.soLuong || nlForm.value.soLuong <= 0) {
    message.warning("Định lượng phải lớn hơn 0");
    return;
  }
  if (!props.sanPham || !currentSizeId.value) return;

  savingNL.value = true;
  try {
    const body: CongThucNguyenLieuRequest = {
      idSanPham: props.sanPham.idSanPham,
      idSize: currentSizeId.value,
      idNguyenLieu: nlForm.value.idNguyenLieu,
      soLuongCanDung: nlForm.value.soLuong,
    };
    if (editingNL.value) {
      await updateCongThucNguyenLieu(editingNL.value.idCtsp, body);
      message.success("Cập nhật nguyên liệu thành công");
    } else {
      await createCongThucNguyenLieu(body);
      message.success("Thêm nguyên liệu thành công");
    }
    nlModalOpen.value = false;
    editingNL.value = null;
    await loadRecipe();
  } catch (err) {
    const e = err as AxiosError<{ message: string }>;
    message.error(e.response?.data?.message || "Có lỗi xảy ra");
  } finally {
    savingNL.value = false;
  }
};

const deleteNL = async (idCtsp: number) => {
  try {
    await deleteCongThucNguyenLieu(idCtsp);
    message.success("Đã xóa nguyên liệu khỏi công thức");
    await loadRecipe();
  } catch (err) {
    const e = err as AxiosError<{ message: string }>;
    message.error(e.response?.data?.message || "Có lỗi xảy ra");
  }
};

// ============================================================
// BAN THANH PHAM
// ============================================================
const btpModalOpen = ref(false);
const savingBtp = ref(false);
const editingBtp = ref<CongThucBtp | null>(null);
const loadingBtpList = ref(false);
const allBtp = ref<BanThanhPham[]>([]);

const btpForm = ref<{
  idBanThanhPham: number | null;
  soLuong: number | null;
  donViTinh: string;
}>({
  idBanThanhPham: null,
  soLuong: null,
  donViTinh: "",
});

// Kiem tra BTP da co trong cong thuc (tru row dang sua)
const isBtpDisabled = (idBtp: number): boolean => {
  return congThucBtp.value.some(
    (row) =>
      row.idBanThanhPham === idBtp &&
      (editingBtp.value === null || row.id !== editingBtp.value.id)
  );
};

const loadBtpList = async () => {
  if (allBtp.value.length > 0) return;
  loadingBtpList.value = true;
  try {
    const res = await getBanThanhPham();
    allBtp.value = res.data.data ?? [];
  } catch {
    allBtp.value = [];
  } finally {
    loadingBtpList.value = false;
  }
};

const openAddBtp = async () => {
  editingBtp.value = null;
  btpForm.value = { idBanThanhPham: null, soLuong: null, donViTinh: "" };
  await loadBtpList();
  btpModalOpen.value = true;
};

const openEditBtp = async (record: CongThucBtp) => {
  editingBtp.value = record;
  btpForm.value = {
    idBanThanhPham: record.idBanThanhPham,
    soLuong: record.soLuongCanDung,
    donViTinh: record.donViTinh,
  };
  await loadBtpList();
  btpModalOpen.value = true;
};

const onSelectBtp = (idBtp: number) => {
  const b = allBtp.value.find((x) => x.idBanThanhPham === idBtp);
  btpForm.value.donViTinh = b?.donViTinh ?? "";
};

const closeBtpModal = () => {
  btpModalOpen.value = false;
  editingBtp.value = null;
};

const submitBtp = async () => {
  if (!btpForm.value.idBanThanhPham) {
    message.warning("Vui lòng chọn bán thành phẩm");
    return;
  }
  if (!btpForm.value.soLuong || btpForm.value.soLuong <= 0) {
    message.warning("Định lượng phải lớn hơn 0");
    return;
  }
  if (!props.sanPham || !currentSizeId.value) return;

  savingBtp.value = true;
  try {
    const body: CongThucBtpRequest = {
      idSanPham: props.sanPham.idSanPham,
      idSize: currentSizeId.value,
      idBanThanhPham: btpForm.value.idBanThanhPham,
      soLuongCanDung: btpForm.value.soLuong,
    };
    if (editingBtp.value) {
      await updateCongThucBtp(editingBtp.value.id, body);
      message.success("Cập nhật bán thành phẩm thành công");
    } else {
      await createCongThucBtp(body);
      message.success("Thêm bán thành phẩm thành công");
    }
    btpModalOpen.value = false;
    editingBtp.value = null;
    await loadRecipe();
  } catch (err) {
    const e = err as AxiosError<{ message: string }>;
    message.error(e.response?.data?.message || "Có lỗi xảy ra");
  } finally {
    savingBtp.value = false;
  }
};

const deleteBtp = async (id: number) => {
  try {
    await deleteCongThucBtp(id);
    message.success("Đã xóa bán thành phẩm khỏi công thức");
    await loadRecipe();
  } catch (err) {
    const e = err as AxiosError<{ message: string }>;
    message.error(e.response?.data?.message || "Có lỗi xảy ra");
  }
};

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

:deep(.ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn) {
  font-weight: 700;
}

:deep(.ant-descriptions-item-label) {
  font-weight: 600;
  background: #fafafa;
}
</style>
