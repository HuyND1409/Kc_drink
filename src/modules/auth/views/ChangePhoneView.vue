<template>
  <div class="change-phone-container">

    <div class="brand-wrapper">
      <div class="brand-logo">
        <span class="logo-placeholder">KC</span>
        </div>
      <h1 class="brand-name">KC DRINK</h1>
      <p class="brand-subtitle">Hệ thống quản lý &amp; Bán hàng Online</p>
    </div>

    <a-card class="phone-card" :bordered="false">
      <template #title>
        <div class="card-title">
          <PhoneOutlined class="title-icon" />
          <span>Đổi số điện thoại đăng nhập</span>
        </div>
      </template>

      <a-form layout="vertical" @submit.prevent="handleChangePhone">

        <a-form-item label="Số điện thoại đăng nhập mới" required>
          <a-input
            size="large"
            v-model:value="form.newPhone"
            placeholder="Nhập số điện thoại mới (10 chữ số)..."
          >
            <template #prefix><PhoneOutlined class="input-icon" /></template>
          </a-input>
        </a-form-item>

        <a-form-item label="Mật khẩu hiện tại" required>
          <a-input-password
            size="large"
            v-model:value="form.password"
            placeholder="Nhập mật khẩu hiện tại để xác nhận..."
          >
            <template #prefix><LockOutlined class="input-icon" /></template>
          </a-input-password>
        </a-form-item>

        <div class="action-buttons">
          <a-button size="large" class="btn-cancel" @click="handleCancel">
            Quay lại
          </a-button>
          <a-button size="large" type="primary" html-type="submit" :loading="loading" class="btn-submit">
            Cập nhật số điện thoại
          </a-button>
        </div>

      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { message } from "ant-design-vue";
import { useRouter } from "vue-router";
import axios from "axios";
import api from "@/api/axios";
import { PhoneOutlined, LockOutlined } from "@ant-design/icons-vue";
import { useAuthStore } from "@/modules/auth/store/authStore";

const router = useRouter();
const auth = useAuthStore();
const loading = ref(false);
const form = reactive({ newPhone: "", password: "" });

const handleCancel = () => {
  router.push("/shop");
};

const handleChangePhone = async () => {
  if (!form.newPhone || !form.password) {
    message.warning("Vui lòng điền đầy đủ thông tin!");
    return;
  }

  // Validate định dạng số điện thoại Việt Nam: bắt đầu bằng 0, đủ 10 chữ số
  const phoneRegex = /^0\d{9}$/;
  if (!phoneRegex.test(form.newPhone)) {
    message.error("Số điện thoại phải bắt đầu bằng 0 và đủ 10 chữ số!");
    return;
  }

  loading.value = true;
  try {
    await api.post("/auth/change-phone", {
      newPhone: form.newPhone,
      password: form.password,
    });

    message.success("Đổi số điện thoại đăng nhập thành công. Vui lòng đăng nhập lại.");
    auth.logout();
    router.push("/login");

  } catch (error: unknown) {
    console.error("Lỗi đổi số điện thoại:", error);
    if (axios.isAxiosError(error)) {
      message.error(
        error.response?.data?.message || "Không thể đổi số điện thoại đăng nhập"
      );
    } else {
      message.error("Không thể đổi số điện thoại đăng nhập");
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Toàn bộ màn hình căn giữa */
.change-phone-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: calc(100vh - 64px);
}

/* Style vùng thương hiệu */
.brand-wrapper {
  text-align: center;
  margin-bottom: 24px;
}

.brand-logo {
  width: 60px;
  height: 60px;
  background: #1677ff;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px auto;
  box-shadow: 0 4px 10px rgba(22, 119, 255, 0.2);
}

.logo-placeholder {
  font-size: 22px;
  font-weight: bold;
  letter-spacing: 1px;
}

.brand-name {
  font-size: 24px;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0;
  letter-spacing: 1.5px;
}

.brand-subtitle {
  font-size: 13px;
  color: #8c8c8c;
  margin: 4px 0 0 0;
}

/* Style Thẻ Card Form */
.phone-card {
  width: 100%;
  max-width: 450px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  background: #ffffff;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #1f1f1f;
}

.title-icon {
  color: #1677ff;
  font-size: 20px;
}

.input-icon {
  color: rgba(0, 0, 0, 0.25);
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.btn-cancel, .btn-submit {
  border-radius: 6px;
}

.btn-submit {
  font-weight: 500;
}
</style>
