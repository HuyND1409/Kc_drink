<template>
  <a-card :bordered="false">
    <template #title>
      <span style="font-size:22px;font-weight:700;">
        🎁 Quản lý khuyến mãi
      </span>
    </template>

    <div class="toolbar">
      <div class="toolbar-left">
        <a-input-search
          v-model:value="filters.keyword"
          placeholder="Tìm theo tên CTKM..."
          allow-clear
          style="width:280px"
          @search="onSearch"
        />

        <a-select
          v-model:value="filters.trangThai"
          placeholder="Trạng thái"
          allow-clear
          style="width:180px"
          @change="onSearch"
        >
          <a-select-option :value="1">Đang bật</a-select-option>
          <a-select-option :value="0">Ngừng hoạt động</a-select-option>
        </a-select>

        <a-tooltip title="Làm mới">
          <a-button shape="circle" @click="resetFilter">↻</a-button>
        </a-tooltip>
      </div>

      <div>
        <a-button type="primary" size="large" @click="openCreateForm">
          + Thêm khuyến mãi
        </a-button>
      </div>
    </div>

    <a-table
      :columns="columns"
      :data-source="dsKhuyenMai"
      :loading="loading"
      :pagination="pagination"
      row-key="idKm"
      @change="handleTableChange"
      bordered
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'idKm'">
          <span style="font-weight: 600">#{{ record.idKm }}</span>
        </template>
        
        <template v-if="column.key === 'tenKm'">
          <span style="font-weight: 600">{{ record.tenKm }}</span>
          <div style="font-size: 12px; color: #8c8c8c" v-if="record.soLuongSanPham">
            Áp dụng cho {{ record.soLuongSanPham }} SP
          </div>
        </template>

        <template v-if="column.key === 'giaTriGiam'">
          <span class="text-danger" style="font-weight: 600">
            {{ formatGiaTriGiam(record) }}
          </span>
        </template>

        <template v-if="column.key === 'thoiGian'">
          <div>Từ: {{ formatDateTime(record.ngayBatDau) }}</div>
          <div>Đến: {{ formatDateTime(record.ngayKetThuc) }}</div>
        </template>

        <template v-if="column.key === 'trangThaiHienThi'">
          <a-tag :color="getStatusColor(record.trangThaiHienThi)">
            {{ formatStatus(record.trangThaiHienThi) }}
          </a-tag>
        </template>

        <template v-if="column.key === 'action'">
          <a-dropdown :trigger="['click']" placement="bottomRight">
            <a-button class="more-button" size="small">
              <MoreOutlined />
            </a-button>

            <template #overlay>
              <a-menu>
                <a-menu-item @click="openEditForm(record.idKm)">
                  <EditOutlined />
                  Sửa
                </a-menu-item>

                <a-menu-divider />

                <a-menu-item
                  v-if="record.trangThai === 1"
                  danger
                  @click="confirmToggleLock(record)"
                >
                  <LockOutlined />
                  Ngừng hoạt động
                </a-menu-item>

                <a-menu-item
                  v-else
                  style="color: #52c41a"
                  @click="confirmToggleLock(record)"
                >
                  <UnlockOutlined />
                  Mở hoạt động
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>
      </template>
    </a-table>

    <KhuyenMaiForm
      :open="formOpen"
      :edit-id="editId"
      @close="formOpen = false"
      @success="onSearch"
    />
  </a-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { message, Modal } from "ant-design-vue";
import {
  MoreOutlined,
  EditOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons-vue";
import dayjs from 'dayjs';
import { getDanhSachKhuyenMai, khoaKhuyenMai, moKhoaKhuyenMai } from '../api/khuyenMaiApi';
import type { KhuyenMai, GetKhuyenMaiParams } from '../types/khuyenMai';
import KhuyenMaiForm from '../components/KhuyenMaiForm.vue';

const loading = ref(false);
const dsKhuyenMai = ref<KhuyenMai[]>([]);

const filters = reactive({
  keyword: undefined as string | undefined,
  trangThai: undefined as number | undefined,
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `Tổng cộng ${total} khuyến mãi`,
});

const columns = [
  { title: "ID", key: "idKm", width: 80 },
  { title: "Tên chương trình", key: "tenKm", width: 250 },
  { title: "Giá trị giảm", key: "giaTriGiam", width: 150 },
  { title: "Thời gian", key: "thoiGian", width: 200 },
  { title: "Trạng thái", key: "trangThaiHienThi", width: 150 },
  { title: "Thao tác", key: "action", width: 90, align: "center" as const },
];

const formOpen = ref(false);
const editId = ref<number | null>(null);

const fetchData = async () => {
  loading.value = true;
  try {
    const params: GetKhuyenMaiParams = {
      ...filters,
      page: pagination.current - 1,
      size: pagination.pageSize,
    };
    const res = await getDanhSachKhuyenMai(params);
    const data = res.data?.data ?? res.data;
    dsKhuyenMai.value = data.content;
    pagination.total = data.totalElements;
  } catch (err: any) {
    message.error(err.response?.data?.message || "Lỗi tải danh sách khuyến mãi");
  } finally {
    loading.value = false;
  }
};

const onSearch = () => {
  pagination.current = 1;
  fetchData();
};

const resetFilter = () => {
  filters.keyword = undefined;
  filters.trangThai = undefined;
  onSearch();
};

const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
};

const openCreateForm = () => {
  editId.value = null;
  formOpen.value = true;
};

const openEditForm = (id: number) => {
  editId.value = id;
  formOpen.value = true;
};

const toggleLock = async (record: KhuyenMai) => {
  try {
    if (record.trangThai === 0) {
      await moKhoaKhuyenMai(record.idKm);
      message.success("Mở khóa thành công");
    } else {
      await khoaKhuyenMai(record.idKm);
      message.success("Khóa thành công");
    }
    fetchData();
  } catch (err: any) {
    message.error(err.response?.data?.message || "Lỗi thao tác");
  }
};

const confirmToggleLock = (record: KhuyenMai) => {
  const isUnlock = record.trangThai === 0;

  Modal.confirm({
    title: isUnlock
      ? "Mở hoạt động khuyến mãi?"
      : "Ngừng hoạt động khuyến mãi?",
    content: `Chương trình: ${record.tenKm}`,
    okText: "Đồng ý",
    cancelText: "Hủy",
    okButtonProps: isUnlock ? {} : { danger: true },
    onOk: () => toggleLock(record),
  });
};

onMounted(() => {
  fetchData();
});

// --- Formatters ---
const formatCurrency = (val: number) =>
  (val ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const formatGiaTriGiam = (record: KhuyenMai) => {
  if (record.loaiGiam === 'PHAN_TRAM') {
    return `${record.giaTriGiam}%`;
  }
  return formatCurrency(record.giaTriGiam);
};

const formatDateTime = (val?: string) =>
  val ? dayjs(val).format("DD/MM/YYYY HH:mm") : "";

const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    SAP_DIEN_RA: "Sắp diễn ra",
    DANG_DIEN_RA: "Đang diễn ra",
    DA_KET_THUC: "Đã kết thúc",
    NGUNG_HOAT_DONG: "Ngừng hoạt động",
  };
  return map[status] || status;
};

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    SAP_DIEN_RA: "orange",
    DANG_DIEN_RA: "success",
    DA_KET_THUC: "default",
    NGUNG_HOAT_DONG: "error",
  };
  return map[status] || "default";
};
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}
.toolbar-left {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.text-danger {
  color: #ff4d4f;
}
.more-button {
  width: 40px;
  height: 32px;
  padding: 0;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}
</style>
