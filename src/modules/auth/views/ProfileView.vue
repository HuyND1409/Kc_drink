<template>
  <div class="profile-container">
    <a-card class="profile-card" :bordered="false">
      <template #title>
        <div class="card-title">
          <UserOutlined class="title-icon" />
          <span>Thông tin cá nhân</span>
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

            <a-col :span="12">
              <a-form-item label="Số điện thoại (Tên đăng nhập)">
                <a-input size="large" v-model:value="form.sdt" disabled placeholder="Không có số điện thoại" />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Địa chỉ Email">
                <a-input size="large" v-model:value="form.email" placeholder="Nhập địa chỉ email..." />
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Giới tính">
                <a-radio-group v-model:value="form.gioiTinh">
                  <a-radio :value="true">Nam</a-radio>
                  <a-radio :value="false">Nữ</a-radio>
                </a-radio-group>
              </a-form-item>
            </a-col>

            <a-col :span="12">
              <a-form-item label="Ngày sinh">
                <a-date-picker size="large" v-model:value="form.ngaySinh" style="width:100%" format="DD/MM/YYYY" placeholder="Chọn ngày sinh..." />
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

// ĐÃ THÊM: Import store quản lý trạng thái đăng nhập của nhóm bạn
import { useAuthStore } from "@/modules/auth/store/authStore";

const router = useRouter();
const auth = useAuthStore(); // Khởi tạo biến auth từ store

const pageLoading = ref(false);
const submitLoading = ref(false);

const form = reactive({
  tenKhachHang: "",
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
      form.sdt = userData.username || "";
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
    form.sdt = auth.user.username || "";
    form.email = auth.user.email || "";
    form.gioiTinh = true; // Mặc định do MeResponse của nhóm chưa có trường này
    form.ngaySinh = null;
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
      ngaySinh: form.ngaySinh ? dayjs(form.ngaySinh).format("YYYY-MM-DD") : null
    };

    await api.put("/auth/update-profile", submitData);
    message.success("Cập nhật thông tin cá nhân thành công!");

    // Cập nhật lại thông tin hiển thị trên HeaderBar ngay lập tức mà không cần F5
    if (auth.user) {
      auth.user.tenNguoiDung = form.tenKhachHang;
      auth.user.email = form.email;
    }

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
  align-items: center;
  padding: 40px 20px;
}

.profile-card {
  width: 100%;
  max-width: 600px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  background: #ffffff;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #1f1f1f;
}

.title-icon {
  color: #1677ff;
  font-size: 22px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.btn-cancel, .btn-submit {
  border-radius: 6px;
}
</style>
