<template>
  <div class="shop-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="container hero-container">
        <div class="hero-content">
          <div class="hero-label">KC DRINK</div>
          <h1 class="hero-title">
            Một chút ngọt ngào<br />
            cho ngày của bạn
          </h1>
          <p class="hero-subtitle">
            Khám phá hương vị nguyên bản từ những lá trà được chọn lọc kỹ càng, pha chế bằng tất cả sự đam mê và tâm
            huyết.
          </p>
          <a-button type="primary" size="large" class="brand-cta hero-cta" @click="scrollToProducts">
            Khám phá menu
          </a-button>
        </div>
        <div class="hero-visual">
          <!-- Composition / Image Placeholder -->
          <div class="hero-image-composition">
            <div class="image-box box-main">
              <div class="image-placeholder"><img src="https://phela.vn/wp-content/uploads/2025/04/Update-web.jpg"
                  alt=""></div>
            </div>
            <!-- <div class="image-box box-sub">
               <div class="image-placeholder">🍵</div>
            </div> -->
            <div class="brand-stamp">KC</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Brand Story Section -->
    <section class="brand-story">
      <div class="container story-container">
        <div class="story-left">
          <div class="story-label">CÂU CHUYỆN THƯƠNG HIỆU</div>
          <h2 class="story-title">Một câu chuyện bắt đầu<br />từ những ly trà sữa</h2>
          <p class="story-desc">
            KC Drink bắt đầu từ mong muốn tạo ra những ly trà sữa dễ uống, gần gũi và phù hợp với nhiều khẩu vị.
          </p>
          <p class="story-desc">
            Từ nguyên liệu, cách pha chế đến từng lựa chọn topping, KC Drink hướng đến trải nghiệm đơn giản nhưng chỉn
            chu trong mỗi ly đồ uống.
          </p>
        </div>
        <div class="story-right">
          <div class="values-list">
            <div class="value-item">
              <h3>Hương vị cân bằng</h3>
              <p>Sự kết hợp hài hòa giữa trà, sữa và các lựa chọn theo khẩu vị.</p>
            </div>
            <div class="value-item">
              <h3>Nguyên liệu chọn lọc</h3>
              <p>Chú trọng lựa chọn nguyên liệu phù hợp cho từng thức uống.</p>
            </div>
            <div class="value-item">
              <h3>Pha chế mỗi ngày</h3>
              <p>Mỗi ly được chuẩn bị để mang đến trải nghiệm tươi mới và dễ thưởng thức.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Menu Section -->
    <section id="products" ref="productSection" class="product-section">
      <div class="container">
        <div class="section-header">
          <div class="section-title-wrap">
            <div class="section-label">MENU KC DRINK</div>
            <h2 class="section-title">Thức uống được yêu thích</h2>
          </div>

          <div class="cart-trigger" @click="triggerOpenCart">
            <span class="cart-text">Giỏ hàng của bạn</span>
            <div class="cart-icon-wrap">
              <span>🛒</span>
              <span class="cart-count" v-if="cartStore.totalQuantity > 0">{{ cartStore.totalQuantity }}</span>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <a-row :gutter="[32, 48]" v-if="loading">
          <a-col v-for="i in 8" :key="i" :xs="24" :sm="12" :md="8" :lg="6">
            <div class="product-card skeleton-card">
              <div class="product-image-wrap">
                <a-skeleton-image class="skeleton-img" />
              </div>
              <div class="product-info">
                <a-skeleton active :paragraph="{ rows: 2 }" />
              </div>
            </div>
          </a-col>
        </a-row>

        <!-- Empty State -->
        <div v-else-if="products.length === 0" class="empty-state">
          <p>Hiện chưa có sản phẩm đang bán</p>
        </div>

        <!-- Data State -->
        <a-row v-else :gutter="[32, 48]">
          <a-col v-for="product in products" :key="product.idSanPham" :xs="24" :sm="12" :md="8" :lg="6">
            <div class="product-card" @click="selectProduct(product)">
              <div class="product-image-wrap">
                <template v-if="product.hinhAnh && !imageError[product.idSanPham]">
                  <img :src="getSanPhamImageUrl(product.hinhAnh)" :alt="product.tenSanPham"
                    @error="imageError[product.idSanPham] = true" class="product-img" />
                </template>
                <div v-else class="img-fallback">🧋</div>
                <div v-if="product.coKhuyenMai" class="promo-tag">
                  {{ product.tenKhuyenMai }}
                </div>
              </div>

              <div class="product-info">
                <h3 class="product-name">{{ product.tenSanPham }}</h3>
                <p class="product-desc">{{ product.moTa || "Thức uống tuyệt hảo từ KC Drink" }}</p>

                <div class="product-bottom">
                  <div class="price-block">
                    <span class="current-price">{{ formatCurrency(product.coKhuyenMai ? product.giaSauKhuyenMai :
                      product.gia)
                    }}</span>
                    <span v-if="product.coKhuyenMai" class="old-price">{{ formatCurrency(product.gia) }}</span>
                  </div>

                  <button class="select-btn" :class="{ loading: fetchingDetailId === product.idSanPham }"
                    @click.stop="selectProduct(product)">
                    {{ fetchingDetailId === product.idSanPham ? 'Đang tải...' : 'Chọn món' }}
                  </button>
                </div>
              </div>
            </div>
          </a-col>
        </a-row>

        <!-- Pagination -->
        <div v-if="!loading && products.length > 0 && totalElements > pageSize" class="pagination-wrap">
          <a-pagination v-model:current="currentPage" :total="totalElements" :pageSize="pageSize" @change="onPageChange"
            show-less-items />
        </div>
      </div>
    </section>

    <!-- Modals & Drawers -->
    <ChonSanPhamModal v-model:open="isModalOpen" :productData="modalData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { message } from "ant-design-vue";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { getSanPhamOnline, getChiTietSanPhamOnline } from "@/modules/ban-hang-online/api/banHangOnlineApi";
