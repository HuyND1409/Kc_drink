<template>
  <a-modal :open="open" title="Chọn khách hàng" :footer="null" width="480px" @cancel="$emit('close')"
    :destroyOnClose="true">
    <div class="customer-picker">
      <div class="search-header">
        <a-input-search v-model:value="keyword" placeholder="Tìm theo tên hoặc số điện thoại" allow-clear
          @change="onSearchDebounced" @search="onSearch" class="search-input" />
        <a-button type="primary" ghost @click="isCreating = true" v-if="!isCreating && canCreateCustomer">+ Thêm khách</a-button>
      </div>

      <div v-if="isCreating" class="create-form">
        <div class="form-title">Thêm khách hàng mới</div>
        <a-form layout="vertical">
          <a-form-item label="Tên khách hàng" required>
            <a-input v-model:value="newCustomer.tenKhachHang" placeholder="Nhập tên khách hàng" />
          </a-form-item>
          <a-form-item label="Số điện thoại" required>
            <a-input v-model:value="newCustomer.sdt" placeholder="Nhập số điện thoại" />
          </a-form-item>
          <div class="create-actions">
            <a-button @click="cancelCreate">Hủy</a-button>
            <a-button type="primary" :loading="loadingCreate" @click="onCreateCustomer">Tạo & Chọn</a-button>
          </div>
        </a-form>
      </div>

      <div v-else class="results-container">
        <a-spin :spinning="loading">
          <a-empty v-if="!loading && customers.length === 0" description="Không tìm thấy khách hàng nào" />

          <div v-else class="customer-list">
            <div v-for="kh in customers" :key="kh.idKhachHang" class="customer-item">
              <div class="customer-info">
                <div class="customer-name">{{ kh.tenKhachHang }}</div>
                <div class="customer-meta">
                  <span v-if="kh.sdt">📞 {{ kh.sdt }}</span>
                  <span v-if="kh.diemTichLuy != null" class="point-badge">
                    Điểm: {{ kh.diemTichLuy }}
                  </span>
                </div>
              </div>
              <a-button type="primary" size="small" @click="onSelect(kh)" :loading="loadingSelectId === kh.idKhachHang">
                Chọn
              </a-button>
            </div>
          </div>
        </a-spin>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, reactive, computed } from "vue";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { getKhachHang, taoKhachHang } from "../api/posApi";
import type { KhachHang } from "../types/pos";
import { message } from "ant-design-vue";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "select", kh: KhachHang): void;
}>();

const keyword = ref("");
const loading = ref(false);
const customers = ref<KhachHang[]>([]);
const loadingSelectId = ref<number | null>(null);

const authStore = useAuthStore();
const canCreateCustomer = computed(() => authStore.user?.role === "ADMIN" || authStore.user?.role === "STAFF");

// Create state
const isCreating = ref(false);
const loadingCreate = ref(false);
const newCustomer = reactive({
  tenKhachHang: "",
  sdt: "",
});

let searchTimeout: ReturnType<typeof setTimeout>;

const loadCustomers = async () => {
  loading.value = true;
  try {
    const res = await getKhachHang(keyword.value.trim(), 0, 10);
    const data = res.data?.data ?? res.data;
    customers.value = data.content || [];
  } catch (err: any) {
    message.error("Lỗi khi tìm khách hàng");
    customers.value = [];
  } finally {
    loading.value = false;
  }
};

const onSearchDebounced = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadCustomers();
  }, 500);
};

const onSearch = () => {
  clearTimeout(searchTimeout);
  loadCustomers();
};

const cancelCreate = () => {
  isCreating.value = false;
  newCustomer.tenKhachHang = "";
  newCustomer.sdt = "";
};

const onCreateCustomer = async () => {
  if (!newCustomer.tenKhachHang.trim() || !newCustomer.sdt.trim()) {
    message.warning("Vui lòng nhập tên và số điện thoại");
    return;
  }
  loadingCreate.value = true;
  try {
    const res = await taoKhachHang({
      tenKhachHang: newCustomer.tenKhachHang.trim(),
      sdt: newCustomer.sdt.trim(),
    });
    const data = res.data?.data ?? res.data;
    message.success("Tạo khách hàng thành công");
    cancelCreate();
    // Gán trực tiếp
    emit("select", data);
  } catch (err: any) {
    message.error(err.response?.data?.message || "Tạo khách hàng thất bại");
  } finally {
    loadingCreate.value = false;
  }
};

watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      keyword.value = "";
      customers.value = [];
      loadingSelectId.value = null;
      cancelCreate();
      loadCustomers();
    }
  }
);

const onSelect = (kh: KhachHang) => {
  emit("select", kh);
};
</script>

<style scoped>
.customer-picker {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-header {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-input {
  flex: 1;
}

.create-form {
  padding: 8px 0;
}

.form-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 12px;
  color: #262626;
}

.create-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.results-container {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}

.customer-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.customer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  transition: all 0.2s;
}

.customer-item:hover {
  border-color: #1677ff;
  background-color: #f0f5ff;
}

.customer-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.customer-name {
  font-weight: 600;
  color: #262626;
  font-size: 14px;
}

.customer-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #8c8c8c;
}

.point-badge {
  color: #fa8c16;
  background: #fff7e6;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid #ffd591;
}
</style>
