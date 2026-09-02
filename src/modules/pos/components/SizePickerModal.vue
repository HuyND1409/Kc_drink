<template>
  <a-modal
    :open="open"
    :title="`Chọn size — ${sanPham?.tenSanPham}`"
    :footer="null"
    width="440px"
    @cancel="$emit('close')"
  >
    <a-spin :spinning="loading">
      <a-empty v-if="!loading && sizes.length === 0" description="Sản phẩm chưa có size" />

      <div v-else class="picker-body">
        <!-- Size -->
        <div class="picker-section">
          <div class="picker-label">Size</div>
          <div class="size-list">
            <div
              v-for="s in sizes"
              :key="s.id"
              class="size-item"
              :class="{ 'size-item--active': selected?.id === s.id }"
              @click="selected = s"
            >
              <span class="size-name">{{ s.tenSize }}</span>
              <span class="size-price">{{ formatVND(sanPham!.gia + s.phuThu) }}</span>
              <span v-if="s.phuThu > 0" class="size-extra">+{{ formatVND(s.phuThu) }}</span>
            </div>
          </div>
        </div>

        <!-- Muc duong -->
        <div class="picker-section">
          <div class="picker-label">Mức đường</div>
          <div class="option-group">
            <button
              v-for="opt in DUONG_OPTS"
              :key="opt.val"
              class="opt-btn"
              :class="{ 'opt-btn--active': mucDuong === opt.val }"
              @click="mucDuong = opt.val"
            >{{ opt.label }}</button>
          </div>
        </div>

        <!-- Muc da -->
        <div class="picker-section">
          <div class="picker-label">Mức đá</div>
          <div class="option-group">
            <button
              v-for="opt in DA_OPTS"
              :key="opt.val"
              class="opt-btn"
              :class="{ 'opt-btn--active': mucDa === opt.val }"
              @click="mucDa = opt.val"
            >{{ opt.label }}</button>
          </div>
        </div>

        <!-- Ghi chu -->
        <div class="picker-section">
          <div class="picker-label">Ghi chú</div>
          <a-textarea
            v-model:value="ghiChu"
            placeholder="Ví dụ: ít ngọt, không ống hút..."
            :rows="2"
            :maxlength="200"
            style="resize: none; font-size: 13px"
          />
        </div>

        <!-- Footer -->
        <div class="picker-footer">
          <a-button @click="$emit('close')">Hủy</a-button>
          <a-button
            type="primary"
            :disabled="!selected"
            :loading="adding"
            @click="onConfirm"
          >
            Thêm vào hóa đơn
          </a-button>
        </div>
      </div>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { message } from "ant-design-vue";
import { getSanPhamSize } from "../api/posApi";
import type { SanPham, SanPhamSize } from "../types/pos";

const DUONG_OPTS = [
  { val: 0,   label: "0%" },
  { val: 30,  label: "30%" },
  { val: 50,  label: "50%" },
  { val: 70,  label: "70%" },
  { val: 100, label: "100%" },
] as const;

const DA_OPTS = [
  { val: 0,   label: "Kh\u00f4ng \u0111\u00e1" },
  { val: 50,  label: "50%" },
  { val: 100, label: "100%" },
] as const;

const props = defineProps<{
  open: boolean;
  sanPham: SanPham | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirm", payload: {
    sanPham: SanPham;
    size: SanPhamSize;
    mucDuong: number;
    mucDa: number;
    ghiChu: string | null;
  }): void;
}>();

const sizes    = ref<SanPhamSize[]>([]);
const selected = ref<SanPhamSize | null>(null);
const loading  = ref(false);
const adding   = ref(false);

const mucDuong = ref<number>(100);
const mucDa    = ref<number>(100);
const ghiChu   = ref<string>("");

watch(
  () => props.open,
  async (val) => {
    if (val && props.sanPham) {
      selected.value = null;
      sizes.value    = [];
      mucDuong.value = 100;
      mucDa.value    = 100;
      ghiChu.value   = "";
      loading.value  = true;
      try {
        const res = await getSanPhamSize(props.sanPham.idSanPham);
        sizes.value = ((res.data?.data ?? res.data) as SanPhamSize[]).sort(
          (a, b) => a.thuTu - b.thuTu
        );
      } catch (err: any) {
        message.error(err.response?.data?.message || "Kh\u00f4ng th\u1ec3 t\u1ea3i danh s\u00e1ch size");
      } finally {
        loading.value = false;
      }
    }
  }
);

const onConfirm = () => {
  if (!selected.value || !props.sanPham) return;
  emit("confirm", {
    sanPham:  props.sanPham,
    size:     selected.value,
    mucDuong: mucDuong.value,
    mucDa:    mucDa.value,
    ghiChu:   ghiChu.value.trim() || null,
  });
};

const formatVND = (val: number) =>
  val.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
</script>

<style scoped>
.picker-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.picker-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.picker-label {
  font-size: 12px;
  font-weight: 600;
  color: #595959;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.size-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.size-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.size-item:hover {
  border-color: #1677ff;
  background: #f0f7ff;
}

.size-item--active {
  border-color: #1677ff;
  background: #e6f4ff;
}

.size-name {
  font-weight: 600;
  font-size: 14px;
  min-width: 32px;
}

.size-price {
  font-size: 13px;
  color: #1677ff;
  font-weight: 500;
}

.size-extra {
  font-size: 11px;
  color: #8c8c8c;
}

.option-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.opt-btn {
  padding: 4px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  color: #595959;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  outline: none;
  line-height: 1.5;
}

.opt-btn:hover {
  border-color: #1677ff;
  color: #1677ff;
}

.opt-btn--active {
  border-color: #1677ff;
  background: #e6f4ff;
  color: #1677ff;
  font-weight: 600;
}

.picker-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid #f0f0f0;
}
</style>