import type { SanPhamOnline, ChiTietSanPhamOnline } from "@/modules/ban-hang-online/types/banHangOnline";
import { getSanPhamImageUrl } from "@/modules/san-pham/api/sanPhamApi";
import { useGioHangOnlineStore } from "@/modules/ban-hang-online/store/gioHangOnlineStore";
import ChonSanPhamModal from "@/modules/ban-hang-online/components/ChonSanPhamModal.vue";
import { onDataChanged } from "@/utils/appSync";

const auth = useAuthStore();
const cartStore = useGioHangOnlineStore();

const productSection = ref<HTMLElement | null>(null);

const products = ref<SanPhamOnline[]>([]);
const loading = ref(false);

const currentPage = ref(1);
const pageSize = ref(12);
const totalElements = ref(0);

const imageError = ref<Record<number, boolean>>({});

// UI state
const isModalOpen = ref(false);
const modalData = ref<ChiTietSanPhamOnline | null>(null);
const fetchingDetailId = ref<number | null>(null);

const triggerOpenCart = () => {
  window.dispatchEvent(new CustomEvent('open-cart'));
};

const loadProducts = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value - 1,
      size: pageSize.value,
    };
    const response = await getSanPhamOnline(params);
    products.value = response.data.data.content;
    totalElements.value = response.data.data.totalElements;
  } catch (error: any) {
    message.error(error.response?.data?.message || "Không thể tải danh sách sản phẩm");
  } finally {
    loading.value = false;
  }
};

let cleanupAppSync: (() => void) | null = null;

onMounted(() => {
  loadProducts();
  cartStore.loadCartForCurrentUser();

  cleanupAppSync = onDataChanged((type) => {
    const relevantEvents = [
      "PRODUCT_UPDATED",
      "KHUYEN_MAI_UPDATED",
      "SIZE_UPDATED",
      "TOPPING_UPDATED",
      "INVENTORY_UPDATED",
      "APP_REVALIDATE"
    ];
    if (relevantEvents.includes(type)) {
      loadProducts();
      if (
        type === "PRODUCT_UPDATED" ||
        type === "KHUYEN_MAI_UPDATED" ||
        type === "SIZE_UPDATED" ||
        type === "APP_REVALIDATE"
      ) {
        cartStore.refreshPrices();
      }
    }
  });
});

onUnmounted(() => {
  if (cleanupAppSync) cleanupAppSync();
});

const onPageChange = (page: number) => {
  currentPage.value = page;
  loadProducts();
  scrollToProducts();
};

const formatCurrency = (value: number | null | undefined) => {
  if (value == null) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const scrollToProducts = () => {
  productSection.value?.scrollIntoView({
    behavior: "smooth",
  });
};

const selectProduct = async (product: SanPhamOnline) => {
  if (fetchingDetailId.value) return;
  fetchingDetailId.value = product.idSanPham;
  try {
    const response = await getChiTietSanPhamOnline(product.idSanPham);
    if (response.data.code === 200) {
      modalData.value = response.data.data;
      isModalOpen.value = true;
    }
  } catch (error: any) {
    message.error(error.response?.data?.message || "Không thể tải chi tiết sản phẩm");
  } finally {
    fetchingDetailId.value = null;
  }
};
</script>

<style scoped>
.shop-page {
  background: #FAF8F5;
  /* Premium off-white / cream */
  color: #1E1E1E;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  min-height: 100vh;
}

.container {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 32px;
}

/* Base Buttons */
.brand-cta {
  background: #8B5E3C;
  border-color: #8B5E3C;
  color: #fff;
  border-radius: 4px;
  font-weight: 600;
  box-shadow: none;
  transition: all 0.3s;
}

.brand-cta:hover {
  background: #A66A3F;
  border-color: #A66A3F;
}

/* Hero Section */
.hero {
  padding: 90px 0;
  position: relative;
  overflow: hidden;
}

.hero-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 60px;
}

.hero-content {
  flex: 1;
  max-width: 600px;
}

.hero-label {
  font-size: 13px;
  font-weight: 700;
  color: #A66A3F;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 24px;
}

.hero-title {
  font-size: 56px;
  font-weight: 800;
  color: #1E1E1E;
  line-height: 1.15;
  margin-bottom: 24px;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-size: 16px;
  color: #6B655F;
  line-height: 1.6;
  margin-bottom: 40px;
  max-width: 480px;
}

