<template>
  <a-card :bordered="false" class="custom-card">

    <template #title>
      <span class="card-title">
        📋 Nhật ký thao tác
      </span>
      <div class="card-subtitle">
        Theo dõi các thao tác quan trọng được thực hiện trên hệ thống
      </div>
    </template>

    <div class="filter-bar">
      <a-input
        v-model:value="filterUsername"
        placeholder="Tìm theo tài khoản"
        allow-clear
        style="width: 180px"
        @press-enter="onSearch"
        @change="onInputChange"
      />
      <a-select
        v-model:value="filterHanhDong"
        placeholder="Hành động"
        allow-clear
        style="width: 160px"
        @change="onSearch"
      >
        <a-select-option value="THÊM">THÊM</a-select-option>
        <a-select-option value="CẬP NHẬT">CẬP NHẬT</a-select-option>
        <a-select-option value="KHÓA">KHÓA</a-select-option>
        <a-select-option value="MỞ KHÓA">MỞ KHÓA</a-select-option>
        <a-select-option value="NHẬP LÔ">NHẬP LÔ</a-select-option>
        <a-select-option value="IMPORT EXCEL">IMPORT EXCEL</a-select-option>
        <a-select-option value="TẶNG SINH NHẬT">TẶNG SINH NHẬT</a-select-option>
        <a-select-option value="TỰ ĐỘNG KHÓA">TỰ ĐỘNG KHÓA</a-select-option>
      </a-select>
      <a-select
        v-model:value="filterDoiTuong"
        placeholder="Đối tượng"
        allow-clear
        style="width: 160px"
        @change="onSearch"
      >
        <a-select-option value="KHÁCH HÀNG">KHÁCH HÀNG</a-select-option>
        <a-select-option value="NHÂN VIÊN">NHÂN VIÊN</a-select-option>
        <a-select-option value="VOUCHER">VOUCHER</a-select-option>
        <a-select-option value="TOPPING">TOPPING</a-select-option>
        <a-select-option value="LÔ TOPPING">LÔ TOPPING</a-select-option>
        <a-select-option value="NGUYÊN LIỆU">NGUYÊN LIỆU</a-select-option>
        <a-select-option value="LÔ NGUYÊN LIỆU">LÔ NGUYÊN LIỆU</a-select-option>
      </a-select>
      <a-range-picker
        v-model:value="filterDateRange"
        format="DD/MM/YYYY"
        value-format="YYYY-MM-DD"
        :placeholder="['Từ ngày', 'Đến ngày']"
        style="width: 240px"
        @change="onSearch"
      />
      <a-button type="primary" @click="onSearch">Tìm kiếm</a-button>
      <a-button @click="onReset">Làm mới</a-button>
    </div>

    <a-table :columns="columns" :data-source="danhSach" :loading="loading" :pagination="false" row-key="idNhatKy"
      :scroll="{ x: 900 }">
      <template #bodyCell="{ column, index, record }">

        <template v-if="column.key === 'stt'">
          {{ (currentPage - 1) * pageSize + index + 1 }}
        </template>

        <template v-else-if="column.key === 'thoiGian'">
          {{ formatThoiGian(record.thoiGian) }}
        </template>

        <template v-else-if="column.key === 'role'">
          <a-tag v-if="record.role === 'ADMIN'" color="purple">
            Quản lý
          </a-tag>

          <a-tag v-else-if="record.role === 'STAFF'" color="blue">
            Nhân viên
          </a-tag>

          <a-tag v-else-if="record.role === 'USER'" color="green">
            Khách hàng
          </a-tag>

          <span v-else>
            {{ record.role ?? "—" }}
          </span>
        </template>

        <template v-else-if="column.key === 'hanhDong'">
          <a-tag v-if="record.hanhDong === 'THÊM'" color="success">
            THÊM
          </a-tag>

          <a-tag v-else-if="record.hanhDong === 'CẬP NHẬT'" color="processing">
            CẬP NHẬT
          </a-tag>

          <a-tag v-else-if="record.hanhDong === 'KHÓA'" color="error">
            KHÓA
          </a-tag>

          <a-tag v-else-if="record.hanhDong === 'MỞ KHÓA'" color="warning">
            MỞ KHÓA
          </a-tag>

          <a-tag v-else-if="record.hanhDong === 'TEST'">
            TEST
          </a-tag>

          <a-tag v-else>
            {{ record.hanhDong }}
          </a-tag>
        </template>

        <template v-else-if="column.key === 'idDoiTuong'">
          {{ record.idDoiTuong ?? "—" }}
        </template>

        <template v-else-if="column.key === 'noiDung'">
          {{ record.noiDung ?? "—" }}
        </template>

      </template>
    </a-table>

    <div class="pagination-wrapper">
      <a-pagination :current="currentPage" :page-size="pageSize" :total="total"
        :show-total="(total: number) => `Tổng số: ${total} bản ghi`" :show-size-changer="true"
        :page-size-options="['5', '10', '20', '50']" @change="onPageChange" @showSizeChange="onPageSizeChange" />
    </div>

  </a-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import axios from "axios";
