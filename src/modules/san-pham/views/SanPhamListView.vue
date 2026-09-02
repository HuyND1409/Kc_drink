<template>
  <a-card :bordered="false">
    <template #title>
      <span style="font-size:22px;font-weight:700;">
        🧋 Quản lý sản phẩm
      </span>
    </template>

    <div class="toolbar">
      <div class="toolbar-left">
        <a-input-search
          v-model:value="keyword"
          placeholder="Tìm theo tên sản phẩm..."
          allow-clear
          style="width:280px"
          @search="onSearch"
        />

        <a-select
          v-model:value="trangThai"
          placeholder="Trạng thái"
          allow-clear
          style="width:150px"
          @change="onSearch"
        >
          <a-select-option :value="1">Đang bán</a-select-option>
          <a-select-option :value="0">Ngừng bán</a-select-option>
        </a-select>

        <a-tooltip title="Làm mới">
          <a-button shape="circle" @click="resetFilter">↻</a-button>
        </a-tooltip>
      </div>

      <div style="display:flex;gap:12px;">
        <a-button type="default" size="large" @click="openSizeManagement">
          Quản lý size
        </a-button>
        <a-button type="primary" size="large" @click="onAdd">
          + Thêm sản phẩm
        </a-button>
      </div>
    </div>

    <!-- Bang danh sach san pham -->
    <a-table
      :columns="columns"
      :data-source="dsSanPham"
      :loading="loading"
      :pagination="false"
      row-key="idSanPham"
      bordered
    >
      <template #bodyCell="{ column, record }">
        <!-- Gia -->
        <template v-if="column.key === 'gia'">
          <span class="price-cell">{{ formatCurrency(record.gia) }}</span>
        </template>

        <!-- Size -->
        <template v-if="column.key === 'sizes'">
          <a-spin v-if="loadingSizes[record.idSanPham]" size="small" />
          <div v-else style="display:flex;flex-wrap:wrap;gap:4px;">
            <a-tooltip
              v-for="s in (sizeMap[record.idSanPham] ?? [])"
              :key="s.idSize"
              :title="`+${formatCurrency(s.phuThu)}`"
            >
              <a-tag color="blue" style="font-weight:600;cursor:default;">
                {{ s.tenSize }}
              </a-tag>
            </a-tooltip>
            <span
              v-if="!(sizeMap[record.idSanPham]?.length)"
              style="color:#bbb;font-size:13px;"
            >—</span>
          </div>
        </template>

        <!-- Mo ta -->
        <template v-if="column.key === 'moTa'">
          <span style="color:#666;">{{ record.moTa || '—' }}</span>
        </template>

        <!-- Trang thai -->
        <template v-if="column.key === 'trangThai'">
          <a-tag :color="record.trangThai === 1 ? 'success' : 'error'">
            {{ record.trangThai === 1 ? 'Đang bán' : 'Ngừng bán' }}
          </a-tag>
        </template>

        <!-- Hanh dong -->
        <template v-if="column.key === 'action'">
          <a-dropdown placement="bottomRight">
            <a-button size="small" style="width:40px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;margin:0 auto;">
              <MoreOutlined />
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="openDrawer(record)">Công thức</a-menu-item>
                <a-menu-item @click="onEdit(record)">Sửa</a-menu-item>
                <a-menu-divider />
                <a-menu-item v-if="record.trangThai === 1" danger @click="confirmLock(record)">
                  Ngừng bán
                </a-menu-item>
                <a-menu-item v-else style="color:#52c41a;" @click="confirmUnlock(record)">
                  Mở bán
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>
      </template>
    </a-table>

    <!-- Phan trang -->
    <div style="display:flex;justify-content:flex-end;margin-top:20px;">
      <a-pagination
        :current="currentPage"
        :pageSize="pageSize"
        :total="total"
        show-size-changer
        :show-total="(total: number) => `Tổng ${total} sản phẩm`"
        @change="onPageChange"
      />
    </div>

    <!-- Modal them/sua san pham -->
    <SanPhamForm
      :open="openModal"
      :editData="editing"
      :editSanPhamSizes="editingSanPhamSizes"
      @close="handleCloseModal"
      @save="onSave"
    />

    <!-- Drawer cong thuc -->
    <CongThucSanPhamDrawer
      :open="openCongThuc"
      :sanPham="selectedSanPham"
      @close="openCongThuc = false"
    />
    <!-- Modal Quan ly Size -->
    <SizeManagementModal
      :open="sizeManagementOpen"
      @close="sizeManagementOpen = false"
      @reload="loadData"
    />
  </a-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { message, Modal } from "ant-design-vue";
import { MoreOutlined } from "@ant-design/icons-vue";
import type { AxiosError } from "axios";

import SanPhamForm from "../components/SanPhamForm.vue";
import CongThucSanPhamDrawer from "../components/CongThucSanPhamDrawer.vue";
import SizeManagementModal from "../components/SizeManagementModal.vue";

