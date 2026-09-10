import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/modules/auth/store/authStore";

// === LAYOUTS ===
import UserLayout from "@/layouts/UserLayout.vue"; // Layout cho khách hàng
import AppLayout from "@/layouts/AppLayout.vue"; // Layout cho Admin/Staff

// === AUTH VIEWS ===
import LoginView from "@/modules/auth/views/LoginView.vue";
import ForgotPasswordView from "@/modules/auth/views/ForgotPasswordView.vue";
import RegisterView from "@/modules/auth/views/RegisterView.vue";

// === BUSINESS VIEWS ===
import ShopView from "@/modules/khach-hang/views/ShopView.vue";
import ShopLoginView from "@/modules/ban-hang-online/views/ShopLoginView.vue";
import DashboardView from "@/modules/dashboard/views/DashboardView.vue";
import NhanVienListView from "@/modules/nhan-vien/views/NhanVienListView.vue";
import KhachHangListView from "@/modules/khach-hang/views/KhachHangListView.vue";
import VoucherListView from "@/modules/voucher/views/VoucherListView.vue";
// 👇 THÊM IMPORT MODULE NGUYÊN LIỆU Ở ĐÂY 👇
import NguyenLieuListView from "@/modules/nguyen-lieu/views/NguyenLieuListView.vue";
// 👇 THÊM IMPORT MODULE TOPPING Ở ĐÂY 👇
import ToppingListView from "@/modules/topping/views/ToppingListView.vue";
import PayOSDemoView from "@/modules/payos/views/PayOSDemoView.vue";
// 👇 THÊM IMPORT MODULE SẢN PHẨM Ở ĐÂY 👇
import SanPhamListView from "@/modules/san-pham/views/SanPhamListView.vue";
// 👇 THÊM IMPORT MODULE BÁN THÀNH PHẨM Ở ĐÂY 👇
import BanThanhPhamListView from "@/modules/ban-thanh-pham/views/BanThanhPhamListView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // --- Các trang công cộng (Public) ---
    { path: "/login", component: LoginView },
    { path: "/forgot-password", component: ForgotPasswordView },
    { path: "/register", component: RegisterView },

    // --- Các trang dùng chung sau khi đăng nhập ---
    {
      path: "/change-password",
      component: () =>
        import("@/modules/auth/views/ChangePasswordView.vue"),
    },
    {
      path: "/change-phone",
      component: () =>
        import("@/modules/auth/views/ChangePhoneView.vue"),
    },
    {
      path: "/profile",
      component: () => import("@/modules/auth/views/ProfileView.vue"),
    },

    // --- Phân hệ Khách hàng (USER) ---
    {
      path: "/shop",
      component: UserLayout,
      children: [
        { path: "", component: ShopView },
        { path: "login", component: ShopLoginView },
        { 
          path: "checkout", 
          component: () => import("@/modules/ban-hang-online/views/CheckoutOnlineView.vue") 
        },
        { 
          path: "payment/:idHoaDon", 
          component: () => import("@/modules/ban-hang-online/views/ThanhToanOnlineView.vue") 
        },
        { 
          path: "orders", 
          component: () => import("@/modules/ban-hang-online/views/DonHangCuaToiView.vue") 
        },
        { 
          path: "orders/:idHoaDon", 
          component: () => import("@/modules/ban-hang-online/views/ChiTietDonHangOnlineView.vue") 
        }
      ],
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
        {
          path: "khuyen-mai",
          component: () =>
            import("@/modules/khuyen-mai/views/KhuyenMaiListView.vue"),
        },

        // 👇 THÊM ROUTE NGUYÊN LIỆU VÀO TRONG APPLAYOUT 👇
        { path: "nguyen-lieu", component: NguyenLieuListView },

        // 👇 THÊM ROUTE TOPPING VÀO TRONG APPLAYOUT 👇
        { path: "topping", component: ToppingListView },

        // 👇 THÊM ROUTE SẢN PHẨM VÀO TRONG APPLAYOUT 👇
        { path: "san-pham", component: SanPhamListView },

        {
          path: "hoa-don",
          component: () =>
            import("@/modules/hoa-don/views/HoaDonListView.vue"),
        },

        // 👇 THÊM ROUTE BÁN THÀNH PHẨM VÀO TRONG APPLAYOUT 👇
        // ADMIN + STAFF đều được truy cập
        { path: "ban-thanh-pham", component: BanThanhPhamListView },

        // 👇 ROUTE TEST PHÍ VẬN CHUYỂN GHN 👇
        {
          path: "ghn-test",
          component: () =>
            import("@/modules/van_chuyen/views/GhnTestView.vue"),
        },

        // 👇 ROUTE PAYOS DEMO 👇
        { path: "payos-demo", component: PayOSDemoView },

        // 👇 ROUTE POS BÁN HÀNG TẠI QUẦY 👇
        {
          path: "pos",
          component: () => import("@/modules/pos/views/PosView.vue"),
        },

        {
          path: "pos/online-orders",
          name: "pos-online-orders",
          component: () => import("@/modules/pos/views/PosOnlineOrdersView.vue"),
        },

        // 👇 ROUTE NHẬT KÝ HỆ THỐNG (CHỈ ADMIN) 👇
        {
          path: "nhat-ky-he-thong",
          component: () =>
            import("@/modules/nhat-ky-he-thong/views/NhatKyListView.vue"),
        },
      ],
    },
  ],
});

