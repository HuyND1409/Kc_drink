<template>
  <div class="login-container">
    <a-card class="login-card" :bordered="false">

      <div class="brand-header">
        <h1 class="title">☕ KC Drink</h1>
        <p class="sub-title">Khôi phục mật khẩu</p>
      </div>

      <a-form layout="vertical" @submit.prevent="handleForgotPassword">

        <a-form-item label="Địa chỉ Email">
          <a-input v-model:value="form.email" placeholder="Nhập email đã đăng ký của bạn" size="large" />
        </a-form-item>

        <a-button type="primary" html-type="submit" block size="large" :loading="loading" :disabled="loading"
          class="btn-submit">
          Gửi mật khẩu mới
        </a-button>

        <div class="back-to-login">
          <router-link to="/login">← Quay lại đăng nhập</router-link>
        </div>

      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { message } from "ant-design-vue";

const router = useRouter();
const loading = ref(false);

const form = reactive({
  email: "",
});

const handleForgotPassword = async () => {
  if (!form.email.trim()) {
    message.warning("Vui lòng nhập email của bạn");
    return;
  }

  // Regex kiểm tra định dạng email cơ bản
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(form.email.trim())) {
    message.warning("Email không đúng định dạng");
    return;
  }

  loading.value = true;

  try {
    // Gọi thẳng đến API backend trên cổng 8080.
    // Nếu project của bạn có baseURL khác, hãy đổi URL tại đây.
    const response = await axios.post("http://localhost:8080/api/auth/forgot-password", {
      email: form.email.trim()
    });

    message.success(response.data.message || "Mật khẩu mới đã được gửi vào email của bạn!");

    // Đẩy user về lại trang đăng nhập sau khi gửi mail thành công
    setTimeout(() => {
      router.push("/login");
    }, 1500);

  } catch (error: unknown) {
    console.error(error);
    if (axios.isAxiosError(error)) {
      message.error(
        error.response?.data?.message || "Không tìm thấy email này trong hệ thống"
      );
    } else {
      message.error("Có lỗi xảy ra khi gửi yêu cầu");
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* CSS đồng bộ y hệt LoginView.vue */
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f2f5;
}

.login-card {
  width: 400px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  background: #ffffff;
  padding: 12px 8px;
}

.brand-header {
  text-align: center;
  margin-bottom: 28px;
}

.title {
  font-size: 26px;
  font-weight: 700;
  color: #1f1f1f;
  margin-bottom: 4px;
}

.sub-title {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 0;
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: #434343;
}

.btn-submit {
  height: 40px;
  font-weight: 500;
  font-size: 15px;
  border-radius: 6px;
  margin-top: 8px;
}

.back-to-login {
  text-align: center;
  margin-top: 16px;
}

.back-to-login a {
  font-size: 14px;
  color: #8c8c8c;
  transition: color 0.3s;
}

.back-to-login a:hover {
  color: #1890ff;
}
</style>