import {
  getSanPham,
  createSanPham,
  updateSanPham,
  lockSanPham,
  unlockSanPham,
  getSanPhamSizeByProduct,
  createSanPhamSize,
  updateSanPhamSize,
  deleteSanPhamSize,
  getCongThucNguyenLieu,
  getCongThucBtp,
} from "../api/sanPhamApi";
import type { SanPham, SanPhamRequest, SanPhamSize, ProductSizeSelection } from "../types/sanPham";

// ============================================================
// State
// ============================================================
const dsSanPham = ref<SanPham[]>([]);
const loading = ref(false);
const openModal = ref(false);
const openCongThuc = ref(false);
const sizeManagementOpen = ref(false);

const openSizeManagement = () => {
  sizeManagementOpen.value = true;
};

const keyword = ref("");
const trangThai = ref<number>();
const currentPage = ref(1);
const pageSize = ref(5);
const total = ref(0);

const editing = ref<SanPham | undefined>(undefined);
// Luu SanPhamSize hien tai cua san pham dang sua (co phuThu rieng)
const editingSanPhamSizes = ref<{ idSize: number; phuThu: number }[]>([]);
const selectedSanPham = ref<SanPham | undefined>(undefined);

// Map idSanPham -> danh sach SanPhamSize
const sizeMap = ref<Record<number, SanPhamSize[]>>({});
const loadingSizes = ref<Record<number, boolean>>({});

// ============================================================
// Columns
// ============================================================
const columns = [
  {
    title: "#",
    dataIndex: "idSanPham",
    width: 70,
    align: "center" as const,
    customRender: ({ text }: { text: number }) => `SP${String(text).padStart(3, "0")}`,
  },
  { title: "Tên sản phẩm", dataIndex: "tenSanPham", ellipsis: true },
  { title: "Giá gốc", key: "gia", width: 140, align: "right" as const },
  { title: "Size", key: "sizes", width: 180 },
  { title: "Mô tả", key: "moTa", ellipsis: true },
  { title: "Trạng thái", key: "trangThai", width: 120, align: "center" as const },
  { title: "Thao tác", key: "action", width: 90, align: "center" as const },
];

// ============================================================
// Format
// ============================================================
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

// ============================================================
// Load danh sach san pham
// ============================================================
const loadData = async () => {
  loading.value = true;
  try {
    const res = await getSanPham(
      keyword.value,
      trangThai.value,
      currentPage.value - 1,
      pageSize.value
    );
    const content: SanPham[] = res.data.data?.content ?? [];
    dsSanPham.value = content;
    total.value = res.data.data?.totalElements ?? 0;

    // Load size cho tat ca san pham hien thi
    await loadSizesForProducts(content);
  } finally {
    loading.value = false;
  }
};

// Load size cho danh sach san pham bang Promise.all
const loadSizesForProducts = async (products: SanPham[]) => {
  const tasks = products.map(async (sp) => {
    loadingSizes.value[sp.idSanPham] = true;
    try {
      const res = await getSanPhamSizeByProduct(sp.idSanPham);
      const sizes: SanPhamSize[] = res.data.data ?? [];
      sizeMap.value[sp.idSanPham] = [...sizes].sort((a, b) => a.thuTu - b.thuTu);
    } catch {
      sizeMap.value[sp.idSanPham] = [];
    } finally {
      loadingSizes.value[sp.idSanPham] = false;
    }
  });
  await Promise.all(tasks);
};

// ============================================================
// Tim kiem & Phan trang
// ============================================================
const onSearch = () => {
  currentPage.value = 1;
  loadData();
};

const resetFilter = () => {
  keyword.value = "";
  trangThai.value = undefined;
  currentPage.value = 1;
  loadData();
};

const onPageChange = (page: number, size: number) => {
  currentPage.value = page;
  pageSize.value = size;
  loadData();
};

// ============================================================
// Mo / Dong modal
// ============================================================
const onAdd = () => {
  editing.value = undefined;
  editingSanPhamSizes.value = [];
  openModal.value = true;
};

const onEdit = async (record: SanPham) => {
  editing.value = { ...record };
  // Lay SanPhamSize hien tai de lay phuThu rieng
  try {
    const res = await getSanPhamSizeByProduct(record.idSanPham);
    const sizes: SanPhamSize[] = res.data.data ?? [];
    editingSanPhamSizes.value = sizes.map((s) => ({
      idSize: s.idSize,
      phuThu: s.phuThu,
    }));
  } catch {
    editingSanPhamSizes.value = [];
  }
  openModal.value = true;
};

const handleCloseModal = () => {
  editing.value = undefined;
  editingSanPhamSizes.value = [];
  openModal.value = false;
};

// Mo drawer cong thuc
const openDrawer = (record: SanPham) => {
  selectedSanPham.value = record;
  openCongThuc.value = true;
};

// ============================================================
// Luu san pham (Them + Sua)
// ============================================================
const onSave = async (payload: { product: SanPhamRequest; selectedSizes: ProductSizeSelection[] }) => {
  const { product, selectedSizes } = payload;

  if (editing.value) {
    // === SUA ===
    await handleUpdate(editing.value.idSanPham, product, selectedSizes);
  } else {
    // === THEM ===
    await handleCreate(product, selectedSizes);
  }
};