// Các trang trong /shop yêu cầu đăng nhập (khách chưa đăng nhập bị chuyển sang /shop/login)
const shopAuthRequired = ["/shop/checkout", "/shop/payment", "/shop/orders"];

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();

  const publicPages = ["/login", "/forgot-password", "/register"];
  // /shop và /shop/login là public (khách chưa đăng nhập được vào)
  const shopPublicPaths = ["/shop", "/shop/login"];
  const isAuthenticated = !!auth.token;

  const isShopPublic = shopPublicPaths.includes(to.path);
  const isShopProtected = shopAuthRequired.some((p) => to.path.startsWith(p));
  const isPublicPage = publicPages.includes(to.path);

  // 1. Nếu chưa đăng nhập và cố vào checkout/payment/orders của shop -> /shop/login
  if (!isAuthenticated && isShopProtected) {
    return next("/shop/login");
  }

  // 2. Nếu chưa đăng nhập và không phải trang public hoặc shop-public -> /login
  if (!isAuthenticated && !isPublicPage && !isShopPublic) {
    return next("/login");
  }

  // 3. Đã đăng nhập vào các trang public thông thường -> điều hướng về trang chủ tương ứng
  if (isAuthenticated && isPublicPage) {
    return next(auth.user?.role === "USER" ? "/shop" : "/");
  }

  // 4. Đã đăng nhập vào /shop/login -> về đúng trang chủ (tránh vòng lặp)
  if (isAuthenticated && to.path === "/shop/login") {
    return next(auth.user?.role === "USER" ? "/shop" : "/");
  }

  // 5. Phân quyền truy cập dựa trên Role hệ thống
  if (isAuthenticated) {
    const role = auth.user?.role;

    // Khách hàng (USER): Chỉ được phép vào danh sách trang được chỉ định (Shop, Đổi pass, Profile)
    const allowedUserPaths = ["/profile", "/change-password", "/change-phone"];
    const isUserAllowed = to.path.startsWith("/shop") || allowedUserPaths.includes(to.path);
    if (role === "USER" && !isUserAllowed) {
      return next("/shop");
    }

    // Quản trị viên/Nhân viên: Không được phép truy cập vào khu vực mua sắm công cộng của khách (/shop)
    if (
      (role === "ADMIN" || role === "STAFF") &&
      to.path.startsWith("/shop")
    ) {
      return next("/");
    }

    // Nhân viên (STAFF): Không được phép truy cập vào trang Quản lý Nhân viên
    if (role === "STAFF" && to.path === "/nhan-vien") {
      return next("/");
    }

    // Nhân viên (STAFF): Không được phép truy cập vào trang Nhật ký hệ thống
    if (role === "STAFF" && to.path === "/nhat-ky-he-thong") {
      return next("/");
    }
  }

  next();
});

export default router;
