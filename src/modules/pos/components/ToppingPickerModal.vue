<template>
  <a-modal
    :open="open"
    title="Thêm topping"
    :footer="null"
    width="460px"
    @cancel="$emit('close')"
  >
    <a-spin :spinning="loading">
      <a-empty v-if="!loading && toppings.length === 0" description="Không có topping khả dụng" />

      <div v-else class="topping-list">
        <div
          v-for="t in toppings"
          :key="t.idTopping"
          class="topping-item"
          :class="{ 'topping-item--oot': t.tongTonKho <= 0 }"
        >
          <div class="topping-info">
            <span class="topping-name">{{ t.tenTopping }}</span>
            <span class="topping-price">{{ formatVND(t.giaTopping) }}</span>
            <span v-if="t.tongTonKho <= 0" class="topping-stock topping-stock--oot">
              Hết hàng
            </span>
            <span v-else class="topping-stock topping-stock--ok">
              Còn {{ t.tongTonKho }}
            </span>
          </div>
          <div class="topping-qty">
            <a-input-number
              v-model:value="quantities[t.idTopping]"
              :min="0"
              :max="t.tongTonKho"
              :disabled="t.tongTonKho <= 0"
              size="small"
              style="width: 70px"
              @change="(val: number | null) => onQtyChange(t, val)"
            />
          </div>
        </div>
      </div>

      <div v-if="toppings.length > 0" style="margin-top: 16px; text-align: right;">
        <a-button @click="$emit('close')" style="margin-right: 8px">Hủy</a-button>
        <a-button
          type="primary"
          :loading="saving"
          :disabled="!hasSelection"
          @click="onConfirm"
        >
          Xác nhận
        </a-button>
      </div>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { message } from "ant-design-vue";
import { getTopping } from "@/modules/topping/api/toppingApi";
import type { Topping } from "@/modules/topping/types/topping";

const props = defineProps<{
  open: boolean;
  idChiTiet: number | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (
    e: "confirm",
    payload: { idTopping: number; soLuong: number; donGia: number }[]
  ): void;
}>();

const toppings = ref<Topping[]>([]);
const quantities = reactive<Record<number, number>>({});
const loading = ref(false);
const saving = ref(false);

const hasSelection = computed(() =>
  Object.values(quantities).some((q) => q > 0)
);

// Clamp số lượng về [0, tongTonKho] khi user nhập tay vượt tồn
const onQtyChange = (t: Topping, val: number | null) => {
  const raw = val ?? 0;
  if (raw > t.tongTonKho) {
    quantities[t.idTopping] = t.tongTonKho;
    message.warning(`Topping "${t.tenTopping}" chỉ còn ${t.tongTonKho}`);
  } else if (raw < 0) {
    quantities[t.idTopping] = 0;
  }
};

watch(
  () => props.open,
  async (val) => {
    if (val) {
      // Reset quantities
      Object.keys(quantities).forEach((k) => delete quantities[Number(k)]);

      if (toppings.value.length === 0) {
        loading.value = true;
        try {
          // Lấy topping active (trangThai=1), page lớn để không bỏ sót
          const res = await getTopping("", 1, 0, 100);
          const data = res.data?.data?.content ?? res.data?.data ?? [];
          toppings.value = Array.isArray(data) ? data : [];
          // Khởi tạo quantity = 0 cho mỗi topping
          toppings.value.forEach((t) => {
            quantities[t.idTopping] = 0;
          });
        } catch (err: any) {
          message.error(
            err.response?.data?.message || "Không thể tải danh sách topping"
          );
        } finally {
          loading.value = false;
        }
      } else {
        // Đã load rồi, chỉ reset qty
        toppings.value.forEach((t) => {
          quantities[t.idTopping] = 0;
        });
      }
    }
  }
);

const onConfirm = () => {
  const selected = toppings.value
    .filter((t) => (quantities[t.idTopping] ?? 0) > 0)
    .map((t) => ({
      idTopping: t.idTopping,
      soLuong: quantities[t.idTopping],
      donGia: t.giaTopping, // lấy từ field backend, không hardcode
    }));

  if (selected.length === 0) return;
  emit("confirm", selected);
};

const formatVND = (val: number) =>
  val.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
</script>

<style scoped>
.topping-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow-y: auto;
}

.topping-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  background: #fafafa;
}

/* Hết hàng: mờ đi một chút để phân biệt */
.topping-item--oot {
  opacity: 0.55;
}

.topping-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.topping-name {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.topping-price {
  font-size: 12px;
  color: #1677ff;
}

.topping-stock {
  font-size: 11px;
  font-weight: 500;
}

.topping-stock--ok {
  color: #52c41a;
}

.topping-stock--oot {
  color: #ff4d4f;
}

.topping-qty {
  display: flex;
  align-items: center;
}
</style>
