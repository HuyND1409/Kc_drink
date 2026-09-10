<template>
  <div class="shop-login-page">
    <div class="shop-login-card">
      <!-- Brand -->
      <div class="shop-login-brand">
        <div class="brand-name">KC Drink</div>
        <div class="brand-subtitle">Teahouse &amp; Coffee</div>
        <p class="brand-desc">Đăng nhập để mua hàng</p>
      </div>

      <!-- Form -->
      <form class="shop-login-form" @submit.prevent="handleLogin" novalidate>
        <!-- Username -->
        <div class="form-group">
          <label class="form-label" for="shop-login-username">Tên đăng nhập / Số điện thoại</label>
          <input
            id="shop-login-username"
            v-model="form.usernameOrEmail"
            type="text"
            class="form-input"
            :class="{ 'form-input--error': errors.usernameOrEmail }"
            placeholder="Nhập tên đăng nhập hoặc số điện thoại"
            autocomplete="username"
            :disabled="loading"
          />
          <span v-if="errors.usernameOrEmail" class="form-error">{{ errors.usernameOrEmail }}</span>
        </div>

        <!-- Password -->
        <div class="form-group">
          <label class="form-label" for="shop-login-password">Mật khẩu</label>
          <div class="password-wrap">
            <input
              id="shop-login-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              :class="{ 'form-input--error': errors.password }"
              placeholder="Nhập mật khẩu"
              autocomplete="current-password"
              :disabled="loading"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
              tabindex="-1"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <span v-if="errors.password" class="form-error">{{ errors.password }}</span>
        </div>

        <!-- Forgot password -->
        <div class="forgot-row">
          <router-link :to="forgotPasswordLink" class="forgot-link">Quên mật khẩu?</router-link>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="btn-login"
          :disabled="loading"
          id="shop-login-submit"
        >
          <span v-if="loading" class="btn-spinner"></span>
          <span>{{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}</span>
        </button>

        <!-- Register -->
        <div class="register-row">
          <span class="register-hint">Chưa có tài khoản?</span>
          <router-link :to="registerLink" class="register-link">Đăng ký ngay</router-link>
        </div>

        <!-- Continue browsing -->
        <div class="continue-row">
          <router-link to="/shop" class="continue-link">Tiếp tục xem sản phẩm →</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { message } from "ant-design-vue";
import { login } from "@/api/auth";
import { useAuthStore } from "@/modules/auth/store/authStore";

const router = useRouter();
const auth = useAuthStore();

const loading = ref(false);
const showPassword = ref(false);

const form = reactive({
  usernameOrEmail: "",
  password: "",
});

const errors = reactive({
  usernameOrEmail: "",
  password: "",
});

const registerLink = computed(() => "/register?from=shop");
const forgotPasswordLink = computed(() => "/forgot-password?from=shop");

const validate = (): boolean => {
  errors.usernameOrEmail = "";
  errors.password = "";
  let valid = true;

  if (!form.usernameOrEmail.trim()) {
    errors.usernameOrEmail = "Vui lòng nhập tên đăng nhập hoặc số điện thoại";
    valid = false;
  }
  if (!form.password.trim()) {
    errors.password = "Vui lòng nhập mật khẩu";
    valid = false;
  }
  return valid;
};

const handleLogin = async () => {
  if (loading.value) return;
  if (!validate()) return;

  loading.value = true;
  try {
    const response = await login({
      usernameOrEmail: form.usernameOrEmail.trim(),
      password: form.password.trim(),
    });

    const token = response.data.data;
    auth.setToken(token);

    try {
      await auth.fetchMe();
    } catch {
      // Lấy thông tin người dùng thất bại → dọn phiên vừa tạo
      auth.logout();
      message.error("Không thể lấy thông tin người dùng. Vui lòng thử lại.");
      return;
    }

    message.success("Đăng nhập thành công");

    const role = auth.user?.role;
    if (role === "USER") {
      router.push("/shop");
    } else {
      // ADMIN / STAFF về trang quản trị
      router.push("/");
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        message.error("Không thể kết nối đến máy chủ");
      } else if (error.response.status === 401) {
        message.error("Tên đăng nhập hoặc mật khẩu không chính xác");
      } else if (error.response.status === 403) {
        message.error(
          error.response.data?.message ||
          "Tài khoản đã bị khóa hoặc không có quyền truy cập"
        );
      } else {
        message.error(error.response.data?.message || "Đăng nhập thất bại");
      }
    } else {
      message.error("Có lỗi xảy ra");
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.shop-login-page {
  min-height: 100vh;
  background: #FAF8F5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.shop-login-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 16px;
  padding: 40px 32px 32px;
  box-shadow: 0 4px 32px rgba(139, 94, 60, 0.08);
  border: 1px solid rgba(139, 94, 60, 0.08);
}

/* Brand */
.shop-login-brand {
  text-align: center;
  margin-bottom: 32px;
}

.brand-name {
  font-size: 28px;
  font-weight: 800;
  color: #8B5E3C;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.brand-subtitle {
  font-size: 11px;
  color: #A66A3F;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-top: 2px;
}

.brand-desc {
  font-size: 14px;
  color: #6B655F;
  margin-top: 12px;
  margin-bottom: 0;
}

/* Form */
.shop-login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #4A4540;
}

.form-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1px solid #D6D2CC;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: #1E1E1E;
  background: #FAFAF8;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  outline: none;
}

.form-input:focus {
  border-color: #8B5E3C;
  box-shadow: 0 0 0 3px rgba(139, 94, 60, 0.1);
  background: #fff;
}

.form-input--error {
  border-color: #D9363E;
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-error {
  font-size: 12px;
  color: #D9363E;
}

/* Password toggle */
.password-wrap {
  position: relative;
}

.password-wrap .form-input {
  padding-right: 44px;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0;
  color: #6B655F;
}

/* Forgot */
.forgot-row {
  text-align: right;
  margin-top: -4px;
}

.forgot-link {
  font-size: 13px;
  color: #A66A3F;
  text-decoration: none;
  transition: color 0.2s;
}

.forgot-link:hover {
  color: #8B5E3C;
  text-decoration: underline;
}

/* Submit button */
.btn-login {
  width: 100%;
  height: 48px;
  background: #8B5E3C;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}

.btn-login:hover:not(:disabled) {
  background: #A66A3F;
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Register */
.register-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
}

.register-hint {
  color: #6B655F;
}

.register-link {
  color: #8B5E3C;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s;
}

.register-link:hover {
  color: #A66A3F;
  text-decoration: underline;
}

/* Continue browsing */
.continue-row {
  text-align: center;
}

.continue-link {
  font-size: 13px;
  color: #9B9590;
  text-decoration: none;
  transition: color 0.2s;
}

.continue-link:hover {
  color: #6B655F;
}

/* Mobile */
@media (max-width: 480px) {
  .shop-login-card {
    padding: 32px 20px 24px;
  }
}
</style>
