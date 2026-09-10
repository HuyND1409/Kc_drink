<template>
  <div class="online-order-detail">
    <a-spin :spinning="loading" wrapperClassName="detail-spin">
      <div v-if="order" class="detail-layout">
        <!-- ==================== CỘT TRÁI ==================== -->
        <div class="left-column">
          <!-- Thông tin hóa đơn compact -->
          <div class="compact-header">
            <div class="compact-header-top">
              <span class="order-code">{{ order.maHoaDon }}</span>
              <a-tag :color="getPaymentBadgeColor(order.payosStatus, order.trangThai)">
                {{ mapOrderStatus(order.trangThai) }}
              </a-tag>
            </div>
            <div class="compact-header-customer">
              <span>👤 {{ order.tenKhachHang || 'Khách lẻ' }}</span>
              <span v-if="order.sdtKhachHang"> - 📞 {{ order.sdtKhachHang }}</span>
            </div>
          </div>

          <!-- Chi tiết sản phẩm -->
          <div class="product-list-area">
            <a-table
              :dataSource="order.chiTiet"
              :columns="productColumns"
              :pagination="false"
              rowKey="idHoaDonChiTiet"
              size="small"
              bordered
              class="compact-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'sanPham'">
                  <div style="font-weight: 600">{{ record.tenSanPham }}</div>
                  <div style="font-size: 12px; color: #888">
                    Size: {{ record.tenSize }} | Đường: {{ record.mucDuong ?? 100 }}% | Đá: {{ record.mucDa ?? 100 }}%
                  </div>
                  <div v-if="record.ghiChu" style="font-size: 12px; color: #d46b08; font-style: italic">
                    Ghi chú: {{ record.ghiChu }}
                  </div>
                  <div v-if="record.toppingList && record.toppingList.length > 0" style="margin-top: 2px; font-size: 11px">
                    <div style="font-weight: 600; color: #555">Topping:</div>
                    <div v-for="t in record.toppingList" :key="t.idHdctTopping">
                      - {{ t.tenTopping }} × {{ t.soLuong }}
                    </div>
                  </div>
                </template>
                <template v-if="column.key === 'soLuong'">
                  {{ record.soLuong }}
                </template>
                <template v-if="column.key === 'thanhTien'">
                  {{ formatCurrency(record.thanhTien) }}
                </template>
              </template>
            </a-table>
          </div>

          <!-- Thông tin thanh toán -->
          <div class="payment-summary">
            <div class="summary-row">
              <span>Tạm tính (trước CTKM):</span>
              <span>{{ formatCurrency(order.tongTien + (order.giamGiaKhuyenMai || 0)) }}</span>
            </div>
            <div class="summary-row" v-if="order.giamGiaKhuyenMai">
              <span>Khuyến mãi sản phẩm:</span>
              <span>-{{ formatCurrency(order.giamGiaKhuyenMai) }}</span>
            </div>
            <div class="summary-row" v-if="order.tenVoucher">
              <span>Voucher ({{ order.tenVoucher }}):</span>
              <span>-{{ formatCurrency(order.giamGia) }}</span>
            </div>
            <div class="summary-row">
              <span>Phí vận chuyển:</span>
              <span>{{ formatCurrency(order.phiVanChuyen) }}</span>
            </div>
            <div class="summary-row total">
              <span>Tổng thanh toán:</span>
              <span class="total-val">{{ formatCurrency(order.thanhTien) }}</span>
            </div>
            <div class="summary-row" v-if="order.hinhThucThanhToan">
              <span>Phương thức:</span>
              <span>{{ order.hinhThucThanhToan === 'TIEN_MAT' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản PayOS' }}</span>
            </div>
            <div class="summary-row" style="margin-bottom: 0;">
              <span>Trạng thái thanh toán:</span>
              <span :style="{ fontWeight: 'bold', color: getPaymentStatusColor() }">
                {{ getPaymentStatusDisplay() }}
              </span>
            </div>
          </div>
        </div>

        <!-- ==================== CỘT PHẢI ==================== -->
        <div class="right-column">
          <div class="delivery-card" v-if="deliveryInfo">
            <div class="section-title" style="margin-top: 0">Giao hàng</div>
            
            <div class="info-row">
              <span class="info-label">Người nhận:</span>
              <span class="info-value">{{ deliveryInfo.tenNguoiNhan }} ({{ deliveryInfo.sdtNguoiNhan }})</span>
            </div>
            <div class="info-row">
              <span class="info-label">SĐT:</span>
              <span class="info-value">{{ deliveryInfo.sdtNguoiNhan }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Địa chỉ:</span>
              <span class="info-value">{{ formatDeliveryAddress(deliveryInfo) }}</span>
            </div>
            <div class="info-row" v-if="deliveryInfo.ghiChu">
              <span class="info-label">Ghi chú:</span>
              <span class="info-value">{{ deliveryInfo.ghiChu }}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="section-title-sm">GHN</div>
            
            <div class="info-row">
              <span class="info-label">Trạng thái:</span>
              <span class="info-value status-highlight">
                <a-tag :color="deliveryInfo.maVanDonGhn ? 'blue' : 'default'" style="margin: 0;">
                  {{ mapShippingStatus(deliveryInfo.trangThaiGhn || deliveryInfo.trangThai) }}
                </a-tag>
              </span>
            </div>
            <div class="info-row" v-if="deliveryInfo.maVanDonGhn">
              <span class="info-label">Mã vận đơn:</span>
              <span class="info-value" style="color: #1890ff; font-weight: 500;">{{ deliveryInfo.maVanDonGhn }}</span>
            </div>
            <div class="info-row" v-if="deliveryInfo.thoiGianGiaoDuKien">
              <span class="info-label">Dự kiến giao:</span>
              <span class="info-value">{{ formatDate(deliveryInfo.thoiGianGiaoDuKien) }}</span>
            </div>
            
            <div class="ghn-actions">
              <template v-if="deliveryInfo.maVanDonGhn">
                <a-button
                  type="default"
                  @click="refreshGhnStatus"
                  :loading="refreshing"
                >
                  Làm mới trạng thái GHN
                </a-button>
                
                <a-button
                  v-if="getNextGhnAction(deliveryInfo.trangThaiGhn)"
                  type="primary"
                  @click="simulateGhnStatus(getNextGhnAction(deliveryInfo.trangThaiGhn)!.target, getNextGhnAction(deliveryInfo.trangThaiGhn)!.label)"
                  :loading="simulatingGhn"
                >
                  Cập nhật: {{ getNextGhnAction(deliveryInfo.trangThaiGhn)?.label }}
                </a-button>
              </template>
              
              <a-button
                v-else-if="canReceiveOrder"
                type="primary"
                @click="receiveOrder"
                :loading="receivingOrder"
              >
                Nhận đơn
              </a-button>
              
              <a-button 
                v-else-if="canCreateGhnOrder"
                type="primary" 
                @click="createGhnOrder" 
                :loading="creatingGhn"
              >
                Tạo đơn GHN
              </a-button>
            </div>
          </div>
          <a-empty v-else description="Chưa có thông tin giao hàng" style="margin-top: 40px;" />
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { getHoaDonById, getGiaoHangHoaDon, taoDonGhnHoaDon, lamMoiTrangThaiGhnHoaDon, tiepNhanDonOnline, giaLapTrangThaiGhnHoaDon } from '../api/posApi';
import type { HoaDon, VanDonGhnResponse } from '../types/pos';

const props = defineProps<{
  orderId: number;
}>();

const emit = defineEmits(['refresh']);

const loading = ref(false);
const order = ref<HoaDon | null>(null);
const deliveryInfo = ref<VanDonGhnResponse | null>(null);

const creatingGhn = ref(false);
const refreshing = ref(false);
const receivingOrder = ref(false);
const simulatingGhn = ref(false);

const canReceiveOrder = computed(() => {
  if (!order.value || !deliveryInfo.value) return false;

  const isCod = order.value.hinhThucThanhToan === 'TIEN_MAT';

  const paymentReady = isCod
    ? order.value.trangThai === 'CHO_THANH_TOAN'
    : order.value.trangThai === 'DA_THANH_TOAN';

  return paymentReady && deliveryInfo.value.trangThai === 'CHO_TAO_DON';
});

const canCreateGhnOrder = computed(() => {
  if (!order.value || !deliveryInfo.value) return false;

  const isCod = order.value.hinhThucThanhToan === 'TIEN_MAT';

  const paymentReady = isCod
    ? order.value.trangThai === 'CHO_THANH_TOAN'
    : order.value.trangThai === 'DA_THANH_TOAN';

  return paymentReady 
    && deliveryInfo.value.trangThai === 'DA_TIEP_NHAN' 
    && !deliveryInfo.value.maVanDonGhn;
});

const getPaymentStatusDisplay = () => {
  if (!order.value) return 'CHƯA RÕ';
  if (order.value.hinhThucThanhToan === 'TIEN_MAT') {
    if (order.value.trangThai === 'CHO_THANH_TOAN') return 'Chưa thu tiền';
    if (order.value.trangThai === 'DA_THANH_TOAN') return 'Đã thanh toán';
    return mapPaymentStatus(order.value.payosStatus) || 'CHƯA RÕ';
  }
  return mapPaymentStatus(order.value.payosStatus) || 'CHƯA RÕ';
};

const getPaymentStatusColor = () => {
  if (!order.value) return '#faad14';
  if (order.value.hinhThucThanhToan === 'TIEN_MAT') {
    return order.value.trangThai === 'DA_THANH_TOAN' ? '#52c41a' : '#faad14';
  }
  return order.value.payosStatus === 'PAID' ? '#52c41a' : '#faad14';
};

const getNextGhnAction = (status: string | null) => {
  if (!status) return null;

  const map: Record<string, { target: string; label: string }> = {
    ready_to_pick: { target: 'picking', label: 'Đang lấy hàng' },
    picking: { target: 'picked', label: 'Đã lấy hàng' },
    picked: { target: 'transporting', label: 'Đang vận chuyển' },
    transporting: { target: 'delivering', label: 'Đang giao hàng' },
    delivering: { target: 'delivered', label: 'Đã giao hàng' }
  };

  return map[status.toLowerCase()] || null;
};

const simulateGhnStatus = (target: string, label: string) => {
  Modal.confirm({
    title: 'Xác nhận cập nhật trạng thái?',
    content: `Chuyển vận đơn sang "${label}"?`,
    okText: 'Cập nhật',
    cancelText: 'Hủy',
    onOk: async () => {
      simulatingGhn.value = true;
      try {
        const res = await giaLapTrangThaiGhnHoaDon(props.orderId, target);
        if (res.data.code === 200) {
          message.success('Cập nhật trạng thái vận chuyển thành công');
          await loadDetail();
          emit('refresh');
        } else {
          message.error(res.data.message || 'Không thể cập nhật trạng thái');
        }
      } catch (err: any) {
        console.error(err);
        message.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
      } finally {
        simulatingGhn.value = false;
      }
    }
  });
};

const productColumns = [
  { title: 'Sản phẩm', key: 'sanPham' },
  { title: 'SL', key: 'soLuong', width: 60, align: 'center' },
  { title: 'Thành tiền', key: 'thanhTien', width: 120, align: 'right' },
];

const loadDetail = async () => {
  if (!props.orderId) return;
  loading.value = true;
  try {
    const [resOrder, resDelivery] = await Promise.all([
      getHoaDonById(props.orderId),
      getGiaoHangHoaDon(props.orderId).catch(() => ({ data: { data: null } }))
    ]);
    
    if (resOrder.data.code === 200) {
      order.value = resOrder.data.data;
    }
    
    if (resDelivery?.data?.code === 200) {
      deliveryInfo.value = resDelivery.data.data;
    }
  } catch (err) {
    console.error(err);
    message.error('Lỗi khi tải chi tiết đơn');
  } finally {
    loading.value = false;
  }
};

watch(() => props.orderId, () => {
  loadDetail();
});

onMounted(() => {
  loadDetail();
});

const receiveOrder = () => {
  Modal.confirm({
    title: 'Xác nhận tiếp nhận đơn hàng?',
    content: 'Sau khi tiếp nhận, nhân viên có thể tạo vận đơn GHN cho đơn hàng này.',
    okText: 'Nhận đơn',
    cancelText: 'Hủy',
    onOk: async () => {
      receivingOrder.value = true;
      try {
        const res = await tiepNhanDonOnline(props.orderId);
        if (res.data.code === 200) {
          message.success('Tiếp nhận đơn hàng thành công');
          await loadDetail();
          emit('refresh');
        } else {
          message.error(res.data.message || 'Lỗi tiếp nhận đơn hàng');
        }
      } catch (err: any) {
        console.error(err);
        message.error(err.response?.data?.message || 'Có lỗi xảy ra khi tiếp nhận đơn hàng');
      } finally {
        receivingOrder.value = false;
      }
    }
  });
};

const createGhnOrder = () => {
  Modal.confirm({
    title: 'Xác nhận tạo đơn giao hàng GHN?',
    content: 'Đơn hàng sẽ được chuyển sang trạng thái chờ lấy hàng bên GHN.',
    okText: 'Tạo đơn GHN',
    cancelText: 'Hủy',
    onOk: async () => {
      creatingGhn.value = true;
      try {
        const res = await taoDonGhnHoaDon(props.orderId);
        if (res.data.code === 200) {
          message.success('Tạo đơn GHN thành công');
          await loadDetail();
          emit('refresh');
        } else {
          message.error(res.data.message || 'Lỗi tạo đơn GHN');
        }
      } catch (err: any) {
        console.error(err);
        message.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn GHN');
      } finally {
        creatingGhn.value = false;
      }
    }
  });
};

const refreshGhnStatus = async () => {
  refreshing.value = true;
  try {
    const res = await lamMoiTrangThaiGhnHoaDon(props.orderId);
    if (res.data.code === 200) {
      message.success('Làm mới trạng thái thành công');
      await loadDetail();
      emit('refresh');
    } else {
      message.error(res.data.message || 'Lỗi cập nhật');
    }
  } catch (err: any) {
    console.error(err);
    message.error(err.response?.data?.message || 'Có lỗi xảy ra');
  } finally {
    refreshing.value = false;
  }
};

const formatCurrency = (val?: number) => {
  if (!val) return '0 đ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('vi-VN');
};

const formatDeliveryAddress = (info: any) => {
  if (!info) return '';
  if (info.diaChiGiaoHang && info.diaChiGiaoHang.trim()) {
    return info.diaChiGiaoHang.trim();
  }
  return [info.tenPhuongXa, info.tenQuanHuyen, info.tenTinhThanh].filter(Boolean).join(', ');
};

const mapPaymentStatus = (status: string | null) => {
  if (status === 'PAID') return 'Đã thanh toán';
  if (status === 'PENDING') return 'Chờ thanh toán';
  if (status === 'CANCELLED') return 'Đã hủy';
  if (status === 'EXPIRED') return 'Hết hạn';
  return status;
};

const mapOrderStatus = (status: string | null) => {
  if (status === 'DA_THANH_TOAN') return 'Đã thanh toán';
  if (status === 'CHO_THANH_TOAN') return 'Chờ thanh toán';
  if (status === 'DA_HUY') return 'Đã hủy';
  return status;
};

const mapShippingStatus = (status: string | null) => {
  if (!status) return '';
  const s = status.toLowerCase();
  const map: Record<string, string> = {
    'ready_to_pick': 'Sẵn sàng lấy hàng',
    'picking': 'Đang lấy hàng',
    'money_collect_picking': 'Đang thu tiền lấy hàng',
    'picked': 'Đã lấy hàng',
    'storing': 'Đang lưu kho',
    'transporting': 'Đang vận chuyển',
    'sorting': 'Đang phân loại',
    'delivering': 'Đang giao hàng',
    'delivered': 'Đã giao hàng',
    'delivery_fail': 'Giao hàng thất bại',
    'waiting_to_return': 'Chờ hoàn hàng',
    'return': 'Đang hoàn hàng',
    'returned': 'Đã hoàn hàng',
    'cancel': 'Đã hủy',
    'cho_tao_don': 'Chờ tiếp nhận',
    'da_tiep_nhan': 'Đã tiếp nhận',
    'cho_thanh_toan': 'Chờ thanh toán',
    'da_huy': 'Đã hủy',
  };
  return map[s] || status;
};

const getPaymentBadgeColor = (payosStatus: string | null, trangThai: string | null) => {
  const s = payosStatus || trangThai;
  if (s === 'PAID' || s === 'DA_THANH_TOAN') return 'success';
  if (s === 'CANCELLED' || s === 'DA_HUY' || s === 'EXPIRED') return 'default';
  if (s === 'PENDING' || s === 'CHO_THANH_TOAN') return 'warning';
  return 'default';
};
</script>

<style scoped>
.online-order-detail {
  padding-bottom: 24px;
}

:deep(.detail-spin) {
  min-height: 200px;
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(360px, 0.9fr);
  gap: 20px;
}

/* LEFT COLUMN */
.left-column {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid #f0f0f0;
  padding-right: 20px;
}

.compact-header {
  margin-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 12px;
}
.compact-header-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}
.order-code {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}
.compact-header-customer {
  font-size: 13px;
  color: #4b5563;
}

.product-list-area {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;
}
.compact-table :deep(th) {
  padding: 8px !important;
}
.compact-table :deep(td) {
  padding: 8px !important;
}

.payment-summary {
  background-color: #fafafa;
  border-radius: 8px;
  padding: 14px 16px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  color: #4b5563;
  font-size: 13px;
}
.summary-row.total {
  border-top: 1px dashed #e5e7eb;
  padding-top: 8px;
  margin-top: 4px;
  font-weight: bold;
  color: #111827;
  font-size: 15px;
}
.total-val {
  color: #cf1322;
}

/* RIGHT COLUMN */
.right-column {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.delivery-card {
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1f2937;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 6px;
}

.section-title-sm {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1f2937;
}

.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  font-size: 13px;
}
.info-label {
  color: #8c8c8c;
  width: 90px;
  flex-shrink: 0;
}
.info-value {
  color: #262626;
  flex: 1;
  word-break: break-word;
}
.status-highlight {
  font-weight: 500;
}
.divider {
  height: 1px;
  background-color: #f0f0f0;
  margin: 16px 0;
}

.ghn-actions {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* RESPONSIVE */
@media (max-width: 999px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
  .left-column {
    border-right: none;
    padding-right: 0;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 24px;
    margin-bottom: 24px;
  }
}
</style>
