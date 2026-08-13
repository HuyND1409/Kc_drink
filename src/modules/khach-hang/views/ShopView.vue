<template>
  <div class="shop-page">

    <section class="hero">
      <div class="hero-content">
        <div>
          <p class="welcome-label">KC DRINK ONLINE</p>

          <h1>
            Chào mừng
            <span>{{ auth.user?.tenNguoiDung || "Khách hàng" }}</span>
          </h1>

          <p class="hero-description">
            Chọn món bạn yêu thích và thưởng thức một ly trà sữa thật ngon hôm nay.
          </p>

          <div class="customer-info">
            <div class="point-box">
              <span class="point-label">Điểm tích lũy</span>
              <strong>{{ auth.user?.diemTichLuy ?? 0 }}</strong>
            </div>

            <a-button type="primary" size="large" @click="scrollToProducts">
              Đặt trà sữa ngay
            </a-button>
          </div>
        </div>

        <div class="hero-icon">
          🧋
        </div>
      </div>
    </section>

    <section ref="productSection" class="product-section">
      <div class="section-header">
        <div>
          <p class="section-subtitle">MENU KC DRINK</p>
          <h2>Sản phẩm nổi bật</h2>
        </div>

        <span class="demo-label">
          Dữ liệu demo
        </span>
      </div>

      <a-row :gutter="[20, 20]">
        <a-col
          v-for="product in products"
          :key="product.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <a-card hoverable class="product-card">

            <div class="product-image">
              <span>{{ product.icon }}</span>
            </div>

            <div class="product-content">
              <div class="product-name">
                {{ product.name }}
              </div>

              <div class="product-description">
                {{ product.description }}
              </div>

              <div class="product-footer">
                <span class="product-price">
                  {{ formatCurrency(product.price) }}
                </span>

                <a-button
                  type="primary"
                  shape="circle"
                  @click="selectProduct(product)"
                >
                  +
                </a-button>
              </div>
            </div>

          </a-card>
        </a-col>
      </a-row>
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { message } from "ant-design-vue";
import { useAuthStore } from "@/modules/auth/store/authStore";

const auth = useAuthStore();

const productSection = ref<HTMLElement | null>(null);

const products = [
  {
    id: 1,
    name: "Trà sữa truyền thống",
    description: "Vị trà sữa thơm béo, dễ uống",
    price: 29000,
    icon: "🧋",
  },
  {
    id: 2,
    name: "Trà sữa Matcha",
    description: "Matcha thơm nhẹ kết hợp sữa béo",
    price: 35000,
    icon: "🍵",
  },
  {
    id: 3,
    name: "Trà đào cam sả",
    description: "Thanh mát, thơm đào và cam",
    price: 32000,
    icon: "🍑",
  },
  {
    id: 4,
    name: "Trà sữa Socola",
    description: "Socola đậm vị, ngọt vừa phải",
    price: 34000,
    icon: "🍫",
  },
  {
    id: 5,
    name: "Trà vải",
    description: "Trà trái cây thanh mát",
    price: 30000,
    icon: "🍹",
  },
  {
    id: 6,
    name: "Trà sữa Khoai môn",
    description: "Khoai môn thơm béo, mềm mịn",
    price: 35000,
    icon: "🥤",
  },
  {
    id: 7,
    name: "Hồng trà sữa",
    description: "Hương trà đậm, vị sữa dịu",
    price: 30000,
    icon: "🧋",
  },
  {
    id: 8,
    name: "Trà chanh",
    description: "Chua ngọt nhẹ, giải khát",
    price: 25000,
    icon: "🍋",
  },
];

const formatCurrency = (value: number) => {
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

const selectProduct = (product: typeof products[number]) => {
  message.info(`Đã chọn ${product.name} - giỏ hàng sẽ làm sau`);
};
</script>

<style scoped>
.shop-page {
  min-height: 100vh;
  padding: 32px;
  background: #f7f8fa;
}

.hero {
  max-width: 1200px;
  margin: 0 auto;
  padding: 42px 48px;
  border-radius: 20px;
  background: linear-gradient(135deg, #fff7ed 0%, #fff 60%, #f0f7ff 100%);
  border: 1px solid #f0f0f0;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.05);
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
}

.welcome-label {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  color: #d97706;
  letter-spacing: 0.12em;
}

.hero h1 {
  margin: 0;
  font-size: 34px;
  font-weight: 800;
  color: #1f2937;
}

.hero h1 span {
  color: #1677ff;
}

.hero-description {
  max-width: 580px;
  margin-top: 14px;
  color: #6b7280;
  font-size: 15px;
  line-height: 1.7;
}

.customer-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.point-box {
  min-width: 130px;
  padding: 10px 16px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
}

.point-label {
  font-size: 12px;
  color: #8c8c8c;
}

.point-box strong {
  margin-top: 2px;
  font-size: 20px;
  color: #faad14;
}

.hero-icon {
  width: 160px;
  height: 160px;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
}

.product-section {
  max-width: 1200px;
  margin: 36px auto 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
}

.section-subtitle {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 700;
  color: #8c8c8c;
  letter-spacing: 0.12em;
}

.section-header h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 750;
  color: #1f2937;
}

.demo-label {
  padding: 5px 10px;
  border-radius: 6px;
  background: #fff7e6;
  color: #d48806;
  font-size: 12px;
  font-weight: 600;
}

.product-card {
  height: 100%;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid #f0f0f0;
}

.product-image {
  height: 180px;
  background: linear-gradient(145deg, #f8fafc, #eef2f7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image span {
  font-size: 72px;
}

.product-content {
  padding-top: 4px;
}

.product-name {
  font-size: 16px;
  font-weight: 700;
  color: #262626;
}

.product-description {
  min-height: 42px;
  margin-top: 7px;
  font-size: 13px;
  color: #8c8c8c;
  line-height: 1.6;
}

.product-footer {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  font-size: 17px;
  font-weight: 700;
  color: #1677ff;
}

:deep(.product-card .ant-card-body) {
  padding: 18px;
}

:deep(.ant-btn) {
  border-radius: 8px;
}

@media (max-width: 768px) {
  .shop-page {
    padding: 18px;
  }

  .hero {
    padding: 26px;
  }

  .hero-content {
    align-items: flex-start;
  }

  .hero h1 {
    font-size: 27px;
  }

  .hero-icon {
    display: none;
  }

  .customer-info {
    flex-wrap: wrap;
  }
}
</style>
