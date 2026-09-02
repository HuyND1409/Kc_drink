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

      <!-- SAO CHEP CONG THUC (chi hien khi >= 2 size) -->
      <div
        v-if="sanPhamSizes.length >= 2"
        style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding:12px 16px;background:#f0f5ff;border:1px solid #d6e4ff;border-radius:8px;"
      >
        <span style="font-weight:600;white-space:nowrap;color:#1d39c4;">📋 Sao chép từ size:</span>
        <a-select
          v-model:value="copySourceSizeId"
          style="width:140px;"
          placeholder="Chọn size nguồn"
          allow-clear
        >
          <a-select-option
            v-for="s in sanPhamSizes.filter(s => s.idSize !== currentSizeId)"
            :key="s.idSize"
            :value="s.idSize"
          >
            {{ s.tenSize }}
          </a-select-option>
        </a-select>
        <a-button
          type="primary"
          ghost
          :disabled="!copySourceSizeId"
          :loading="loadingCopy"
          @click="handleCopyRecipe"
        >
          Sao chép công thức
        </a-button>
      </div>

      <!-- TABS SIZE -->
      <a-tabs v-model:activeKey="currentSizeId" @change="onTabChange" style="margin-bottom:8px;">
        <a-tab-pane
          v-for="s in sanPhamSizes"
          :key="s.idSize"
          :tab="s.tenSize"
        />
      </a-tabs>

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
            <a-button type="primary" size="small" @click="openAddNL">
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
                <div style="display:flex;gap:6px;justify-content:center;">
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
            <a-button type="primary" size="small" @click="openAddBtp">
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
                <div style="display:flex;gap:6px;justify-content:center;">
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

// Copy
const copySourceSizeId = ref<number | null>(null);
const loadingCopy = ref(false);

// Meta cua size dang active (lay phuThu tu SanPhamSize, KHONG dung Size.phuThu global)
const currentSizeMeta = computed<SanPhamSize | undefined>(() =>
  sanPhamSizes.value.find((s) => s.idSize === currentSizeId.value)
);

// ============================================================
// Columns
// ============================================================
const nlColumns = [
  { title: "Nguyên liệu", key: "tenNguyenLieu", ellipsis: true },
  { title: "Định lượng", dataIndex: "soLuongCanDung", width: 120, align: "center" as const },
  { title: "Đơn vị", key: "donViTinh", width: 90, align: "center" as const },
  { title: "Thao tác", key: "action", width: 130, align: "center" as const },
];

const btpColumns = [
  { title: "Bán thành phẩm", key: "tenBanThanhPham", ellipsis: true },
  { title: "Định lượng", dataIndex: "soLuongCanDung", width: 120, align: "center" as const },
  { title: "Đơn vị", key: "donViTinh", width: 90, align: "center" as const },
  { title: "Thao tác", key: "action", width: 130, align: "center" as const },
];

// ============================================================
// Watch: khi drawer mo
// ============================================================
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.sanPham) {
      copySourceSizeId.value = null;
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
  copySourceSizeId.value = null;
  congThucNL.value = [];
  congThucBtp.value = [];
  await loadRecipe();
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

// ============================================================
// SAO CHEP CONG THUC
// ============================================================
const handleCopyRecipe = async () => {
  if (!props.sanPham || !currentSizeId.value || !copySourceSizeId.value) return;

  // Buoc 1: kiem tra current size da co cong thuc chua
  const hasCurrentRecipe = congThucNL.value.length > 0 || congThucBtp.value.length > 0;
  if (hasCurrentRecipe) {
    message.warning(
      "Size hiện tại đã có công thức. Hãy xóa hoặc chỉnh sửa công thức trước khi sao chép."
    );
    return;
  }

  // Buoc 2: load cong thuc source
  loadingCopy.value = true;
  try {
    const [srcNlRes, srcBtpRes] = await Promise.all([
      getCongThucNguyenLieu(props.sanPham.idSanPham, copySourceSizeId.value),
      getCongThucBtp(props.sanPham.idSanPham, copySourceSizeId.value),
    ]);

    const srcNL: CongThucNguyenLieu[] =
      srcNlRes.data.data?.content ?? srcNlRes.data.data ?? [];
    const srcBtp: CongThucBtp[] = srcBtpRes.data.data ?? [];

    if (srcNL.length === 0 && srcBtp.length === 0) {
      message.warning("Size nguồn chưa có công thức");
      return;
    }

    const sourceName =
      sanPhamSizes.value.find((s) => s.idSize === copySourceSizeId.value)?.tenSize ?? "";
    const targetName =
      sanPhamSizes.value.find((s) => s.idSize === currentSizeId.value)?.tenSize ?? "";

    // Buoc 3: confirm
    Modal.confirm({
      title: "Xác nhận sao chép công thức",
      content: `Sao chép toàn bộ công thức từ size ${sourceName} sang size ${targetName}?`,
      okText: "Sao chép",
      cancelText: "Hủy",
      onOk: async () => {
        // Buoc 4: POST tung nguyen lieu + BTP sang currentSizeId
        try {
          const nlPromises = srcNL.map((row) =>
            createCongThucNguyenLieu({
              idSanPham: props.sanPham!.idSanPham,
              idSize: currentSizeId.value!,
              idNguyenLieu: row.nguyenLieu.idNguyenLieu,
              soLuongCanDung: row.soLuongCanDung,
            })
          );
          const btpPromises = srcBtp.map((row) =>
            createCongThucBtp({
              idSanPham: props.sanPham!.idSanPham,
              idSize: currentSizeId.value!,
              idBanThanhPham: row.idBanThanhPham,
              soLuongCanDung: row.soLuongCanDung,
            })
          );
          await Promise.all([...nlPromises, ...btpPromises]);
          message.success("Sao chép công thức thành công");
          copySourceSizeId.value = null;
          await loadRecipe();
        } catch (err) {
          const e = err as AxiosError<{ message: string }>;
          message.error(e.response?.data?.message || "Có lỗi khi sao chép công thức");
        }
      },
    });
  } catch (err) {
    const e = err as AxiosError<{ message: string }>;
    message.error(e.response?.data?.message || "Có lỗi xảy ra");
  } finally {
    loadingCopy.value = false;
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
