<template>
  <a-modal
    :open="props.open"
    title="Quản lý Size"
    width="560px"
    :footer="null"
    @cancel="emit('close')"
  >
    <!-- Toolbar -->
    <div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
      <a-button type="primary" size="small" @click="openAdd">
        + Thêm size
      </a-button>
    </div>

    <!-- Bang size -->
    <a-table
      :columns="columns"
      :data-source="sizes"
      :loading="loading"
      :pagination="false"
      row-key="idSize"
      size="small"
      bordered
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-button
            size="small"
            type="link"
            @click="openEdit(record)"
          >
            Sửa
          </a-button>
        </template>
      </template>
    </a-table>

    <!-- Modal them/sua size -->
    <a-modal
      v-model:open="formOpen"
      :title="editingSize ? 'Sửa size' : 'Thêm size mới'"
      width="400px"
      ok-text="Lưu"
      cancel-text="Hủy"
      :confirm-loading="saving"
      @ok="submitForm"
      @cancel="closeForm"
    >
      <a-form layout="vertical">
        <a-form-item label="Tên size" required>
          <a-input
            v-model:value="form.tenSize"
            placeholder="VD: XXL"
            :maxlength="20"
          />
        </a-form-item>
        <a-form-item label="Thứ tự" required>
          <a-input-number
            v-model:value="form.thuTu"
            style="width:100%"
            :min="1"
            :precision="0"
            placeholder="VD: 4"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { message } from "ant-design-vue";
import type { AxiosError } from "axios";
import type { Size } from "../types/sanPham";
import { getAllSize, createSize, updateSize } from "../api/sanPhamApi";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "reload"): void;
}>();

// ============================================================
// State
// ============================================================
const loading = ref(false);
const sizes = ref<Size[]>([]);

const columns = [
  { title: "Tên size", dataIndex: "tenSize", width: 160 },
  { title: "Thứ tự", dataIndex: "thuTu", width: 100, align: "center" as const },
  { title: "Thao tác", key: "action", width: 100, align: "center" as const },
];

// ============================================================
// Load
// ============================================================
const loadSizes = async () => {
  loading.value = true;
  try {
    const res = await getAllSize();
    const data = res.data.data;
    sizes.value = Array.isArray(data)
      ? [...data].sort((a: Size, b: Size) => a.thuTu - b.thuTu)
      : [];
  } catch {
    sizes.value = [];
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) loadSizes();
  }
);

// ============================================================
// Form them/sua
// ============================================================
const formOpen = ref(false);
const saving = ref(false);
const editingSize = ref<Size | null>(null);

const form = ref<{ tenSize: string; thuTu: number | null }>({
  tenSize: "",
  thuTu: null,
});

const openAdd = () => {
  editingSize.value = null;
  form.value = { tenSize: "", thuTu: null };
  formOpen.value = true;
};

const openEdit = (record: Size) => {
  editingSize.value = record;
  form.value = { tenSize: record.tenSize, thuTu: record.thuTu };
  formOpen.value = true;
};

const closeForm = () => {
  formOpen.value = false;
  editingSize.value = null;
};

const submitForm = async () => {
  const name = form.value.tenSize.trim();
  if (!name) {
    message.warning("Vui lòng nhập tên size");
    return;
  }
  if (!form.value.thuTu || form.value.thuTu < 1) {
    message.warning("Thứ tự phải >= 1");
    return;
  }

  // Chong trung (khi them moi)
  if (!editingSize.value) {
    const existed = sizes.value.some(
      (s) => s.tenSize.toLowerCase() === name.toLowerCase()
    );
    if (existed) {
      message.warning("Size này đã tồn tại");
      return;
    }
  }

  saving.value = true;
  try {
    if (editingSize.value) {
      // SUA: giu nguyen phuThu legacy cua size cu
      await updateSize(editingSize.value.idSize, {
        tenSize: name,
        phuThu: editingSize.value.phuThu,
        thuTu: form.value.thuTu,
      });
      message.success("Cập nhật size thành công");
    } else {
      // THEM: phuThu = 0 legacy
      await createSize({ tenSize: name, phuThu: 0, thuTu: form.value.thuTu });
      message.success("Thêm size thành công");
    }
    formOpen.value = false;
    editingSize.value = null;
    await loadSizes();
    // Bao cho SanPhamForm biet de dong bo danh sach size
    emit("reload");
  } catch (err) {
    const e = err as AxiosError<{ message: string }>;
    message.error(e.response?.data?.message || "Có lỗi xảy ra");
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
:deep(.ant-modal-title) {
  font-size: 18px;
  font-weight: 700;
}
:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 700;
}
</style>
