<template>
  <div class="profile-container">
    <a-card class="profile-card" :bordered="false">

      <template #title>
        <div class="card-header">
          <div class="pf-avatar">
            {{ (form.tenKhachHang || form.sdt || 'U').charAt(0).toUpperCase() }}
          </div>
          <div class="header-info">
            <div class="card-title">
              <UserOutlined class="title-icon" />
              <span>Thông tin cá nhân</span>
            </div>
            <div class="header-sub">
              <span class="header-name">{{ form.tenKhachHang || 'Chưa cập nhật' }}</span>
              <span class="header-dot">·</span>
              <span class="header-username">@{{ form.username }}</span>
            </div>
          </div>
        </div>
      </template>

      <a-spin :spinning="pageLoading">
        <a-form layout="vertical" @submit.prevent="handleUpdateProfile">

          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item label="Họ và tên">
                <a-input size="large" v-model:value="form.tenKhachHang" placeholder="Nhập họ và tên thật của bạn..." />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :sm="12">
              <a-form-item label="Số điện thoại hoặc tên đăng nhập">
                <a-input size="large" v-model:value="form.username" disabled />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :sm="12">
              <a-form-item label="Số điện thoại liên hệ">
                <a-input size="large" v-model:value="form.sdt" placeholder="Nhập số điện thoại liên hệ" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="Địa chỉ Email">
                <a-input size="large" v-model:value="form.email" placeholder="Nhập địa chỉ email..." />
              </a-form-item>
            </a-col>

            <a-col :xs="24" :sm="12">
              <a-form-item label="Giới tính">
                <a-radio-group v-model:value="form.gioiTinh" size="large" class="gender-radio">
                  <a-radio-button :value="true">Nam</a-radio-button>
                  <a-radio-button :value="false">Nữ</a-radio-button>
                </a-radio-group>
              </a-form-item>
            </a-col>

            <a-col :xs="24" :sm="12">
              <a-form-item label="Ngày sinh">
                <a-date-picker size="large" v-model:value="form.ngaySinh" style="width:100%" format="DD/MM/YYYY"
                  placeholder="Chọn ngày sinh..." />
              </a-form-item>
            </a-col>
          </a-row>

          <div class="action-buttons">
            <a-button size="large" class="btn-cancel" @click="handleBack">
              Quay lại
            </a-button>
            <a-button size="large" type="primary" html-type="submit" :loading="submitLoading" class="btn-submit">
              Lưu thay đổi
            </a-button>
          </div>

        </a-form>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { message } from "ant-design-vue";
import { useRouter } from "vue-router";
import { UserOutlined } from "@ant-design/icons-vue";
import dayjs from "dayjs";
import api from "@/api/axios";
import { notifyDataChanged } from "@/utils/appSync";

// ĐÃ THÊM: Import store quản lý trạng thái đăng nhập của nhóm bạn
import { useAuthStore } from "@/modules/auth/store/authStore";

const router = useRouter();
const auth = useAuthStore(); // Khởi tạo biến auth từ store

const pageLoading = ref(false);
const submitLoading = ref(false);

const form = reactive({
  tenKhachHang: "",
  username: "",
  sdt: "",
  email: "",
  gioiTinh: true,
  ngaySinh: null as any,
});

// 1. Tự động lấy dữ liệu từ API /auth/me khi vừa vào trang
const loadUserProfile = async () => {
  pageLoading.value = true;
  try {
    const response = await api.get("/auth/me");

    // ĐÃ SỬA: Bóc tách dữ liệu chuẩn .data.data của nhóm
    const userData = response.data?.data || response.data;

    if (userData) {
      form.tenKhachHang = userData.tenNguoiDung || "";
      form.username = userData.username || "";
      form.sdt = userData.sdt || "";
      form.email = userData.email || "";

      // Nếu có dữ liệu mở rộng từ DB thì fill lên, không thì để mặc định
      form.gioiTinh = userData.gioiTinh !== undefined ? userData.gioiTinh : true;
      form.ngaySinh = userData.ngaySinh ? dayjs(userData.ngaySinh) : null;
    } else {
      useFallbackStore();
    }
  } catch (error) {
    console.error("Lỗi lấy thông tin cá nhân qua API:", error);
    // Kích hoạt luồng cứu cánh lấy từ Pinia Store nếu API lỗi
    useFallbackStore();
  } finally {
    pageLoading.value = false;
  }
};

