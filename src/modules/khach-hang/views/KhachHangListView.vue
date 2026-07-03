<template>
  <a-card :bordered="false">

    <template #title>
      <span style="font-size:22px;font-weight:700">
        👤 Quản lý khách hàng
      </span>
    </template>

    <div class="toolbar">

      <div class="toolbar-left">

        <a-input-search v-model:value="keyword" placeholder="Nhập tên hoặc số điện thoại..." allow-clear
          style="width:320px" @search="onSearch" />

        <a-select v-model:value="trangThai" placeholder="Trạng thái" allow-clear style="width:170px" @change="loadData">

          <a-select-option :value="1">
            Hoạt động
          </a-select-option>

          <a-select-option :value="0">
            Đã khóa
          </a-select-option>

        </a-select>

        <a-tooltip title="Làm mới">

          <a-button shape="circle" @click="resetFilter">
            ↻
          </a-button>

        </a-tooltip>

      </div>

      <a-button type="primary" size="large" @click="onAdd">
        + Thêm khách hàng
      </a-button>

    </div>

    <KhachHangTable :data="dsKhachHang" :loading="loading" @edit="onEdit" @address="onAddress" @lock="onLock"
      @unlock="onUnlock" />

    <div style="display:flex; justify-content:flex-end; margin-top:20px;">

      <a-pagination :current="currentPage" :pageSize="pageSize" :total="total" show-size-changer
        :show-total="(total: number) => `Tổng ${total} khách hàng`" @change="onPageChange" />

    </div>

    <KhachHangForm
      :open="openModal"
      :editData="editing"
      @close="handleCloseModal"
      @save="saveKhachHang"
    />

    <DiaChiModal v-model:open="openDiaChi" :khachHang="selectedKhachHang" @update-default="updateDefaultAddress" />

  </a-card>
</template>

<script setup lang="ts">
import { onMounted, ref , watch} from "vue";
import { message } from "ant-design-vue";
import type { AxiosError } from "axios";
import KhachHangTable from "../components/KhachHangTable.vue";
import KhachHangForm from "../components/KhachHangForm.vue";
import DiaChiModal from "@/modules/dia_chi/components/DiaChiModal.vue";

import {
  getKhachHang,
  createKhachHang,
  lockKhachHang,
  unlockKhachHang,
  updateKhachHang
} from "../api/khachHangApi";

import type {
  KhachHang,
  KhachHangRequest,
} from "../types/khachHang";

const dsKhachHang = ref<KhachHang[]>([]);
const loading = ref(false);
const openModal = ref(false);

/* Chuẩn bị cho module địa chỉ */
const openDiaChi = ref(false);
const selectedKhachHang = ref<KhachHang>();

const keyword = ref("");
const trangThai = ref<number>();
const currentPage = ref(1);
const pageSize = ref(5);
const total = ref(0);

// Biến kiểm soát trạng thái sửa dữ liệu của nhóm bạn
const editing = ref<KhachHang>();

// --- LUỒNG XỬ LÝ ĐÓNG/MỞ MODAL CHUẨN XÁC ---

// Hàm xử lý dọn dẹp biến cũ khi nhấn nút Thêm mới
const onAdd = () => {
  editing.value = undefined;
  openModal.value = true;
};

// Hàm xử lý nạp dữ liệu khi nhấn nút Sửa từ bảng
const onEdit = (record: KhachHang) => {
  editing.value = { ...record };
  openModal.value = true;
};

// Hàm xử lý làm sạch trạng thái khi đóng Modal
const handleCloseModal = () => {
  editing.value = undefined;
  openModal.value = false;
};

const loadData = async () => {
  loading.value = true;
  try {
    const response = await getKhachHang(
      keyword.value,
      trangThai.value,
      currentPage.value - 1,
      pageSize.value
    );
    dsKhachHang.value = response.data.data.content;
    total.value = response.data.data.totalElements;
  } finally {
    loading.value = false;
  }
};

const updateDefaultAddress = (idKhachHang: number, diaChi: string) => {
  const kh = dsKhachHang.value.find(item => item.idKhachHang === idKhachHang);
  if (kh) {
    kh.diaChiMacDinh = diaChi;
  }
};

// Hàm lưu dữ liệu (Xử lý cả 2 luồng Thêm / Sửa từ API nhóm)
const saveKhachHang = async (data: KhachHangRequest) => {
  try {
    // Vì Form con ở bước trước đã tự động format ngày sinh thành "YYYY-MM-DD" chuẩn rồi,
    // Nên ở đây chúng ta lấy trực tiếp object dữ liệu 'data' để gửi đi, không cần format lại nữa.
    if (editing.value) {
      await updateKhachHang(
        editing.value.idKhachHang,
        data
      );
      message.success("Cập nhật khách hàng thành công");
    } else {
      await createKhachHang(
        data
      );
      message.success("Thêm khách hàng thành công");
    }

    editing.value = undefined;
    openModal.value = false;
    await loadData();
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    message.error(err.response?.data?.message || "Có lỗi xảy ra");
  }
};

/* Mở modal địa chỉ */
const onAddress = (record: KhachHang) => {
  selectedKhachHang.value = record;
  openDiaChi.value = true;
};

const onSearch = () => {
  currentPage.value = 1;
  loadData();
};

const onPageChange = (page: number, size: number) => {
  currentPage.value = page;
  pageSize.value = size;
  loadData();
};

const resetFilter = () => {
  keyword.value = "";
  trangThai.value = undefined;
  currentPage.value = 1;
  loadData();
};

const onLock = async (id: number) => {
  try {
    await lockKhachHang(id);
    message.success("Đã khóa khách hàng");
    loadData();
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    message.error(err.response?.data?.message || "Có lỗi xảy ra");
  }
};

const onUnlock = async (id: number) => {
  try {
    await unlockKhachHang(id);
    message.success("Đã mở khóa khách hàng");
    loadData();
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    message.error(err.response?.data?.message || "Có lỗi xảy ra");
  }
};

onMounted(() => {
  loadData();
});

// TỰ ĐỘNG LÀM MỚI BẢNG KHI ĐÓNG MODAL ĐỊA CHỈ
// Theo dõi biến openDiaChi, nếu nó chuyển từ true sang false (tức là modal vừa đóng lại)
watch(openDiaChi, async (newVal) => {
  if (!newVal) {
    // Gọi hàm loadData để "F5 ngầm" danh sách khách hàng ngoài bảng
    await loadData();
  }
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
</style>