const handleCreate = async (product: SanPhamRequest, selectedSizes: ProductSizeSelection[]) => {
  try {
    // 1. POST /san-pham
    const res = await createSanPham(product);
    const newId: number = res.data.data?.idSanPham ?? res.data.data?.id;

    // 2. POST /san-pham-size cho tung size (co phuThu rieng)
    await Promise.all(
      selectedSizes.map((s) => createSanPhamSize(newId, s.idSize, s.phuThu))
    );

    message.success("Thêm sản phẩm thành công!");
    openModal.value = false;
    editing.value = undefined;
    editingSanPhamSizes.value = [];

    // 3. Load lai danh sach
    await loadData();

    // 4. Tu dong mo drawer cong thuc
    const created = dsSanPham.value.find((sp) => sp.idSanPham === newId);
    if (created) {
      selectedSanPham.value = created;
    } else {
      selectedSanPham.value = { ...product, idSanPham: newId, trangThai: 1 } as SanPham;
    }
    openCongThuc.value = true;
  } catch (err) {
    const e = err as AxiosError<{ message: string }>;
    message.error(e.response?.data?.message || "Có lỗi xảy ra khi thêm sản phẩm");
  }
};

const handleUpdate = async (
  idSanPham: number,
  product: SanPhamRequest,
  selectedSizes: ProductSizeSelection[]
) => {
  try {
    // 1. PUT /san-pham/{id}
    await updateSanPham(idSanPham, product);

    // 2. Lay danh sach SanPhamSize hien tai
    const res = await getSanPhamSizeByProduct(idSanPham);
    const currentSizes: SanPhamSize[] = res.data.data ?? [];
    const currentSizeIds = currentSizes.map((s) => s.idSize);
    const selectedSizeIds = selectedSizes.map((s) => s.idSize);

    // 3A. SIZE MOI: them
    const toAdd = selectedSizes.filter((s) => !currentSizeIds.includes(s.idSize));
    for (const s of toAdd) {
      await createSanPhamSize(idSanPham, s.idSize, s.phuThu);
    }

    // 3B. SIZE VAN CON: cap nhat phuThu neu thay doi
    for (const s of selectedSizes) {
      const existing = currentSizes.find((c) => c.idSize === s.idSize);
      if (existing && existing.phuThu !== s.phuThu) {
        await updateSanPhamSize(existing.id, idSanPham, s.idSize, s.phuThu);
      }
    }

    // 3C. SIZE BI BO: kiem tra cong thuc truoc khi xoa
    const toRemove = currentSizes.filter((s) => !selectedSizeIds.includes(s.idSize));
    for (const sps of toRemove) {
      // Kiem tra cong thuc nguyen lieu truc tiep
      const nlRes = await getCongThucNguyenLieu(idSanPham, sps.idSize, 0, 1);
      const nlCount =
        nlRes.data.data?.totalElements ?? (nlRes.data.data?.content?.length ?? 0);

      // Kiem tra cong thuc BTP
      const btpRes = await getCongThucBtp(idSanPham, sps.idSize);
      const btpList = btpRes.data.data ?? [];

      if (nlCount > 0 || btpList.length > 0) {
        message.warning(
          `Size ${sps.tenSize} đang có công thức. Hãy xóa công thức của size này trước.`
        );
        continue;
      }

      // An toan: xoa
      await deleteSanPhamSize(sps.id);
    }

    message.success("Cập nhật sản phẩm thành công!");
    openModal.value = false;
    editing.value = undefined;
    editingSanPhamSizes.value = [];
    await loadData();
  } catch (err) {
    const e = err as AxiosError<{ message: string }>;
    message.error(e.response?.data?.message || "Có lỗi xảy ra khi cập nhật sản phẩm");
  }
};

// ============================================================
// Khoa / Mo khoa
// ============================================================
const onLock = async (id: number) => {
  try {
    await lockSanPham(id);
    message.success("Ngừng bán sản phẩm thành công");
    loadData();
  } catch (err) {
    const e = err as AxiosError<{ message: string }>;
    message.error(e.response?.data?.message || "Có lỗi xảy ra");
  }
};

const confirmLock = (record: SanPham) => {
  Modal.confirm({
    title: "Ngừng bán sản phẩm này?",
    okText: "Ngừng bán",
    cancelText: "Hủy",
    okType: "danger",
    onOk: () => onLock(record.idSanPham),
  });
};

const onUnlock = async (id: number) => {
  try {
    await unlockSanPham(id);
    message.success("Mở bán sản phẩm thành công");
    loadData();
  } catch (err) {
    const e = err as AxiosError<{ message: string }>;
    message.error(e.response?.data?.message || "Có lỗi xảy ra");
  }
};

const confirmUnlock = (record: SanPham) => {
  Modal.confirm({
    title: "Mở bán sản phẩm này?",
    okText: "Mở bán",
    cancelText: "Hủy",
    onOk: () => onUnlock(record.idSanPham),
  });
};

// ============================================================
// Init
// ============================================================
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.ant-card {
  border-radius: 12px;
}

.price-cell {
  font-weight: 600;
  color: #d46b08;
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
</style>
