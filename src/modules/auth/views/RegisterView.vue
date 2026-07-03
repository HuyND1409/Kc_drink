<template>
  <div class="auth-container">
    <div class="auth-card">

      <div class="brand-header">
        <h2>☕ KC Drink</h2>
        <p>Đăng ký tài khoản khách hàng</p>
      </div>

      <a-form layout="vertical" @submit.prevent="handleRegister">

        <a-form-item label="Tên đăng nhập / Số điện thoại" required>
          <a-input
            size="large"
            v-model:value="form.username"
            placeholder="Nhập số điện thoại của bạn..."
          />
        </a-form-item>

        <a-form-item label="Email (Dùng để lấy lại mật khẩu)" required>
          <a-input
            size="large"
            v-model:value="form.email"
            placeholder="Nhập địa chỉ email..."
          />
        </a-form-item>

        <a-form-item label="Mật khẩu" required>
          <a-input-password
            size="large"
            v-model:value="form.password"
            placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)..."
          />
        </a-form-item>

        <a-form-item label="Xác nhận mật khẩu" required>
          <a-input-password
            size="large"
            v-model:value="form.confirmPassword"
            placeholder="Nhập lại mật khẩu..."
          />
        </a-form-item>

        <a-button type="primary" block html-type="submit" size="large" :loading="loading">
          Đăng ký ngay
        </a-button>

        <div class="login-link">
          <span style="color: #8c8c8c;">Đã có tài khoản? </span>
          <router-link to="/login" style="font-weight: 500;">Đăng nhập</router-link>
        </div>

      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { message } from "ant-design-vue";
import { useRouter } from "vue-router";
import axios from "axios";
import api from "@/api/axios";

const router = useRouter();
const loading = ref(false);
const form = reactive({ username: "", email: "", password: "", confirmPassword: "" });

const handleRegister = async () => {
  if (!form.username || !form.email || !form.password) {
    message.warning("Vui lòng điền đầy đủ thông tin!");
    return;
  }

  if (form.password !== form.confirmPassword) {
    message.error("Mật khẩu xác nhận không khớp!");
    return;
  }

  loading.value = true;
  try {
    // Gọi API sang Backend
    await api.post("/auth/register", {
      username: form.username,
      email: form.email,
      password: form.password
    });

    message.success("Tạo tài khoản thành công! Vui lòng đăng nhập.");
    router.push("/login");

  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      message.error(error.response?.data?.message || "Tên đăng nhập hoặc Email đã tồn tại!");
    } else {
      message.error("Có lỗi xảy ra kết nối máy chủ!");
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 20px;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
}

.brand-header {
  text-align: center;
  margin-bottom: 24px;
}

.brand-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.brand-header p {
  color: #8c8c8c;
  margin-top: 4px;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
}
</style>
