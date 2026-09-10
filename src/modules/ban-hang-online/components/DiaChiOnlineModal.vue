<template>
  <a-modal :open="open" @cancel="handleClose" :footer="null" width="600px" :maskClosable="false" :closable="false"
    class="dia-chi-online-modal" centered>
    
    <!-- State A: Danh Sách Địa Chỉ -->
    <div v-if="!isFormState" class="modal-inner">
      <div class="modal-header">
        <h2 class="modal-title">Địa chỉ giao hàng</h2>
        <button class="close-btn" @click="handleClose">✕</button>
      </div>

      <div class="modal-body">
        <div v-if="loading" class="loading-state">
          <a-spin /> Đang tải...
        </div>
        <div v-else-if="addresses.length === 0" class="empty-state">
          Bạn chưa có địa chỉ giao hàng.
        </div>
        <div v-else class="address-list">
          <div v-for="addr in addresses" :key="addr.idDiaChi" class="address-card"
            :class="{ 'selected': selectedId === addr.idDiaChi }" @click="selectedId = addr.idDiaChi">
            <div class="address-header">
              <span class="radio-circle">
                <span v-if="selectedId === addr.idDiaChi" class="radio-inner"></span>
              </span>
              <span class="name">{{ addr.tenNguoiNhan }}</span>
              <span class="phone">{{ addr.sdtNguoiNhan }}</span>
              <span v-if="addr.macDinh" class="badge default-badge">Mặc định</span>
            </div>
            
            <div class="address-body">
              {{ addr.diaChi }}, {{ addr.tenPhuongXa }}, {{ addr.tenQuanHuyen }}, {{ addr.tenTinhThanh }}
            </div>
            
            <div class="address-actions">
              <button v-if="!addr.macDinh" class="text-btn" @click.stop="setDefault(addr.idDiaChi)">Đặt mặc định</button>
              <button class="text-btn edit-btn" @click.stop="openEditForm(addr)">Sửa</button>
            </div>
          </div>
        </div>

      </div>

      <div class="modal-footer footer-between">
        <button class="add-new-btn-inline" @click="openAddForm">
          + Thêm địa chỉ mới
        </button>
        <div class="footer-actions">
          <button class="outline-btn" @click="handleClose">Hủy</button>
          <button class="brand-btn" :disabled="!selectedId" @click="confirmSelection">Chọn địa chỉ này</button>
        </div>
      </div>
    </div>

    <!-- State B: Form Thêm / Sửa -->
    <div v-else class="modal-inner">
      <div class="modal-header">
        <h2 class="modal-title">{{ editId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ' }}</h2>
        <button class="close-btn" @click="backToList">✕</button>
      </div>

      <div class="modal-body">
        <a-form layout="vertical" ref="formRef" :model="form">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="Tên người nhận" name="tenNguoiNhan" :rules="[{ required: true, message: 'Nhập tên người nhận' }]">
                <a-input v-model:value="form.tenNguoiNhan" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="Số điện thoại" name="sdtNguoiNhan" :rules="[
                { required: true, message: 'Nhập số điện thoại' },
                { pattern: /^0[35789][0-9]{8}$/, message: 'Số điện thoại không hợp lệ' }
              ]">
                <a-input v-model:value="form.sdtNguoiNhan" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="Tỉnh/Thành phố" name="provinceId">
                <a-select v-model:value="form.provinceId" disabled>
                  <a-select-option :value="201">Hà Nội</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="Quận/Huyện" name="districtId" :rules="[{ required: true, message: 'Chọn quận/huyện' }]">
                <a-select v-model:value="form.districtId" placeholder="Chọn quận/huyện" @change="changeDistrict">
                  <a-select-option v-for="item in districts" :key="item.code" :value="item.code">
                    {{ item.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="Phường/Xã" name="wardCode" :rules="[{ required: true, message: 'Chọn phường/xã' }]">
                <a-select v-model:value="form.wardCode" placeholder="Chọn phường/xã" @change="changeWard">
                  <a-select-option v-for="item in wards" :key="item.code" :value="item.code">
                    {{ item.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="Địa chỉ cụ thể" name="diaChi" :rules="[{ required: true, message: 'Nhập địa chỉ cụ thể' }]">
                <a-input v-model:value="form.diaChi" placeholder="Số nhà, ngõ, v.v." />
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item>
            <a-checkbox v-model:checked="form.macDinh">
              Đặt làm địa chỉ mặc định
            </a-checkbox>
          </a-form-item>
        </a-form>
      </div>

      <div class="modal-footer">
        <div class="footer-actions w-full-end">
          <button class="outline-btn" @click="backToList">Hủy</button>
          <button class="brand-btn" :disabled="formLoading" @click="submitForm">
            {{ formLoading ? 'Đang lưu...' : 'Lưu địa chỉ' }}
          </button>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import { getHaNoiDistricts, getWards } from '@/modules/dia_chi/api/haNoiApi';
import { getDiaChiOnline, createDiaChiOnline, updateDiaChiOnline, setDefaultDiaChiOnline } from '@/modules/ban-hang-online/api/banHangOnlineApi';
import type { DiaChiOnline, DiaChiOnlineRequest } from '@/modules/ban-hang-online/types/banHangOnline';

const props = defineProps<{
  open: boolean;
  currentSelectedId: number | null;
}>();

const emit = defineEmits(['update:open', 'select-address', 'addresses-updated']);

// State A: List
const addresses = ref<DiaChiOnline[]>([]);
const loading = ref(false);
const selectedId = ref<number | null>(null);

// State B: Form
const isFormState = ref(false);
const formLoading = ref(false);
const editId = ref<number | null>(null);
const formRef = ref<FormInstance>();

interface DistrictOption { code: number; name: string; }
interface WardOption { code: string; name: string; }

const districts = ref<DistrictOption[]>([]);
const wards = ref<WardOption[]>([]);

const form = reactive({
  tenNguoiNhan: '',
  sdtNguoiNhan: '',
  provinceId: 201,
  districtId: undefined as number | undefined,
  wardCode: undefined as string | undefined,
  tenTinhThanh: 'Hà Nội',
  tenQuanHuyen: '',
  tenPhuongXa: '',
  diaChi: '',
  macDinh: false
});

onMounted(async () => {
  districts.value = await getHaNoiDistricts();
});

const changeDistrict = async (code: number) => {
  const districtName = districts.value.find(x => x.code === code)?.name || '';
  form.tenQuanHuyen = districtName;
  form.wardCode = undefined;
  form.tenPhuongXa = '';
  wards.value = await getWards(code);
};

const changeWard = (code: string) => {
  const wardName = wards.value.find(x => x.code === code)?.name || '';
  form.tenPhuongXa = wardName;
};

watch(() => props.open, async (newVal) => {
  if (newVal) {
    isFormState.value = false;
    selectedId.value = props.currentSelectedId;
    await fetchAddresses();
  }
});

const fetchAddresses = async () => {
  loading.value = true;
  try {
    const res = await getDiaChiOnline();
    if (res.data.code === 200) {
      addresses.value = res.data.data;
      emit('addresses-updated', addresses.value);
    }
  } catch (err) {
    console.error(err);
    message.error('Lỗi khi tải danh sách địa chỉ');
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  emit('update:open', false);
};

const confirmSelection = () => {
  if (selectedId.value) {
    emit('select-address', selectedId.value);
    handleClose();
  }
};

const openAddForm = () => {
  isFormState.value = true;
  editId.value = null;
  form.tenNguoiNhan = '';
  form.sdtNguoiNhan = '';
  form.districtId = undefined;
  form.wardCode = undefined;
  form.tenQuanHuyen = '';
  form.tenPhuongXa = '';
  form.diaChi = '';
  form.macDinh = addresses.value.length === 0;
  wards.value = [];
};

const openEditForm = async (addr: DiaChiOnline) => {
  isFormState.value = true;
  editId.value = addr.idDiaChi;
  form.tenNguoiNhan = addr.tenNguoiNhan;
  form.sdtNguoiNhan = addr.sdtNguoiNhan;
  form.provinceId = addr.provinceId;
  form.districtId = addr.districtId;
  form.tenTinhThanh = addr.tenTinhThanh;
  form.tenQuanHuyen = addr.tenQuanHuyen;
  form.diaChi = addr.diaChi;
  form.macDinh = addr.macDinh;
  
  if (addr.districtId) {
    wards.value = await getWards(addr.districtId);
  }
  form.wardCode = addr.wardCode;
  form.tenPhuongXa = addr.tenPhuongXa;
};

const backToList = () => {
  isFormState.value = false;
};

const submitForm = async () => {
  await formRef.value?.validate();
  
  formLoading.value = true;
  try {
    const request: DiaChiOnlineRequest = {
      tenNguoiNhan: form.tenNguoiNhan,
      sdtNguoiNhan: form.sdtNguoiNhan,
      diaChi: form.diaChi,
      macDinh: form.macDinh,
      provinceId: form.provinceId,
      districtId: form.districtId!,
      wardCode: form.wardCode!,
      tenTinhThanh: form.tenTinhThanh,
      tenQuanHuyen: form.tenQuanHuyen,
      tenPhuongXa: form.tenPhuongXa
    };

    if (editId.value) {
      const res = await updateDiaChiOnline(editId.value, request);
      if (res.data.code === 200 || res.data.code === 201) {
        message.success(res.data.message || 'Cập nhật địa chỉ thành công');
        await fetchAddresses();
        // If editing selected address, notify parent
        if (selectedId.value === editId.value) {
          emit('select-address', editId.value);
        }
        backToList();
      } else {
        message.error(res.data.message || 'Cập nhật thất bại');
      }
    } else {
      const res = await createDiaChiOnline(request);
      if (res.data.code === 200 || res.data.code === 201) {
        message.success(res.data.message || 'Thêm địa chỉ thành công');
        await fetchAddresses();
        const newAddressId = res.data.data?.idDiaChi;
        if (newAddressId) {
          selectedId.value = newAddressId;
          emit('select-address', newAddressId);
        }
        handleClose();
      } else {
        message.error(res.data.message || 'Thêm thất bại');
      }
    }
  } catch (err: any) {
    console.error(err);
    message.error(err.response?.data?.message || 'Có lỗi xảy ra');
  } finally {
    formLoading.value = false;
  }
};

const setDefault = async (id: number) => {
  try {
    const res = await setDefaultDiaChiOnline(id);
    if (res.data.code === 200 || res.data.code === 201) {
      message.success(res.data.message || 'Đã đặt làm địa chỉ mặc định');
      await fetchAddresses();
    } else {
      message.error(res.data.message || 'Có lỗi xảy ra');
    }
  } catch (err: any) {
    message.error(err.response?.data?.message || 'Có lỗi xảy ra');
  }
};
</script>

<style scoped>
.modal-inner {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #2B2724;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #E8E0D7;
  margin-bottom: 16px;
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #2B2724;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  color: #746B63;
  cursor: pointer;
}

.close-btn:hover {
  color: #1E1E1E;
}

.modal-body {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  max-height: 50vh;
  padding-right: 8px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #E8E0D7;
  flex-shrink: 0;
}

.footer-between {
  justify-content: space-between;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.w-full-end {
  width: 100%;
  justify-content: flex-end;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.address-card {
  border: 1px solid #E8E0D7;
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  background: #FFFDFC;
  transition: all 0.2s;
}

.address-card.selected {
  border-color: #8B5E3C;
  background: #fdfbf8;
}

.address-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.radio-circle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid #C89263;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radio-inner {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #8B5E3C;
}

.address-header .name {
  font-weight: 700;
  margin-right: 8px;
}

.address-header .phone {
  color: #746B63;
  font-size: 13px;
}

.default-badge {
  font-size: 11px;
  background: #E8E0D7;
  color: #6F452D;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: auto;
}

.address-body {
  font-size: 14px;
  margin-left: 30px;
  color: #2B2724;
  margin-bottom: 12px;
}

.address-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

.text-btn {
  background: transparent;
  border: none;
  color: #746B63;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}

.text-btn:hover {
  text-decoration: underline;
  color: #2B2724;
}

.edit-btn {
  color: #8B5E3C;
}

.add-new-btn-inline {
  padding: 8px 16px;
  border: 1px dashed #C89263;
  background: transparent;
  color: #8B5E3C;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.add-new-btn-inline:hover {
  background: #fdfbf8;
}

/* Form Styles */
:deep(.ant-form-item) {
  margin-bottom: 16px;
}

:deep(.ant-input), :deep(.ant-select-selector) {
  border-radius: 6px !important;
}

/* Buttons */
.brand-btn {
  background: #8B5E3C;
  color: white;
  border: none;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
}

.brand-btn:hover:not(:disabled) {
  background: #6F452D;
}

.brand-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.outline-btn {
  background: transparent;
  color: #2B2724;
  border: 1px solid #E8E0D7;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
}

.outline-btn:hover {
  background: #F9F8F6;
}

.mt-4 {
  margin-top: 16px;
}
</style>
