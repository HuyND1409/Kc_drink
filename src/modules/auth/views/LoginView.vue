<template>
  <div class="login-container">
    <a-card class="login-card" :bordered="false">

      <div class="brand-header">
        <h1 class="title">☕ KC Drink</h1>
        <p class="sub-title">Hệ thống quản lý bán trà sữa</p>
      </div>

      <a-form layout="vertical" @submit.prevent="handleLogin">

        <a-form-item label="Tên đăng nhập / Số điện thoại">
          <a-input v-model:value="form.username" placeholder="Nhập tên đăng nhập hoặc số điện thoại" size="large" />
        </a-form-item>

        <a-form-item label="Mật khẩu">
          <a-input-password v-model:value="form.password" placeholder="Nhập mật khẩu" size="large" />
        </a-form-item>

        <div class="forgot-password-wrapper">
          <router-link to="/forgot-password" class="forgot-link">Quên mật khẩu?</router-link>
        </div>

        <a-button type="primary" block html-type="submit" size="large">
          Đăng nhập
        </a-button>

        <div style="text-align: center; margin-top: 20px; font-size: 14px;">
          <span style="color: #8c8c8c;">Khách hàng mới? </span>
          <router-link to="/register" style="font-weight: 500; color: #1677ff;">
            Tạo tài khoản ngay
          </router-link>
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

import { login } from "@/api/auth";
import { useAuthStore } from "../store/authStore";

const router = useRouter();
const auth = useAuthStore();

const loading = ref(false);

const form = reactive({
  username: "",
  password: "",
});

const handleLogin = async () => {
  if (!form.username.trim()) {
    message.warning("Vui lòng nhập tên đăng nhập hoặc số điện thoại");
    return;
  }

  if (!form.password.trim()) {
    message.warning("Vui lòng nhập mật khẩu");
    return;
  }

  loading.value = true;

  try {
    const response = await login({
      usernameOrEmail: form.username.trim(),
      password: form.password.trim(),
    });

    const token = response.data.data;
    auth.setToken(token);
    await auth.fetchMe();

    message.success("Đăng nhập thành công");
    router.push("/");
  } catch (error: unknown) {
    console.error(error);
    if (axios.isAxiosError(error)) {
      message.error(
        error.response?.data?.message || "Đăng nhập thất bại"
      );
    } else {
      message.error("Có lỗi xảy ra");
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
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

/* CSS căn phải cho chữ Quên mật khẩu */
.forgot-password-wrapper {
  text-align: right;
  margin-top: -16px;
  margin-bottom: 16px;
}

.forgot-link {
  font-size: 14px;
  color: #1890ff;
  transition: all 0.3s;
}

.forgot-link:hover {
  color: #40a9ff;
  text-decoration: underline;
}

.btn-submit {
  height: 40px;
  font-weight: 500;
  font-size: 15px;
  border-radius: 6px;
}
</style>