import { getNhatKy } from "../api/nhatKyApi";
import type { NhatKyHeThong } from "../types/nhatKy";

const filterUsername = ref<string | undefined>(undefined);
const filterHanhDong = ref<string | undefined>(undefined);
const filterDoiTuong = ref<string | undefined>(undefined);
const filterDateRange = ref<[string, string] | null>(null);

const danhSach = ref<NhatKyHeThong[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(5);
const total = ref(0);

const columns = [
  {
    title: "STT",
    key: "stt",
    width: 60,
    align: "center" as const,
  },
  {
    title: "Thời gian",
    key: "thoiGian",
    dataIndex: "thoiGian",
    width: 170,
  },
  {
    title: "Tài khoản",
    key: "username",
    dataIndex: "username",
    width: 140,
  },
  {
    title: "Vai trò",
    key: "role",
    dataIndex: "role",
    width: 110,
    align: "center" as const,
  },
  {
    title: "Hành động",
    key: "hanhDong",
    dataIndex: "hanhDong",
    width: 130,
    align: "center" as const,
  },
  {
    title: "Đối tượng",
    key: "doiTuong",
    dataIndex: "doiTuong",
    width: 140,
  },
  {
    title: "ID đối tượng",
    key: "idDoiTuong",
    dataIndex: "idDoiTuong",
    width: 110,
    align: "center" as const,
  },
  {
    title: "Nội dung",
    key: "noiDung",
    dataIndex: "noiDung",
    ellipsis: true,
  },
];

const formatThoiGian = (thoiGian: string): string => {
  if (!thoiGian) {
    return "—";
  }

  const d = new Date(thoiGian);

  if (isNaN(d.getTime())) {
    return thoiGian;
  }

  const pad = (n: number) =>
    String(n).padStart(2, "0");

  return (
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
};

const loadData = async () => {
  loading.value = true;

  const tuNgay = filterDateRange.value?.[0] || undefined;
  const denNgay = filterDateRange.value?.[1] || undefined;

  try {
    const response = await getNhatKy(
      currentPage.value - 1,
      pageSize.value,
      filterUsername.value || undefined,
      filterHanhDong.value || undefined,
      filterDoiTuong.value || undefined,
      tuNgay,
      denNgay
    );

    const data = response.data.data;

    if (data) {
      danhSach.value = data.content;
      total.value = data.totalElements;
    } else {
      danhSach.value = [];
      total.value = 0;
    }
  } catch (error: unknown) {
    console.error("Lỗi tải nhật ký:", error);

    if (axios.isAxiosError(error)) {
      message.error(
        error.response?.data?.message ||
        "Không thể tải nhật ký thao tác"
      );
    } else {
      message.error("Không thể tải nhật ký thao tác");
    }
  } finally {
    loading.value = false;
  }
};

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const onInputChange = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    onSearch();
  }, 400);
};

const onSearch = () => {
  currentPage.value = 1;
  loadData();
};

const onReset = () => {
  filterUsername.value = undefined;
  filterHanhDong.value = undefined;
  filterDoiTuong.value = undefined;
  filterDateRange.value = null;
  currentPage.value = 1;
  loadData();
};

const onPageChange = (page: number) => {
  currentPage.value = page;
  loadData();
};
const onPageSizeChange = (
  _current: number,
  size: number
) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadData();
};
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.custom-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  background: #ffffff;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f1f1f;
  letter-spacing: -0.5px;
}

.card-subtitle {
  font-size: 13px;
  color: #8c8c8c;
  font-weight: 400;
  margin-top: 2px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}
</style>
