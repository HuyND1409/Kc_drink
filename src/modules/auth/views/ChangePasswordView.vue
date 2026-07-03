<template>
  <div class="change-password-container">

    <div class="brand-wrapper">
      <div class="brand-logo">
        <span class="logo-placeholder">KC</span>
        </div>
      <h1 class="brand-name">KC DRINK</h1>
      <p class="brand-subtitle">Hệ thống quản lý & Bán hàng Online</p>
    </div>

    <a-card class="password-card" :bordered="false">
      <template #title>
        <div class="card-title">
          <LockOutlined class="title-icon" />
          <span>Đổi mật khẩu bảo mật</span>
        </div>
      </template>

      <a-form layout="vertical" @submit.prevent="handleChangePassword">

        <a-form-item label="Mật khẩu cũ" required>
          <a-input-password
            size="large"
            v-model:value="form.oldPassword"
            placeholder="Nhập mật khẩu hiện tại..."
          >
            <template #prefix><KeyOutlined class="input-icon" /></template>
          </a-input-password>
        </a-form-item>

        <a-form-item label="Mật khẩu mới" required>
          <a-input-password
            size="large"
            v-model:value="form.newPassword"
            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
          >
            <template #prefix><LockOutlined class="input-icon" /></template>
          </a-input-password>
        </a-form-item>

        <a-form-item label="Xác nhận mật khẩu mới" required>
          <a-input-password
            size="large"
            v-model:value="form.confirmPassword"
            placeholder="Nhập lại mật khẩu mới..."
          >
            <template #prefix><CheckCircleOutlined class="input-icon" /></template>
          </a-input-password>
        </a-form-item>

        <div class="action-buttons">
          <a-button size="large" class="btn-cancel" @click="handleCancel">
            Quay lại
          </a-button>
          <a-button size="large" type="primary" html-type="submit" :loading="loading" class="btn-submit">
            Cập nhật mật khẩu
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
import { LockOutlined, KeyOutlined, CheckCircleOutlined } from "@ant-design/icons-vue";

const router = useRouter();
const loading = ref(false);
const form = reactive({ oldPassword: "", newPassword: "", confirmPassword: "" });

const handleCancel = () => {
  router.push("/");
};

const handleChangePassword = async () => {
  if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
    message.warning("Vui lòng điền đầy đủ thông tin!");
    return;
  }

  if (form.newPassword !== form.confirmPassword) {
    message.error("Mật khẩu xác nhận không khớp!");
    return;
  }

  loading.value = true;
  try {
    await api.post("/auth/change-password", {
      oldPassword: form.oldPassword,
      newPassword: form.newPassword
    });

    message.success("Đổi mật khẩu thành công!");
    router.push("/");

  } catch (error: unknown) {
    console.error("Lỗi đổi mật khẩu:", error);
    if (axios.isAxiosError(error)) {
      message.error(error.response?.data?.message || "Mật khẩu cũ không chính xác!");
    } else {
      message.error("Có lỗi xảy ra trong quá trình kết nối!");
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Toàn bộ màn hình căn giữa */
.change-password-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: calc(100vh - 64px); /* Tự căn theo chiều cao màn hình trừ đi thanh header */
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

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
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
.password-card {
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
