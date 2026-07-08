import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/modules/auth/store/authStore";

// === LAYOUTS ===
import UserLayout from "@/layouts/UserLayout.vue"; // Layout cho khách hàng
import AppLayout from "@/layouts/AppLayout.vue";   // Layout cho Admin/Staff

// === AUTH VIEWS ===
import LoginView from "@/modules/auth/views/LoginView.vue";
import ForgotPasswordView from "@/modules/auth/views/ForgotPasswordView.vue";
import RegisterView from "@/modules/auth/views/RegisterView.vue";

// === BUSINESS VIEWS ===
import ShopView from "@/modules/khach-hang/views/ShopView.vue";
import DashboardView from "@/modules/dashboard/views/DashboardView.vue";
import NhanVienListView from "@/modules/nhan-vien/views/NhanVienListView.vue";
import KhachHangListView from "@/modules/khach-hang/views/KhachHangListView.vue";
import VoucherListView from "@/modules/voucher/views/VoucherListView.vue";
// 👇 THÊM IMPORT MODULE NGUYÊN LIỆU Ở ĐÂY 👇
import NguyenLieuListView from "@/modules/nguyen-lieu/views/NguyenLieuListView.vue";
// 👇 THÊM IMPORT MODULE TOPPING Ở ĐÂY 👇
import ToppingListView from "@/modules/topping/views/ToppingListView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // --- Các trang công cộng (Public) ---
    { path: "/login", component: LoginView },
    { path: "/forgot-password", component: ForgotPasswordView },
    { path: "/register", component: RegisterView },

    // --- Các trang dùng chung sau khi đăng nhập ---
    { path: "/change-password", component: () => import("@/modules/auth/views/ChangePasswordView.vue") },
    { path: "/profile", component: () => import("@/modules/auth/views/ProfileView.vue") },

    // --- Phân hệ Khách hàng (USER) ---
    {
      path: "/shop",
      component: UserLayout,
      children: [{ path: "", component: ShopView }]
    },

    // --- Phân hệ Quản trị (ADMIN / STAFF) ---
    {
      path: "/",
      component: AppLayout,
      children: [
        { path: "", component: DashboardView },
        { path: "nhan-vien", component: NhanVienListView },
        { path: "khach-hang", component: KhachHangListView },
        { path: "voucher", component: VoucherListView },
        // 👇 THÊM ROUTE NGUYÊN LIỆU VÀO TRONG APPLAYOUT 👇
        { path: "nguyen-lieu", component: NguyenLieuListView },
        // 👇 THÊM ROUTE TOPPING VÀO TRONG APPLAYOUT 👇
        { path: "topping", component: ToppingListView },
      ],
    },
  ],
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();

  const publicPages = ['/login', '/forgot-password', '/register'];
  const authRequired = !publicPages.includes(to.path);
  const isAuthenticated = !!auth.token;

  // 1. Nếu chưa đăng nhập mà cố vào trang bảo mật -> đẩy về login
  if (authRequired && !isAuthenticated) {
    return next("/login");
  }

  // 2. Nếu đã đăng nhập mà bấm vào các form login/register/quên pass -> điều hướng về trang chủ tương ứng
  if (isAuthenticated && publicPages.includes(to.path)) {
    return next(auth.user?.role === 'USER' ? '/shop' : '/');
  }

  // 3. Phân quyền truy cập dựa trên Role hệ thống
  if (isAuthenticated) {
    const role = auth.user?.role;

    // Khách hàng (USER): Chỉ được phép vào danh sách trang được chỉ định (Shop, Đổi pass, Profile)
    const allowedUserPaths = ['/shop', '/change-password', '/profile'];
    if (role === 'USER' && !allowedUserPaths.includes(to.path)) {
      return next('/shop');
    }

    // Quản trị viên/Nhân viên: Không được phép truy cập vào khu vực mua sắm công cộng của khách (/shop)
    if ((role === 'ADMIN' || role === 'STAFF') && to.path.startsWith('/shop')) {
      return next('/');
    }
  }

  next();
});

export default router;