.hero-cta {
  height: 52px;
  padding: 0 40px;
  font-size: 16px;
}

.hero-visual {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  position: relative;
}

.hero-image-composition {
  position: relative;
  width: 100%;
  max-width: 500px;
  aspect-ratio: 4/3;
}

.image-box {
  background: #EAE6DF;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  overflow: hidden;
}

.box-main {
  width: 75%;
  height: 85%;
  bottom: 0;
  right: 0;
  z-index: 2;
}

.box-sub {
  width: 50%;
  height: 60%;
  top: 0;
  left: 0;
  z-index: 1;
}

.image-placeholder {
  font-size: 80px;
  opacity: 0.2;
}

.box-sub .image-placeholder {
  font-size: 50px;
}

.brand-stamp {
  position: absolute;
  bottom: 20px;
  left: 30px;
  width: 80px;
  height: 80px;
  background: #8B5E3C;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 800;
  z-index: 3;
}

/* Brand Story Section */
.brand-story {
  padding: 90px 0;
  border-top: 1px solid rgba(139, 94, 60, 0.1);
  border-bottom: 1px solid rgba(139, 94, 60, 0.1);
  background: #FFFDFC;
}

.story-container {
  display: flex;
  gap: 80px;
}

.story-left {
  flex: 1;
  max-width: 600px;
}

.story-label {
  font-size: 12px;
  font-weight: 700;
  color: #A66A3F;
  letter-spacing: 0.1em;
  margin-bottom: 16px;
}

.story-title {
  font-size: 32px;
  font-weight: 700;
  color: #1E1E1E;
  margin-bottom: 24px;
  line-height: 1.3;
}

.story-desc {
  font-size: 15px;
  color: #6B655F;
  line-height: 1.8;
  margin-bottom: 16px;
}

.story-right {
  flex: 1;
  display: flex;
  align-items: center;
}

.values-list {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.value-item h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1E1E1E;
  margin-bottom: 8px;
}

.value-item p {
  font-size: 14px;
  color: #6B655F;
  line-height: 1.6;
  margin: 0;
}

/* Product Section */
.product-section {
  padding: 90px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 48px;
}

.section-label {
  font-size: 12px;
  font-weight: 700;
  color: #A66A3F;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}

.section-title {
  font-size: 36px;
  font-weight: 700;
  color: #1E1E1E;
  margin: 0;
}

.cart-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 10px 16px;
  border-bottom: 1px solid #1E1E1E;
  transition: opacity 0.2s;
}

.cart-trigger:hover {
  opacity: 0.7;
}

.cart-text {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cart-icon-wrap {
  position: relative;
  font-size: 20px;
}

.cart-count {
  position: absolute;
  top: -8px;
  right: -10px;
  background: #8B5E3C;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

/* Product Card */
.product-card {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.product-image-wrap {
  width: 100%;
  aspect-ratio: 4/5;
  background: #EAE6DF;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  margin-bottom: 16px;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.product-card:hover .product-img {
  transform: scale(1.03);
}

.img-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
  opacity: 0.2;
}

.promo-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  color: #8B5E3C;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.product-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-name {
  font-size: 16px;
  font-weight: 700;
  color: #1E1E1E;
  margin: 0 0 8px;
  line-height: 1.4;
}

.product-desc {
  font-size: 13px;
  color: #6B655F;
  margin: 0 0 16px;
  line-height: 1.5;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.price-block {
  display: flex;
  flex-direction: column;
}

.current-price {
  font-size: 16px;
  font-weight: 700;
  color: #8B5E3C;
}

.old-price {
  font-size: 12px;
  color: #A3A3A3;
  text-decoration: line-through;
  margin-top: 2px;
}

.select-btn {
  background: transparent;
  border: 1px solid #1E1E1E;
  color: #1E1E1E;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.product-card:hover .select-btn {
  background: #1E1E1E;
  color: #fff;
}

.select-btn.loading {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 80px 0;
  color: #6B655F;
  font-size: 16px;
}

.pagination-wrap {
  margin-top: 60px;
  text-align: center;
}

.pagination-wrap :deep(.ant-pagination-item-active) {
  border-color: #8B5E3C;
}

.pagination-wrap :deep(.ant-pagination-item-active a) {
  color: #8B5E3C;
}

/* Skeleton */
.skeleton-img {
  width: 100%;
  height: 100%;
}

.skeleton-card :deep(.ant-skeleton-image) {
  width: 100%;
  height: 100%;
  border-radius: 0;
}

/* Responsive */
@media (max-width: 900px) {
  .hero-title {
    font-size: 42px;
  }

  .story-container {
    flex-direction: column;
    gap: 40px;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 20px;
  }

  .hero {
    padding: 60px 0;
  }

  .hero-container {
    flex-direction: column;
  }

  .hero-visual {
    width: 100%;
    justify-content: center;
    margin-top: 20px;
  }

  .hero-title {
    font-size: 36px;
  }

  .brand-story,
  .product-section {
    padding: 60px 0;
  }

  .section-title {
    font-size: 28px;
  }
}
</style>