// Hàm lấy dữ liệu trực tiếp từ Store đang đăng nhập (Tránh form bị trống trơn)
const useFallbackStore = () => {
  if (auth.user) {
    form.tenKhachHang = auth.user.tenNguoiDung || "";
    form.username = auth.user.username || "";
    form.sdt = "";
    form.email = auth.user.email || "";
    form.gioiTinh = true; // Mặc định do MeResponse của nhóm chưa có trường này
    form.ngaySinh = null;
    if (auth.user.gioiTinh !== undefined && auth.user.gioiTinh !== null) {
      form.gioiTinh = auth.user.gioiTinh;
    }
    form.ngaySinh = auth.user.ngaySinh
      ? dayjs(auth.user.ngaySinh)
      : null;
  } else {
    message.error("Không tìm thấy dữ liệu phiên đăng nhập!");
  }
};

// Hàm điều hướng nút Quay lại thông minh dựa trên Role người dùng
const handleBack = () => {
  if (auth.user?.role === "USER") {
    router.push("/shop"); // Khách hàng về trang mua đồ uống
  } else {
    router.push("/");     // Admin/Nhân viên về trang Dashboard quản trị
  }
};

// 2. Hàm xử lý gửi dữ liệu cập nhật lên Backend
const handleUpdateProfile = async () => {
  if (!form.tenKhachHang) {
    message.warning("Vui lòng điền họ và tên!");
    return;
  }

  submitLoading.value = true;
  try {
    const submitData = {
      tenKhachHang: form.tenKhachHang,
      email: form.email,
      gioiTinh: form.gioiTinh,
      sdt: form.sdt,
      ngaySinh: form.ngaySinh ? dayjs(form.ngaySinh).format("YYYY-MM-DD") : null
    };

    await api.put(
      auth.user?.role === "USER"
        ? "/auth/update-customer-profile"
        : "/auth/update-profile",
      submitData
    );
    message.success("Cập nhật thông tin cá nhân thành công!");

    // Cập nhật lại thông tin hiển thị trên HeaderBar ngay lập tức mà không cần F5
    if (auth.user) {
      auth.user.tenNguoiDung = form.tenKhachHang;
      auth.user.email = form.email;
    }
    await auth.fetchMe();
    notifyDataChanged("PROFILE_UPDATED");
    if (auth.user?.role === "USER") {
      notifyDataChanged("CUSTOMER_UPDATED");
    }
    handleBack();

  } catch (error) {
    message.error("Có lỗi xảy ra khi cập nhật thông tin!");
  } finally {
    submitLoading.value = false;
  }
};

onMounted(() => {
  loadUserProfile();
});
</script>

<style scoped>
.profile-container {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
}

.profile-card {
  width: 100%;
  max-width: 620px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  background: #ffffff;
}

/* Header với avatar */
.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pf-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #1677ff;
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  user-select: none;
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.25);
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #1f1f1f;
}

.title-icon {
  color: #1677ff;
  font-size: 18px;
}

.header-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.header-name {
  color: #595959;
  font-weight: 500;
}

.header-dot {
  color: #d9d9d9;
}

.header-username {
  color: #8c8c8c;
}

/* Giới tính dùng radio-button Ant Design */
.gender-radio {
  width: 100%;
  display: flex;
}

:deep(.gender-radio .ant-radio-button-wrapper) {
  flex: 1;
  text-align: center;
  border-radius: 0;
  font-weight: 500;
}

:deep(.gender-radio .ant-radio-button-wrapper:first-child) {
  border-radius: 6px 0 0 6px;
}

:deep(.gender-radio .ant-radio-button-wrapper:last-child) {
  border-radius: 0 6px 6px 0;
}

/* Action buttons */
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.btn-cancel,
.btn-submit {
  border-radius: 6px;
}

.btn-submit {
  font-weight: 500;
  min-width: 120px;
}

@media (max-width: 480px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
