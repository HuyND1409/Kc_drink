import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import type { GioHangOnlineItem } from "../types/banHangOnline";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { getChiTietSanPhamOnline } from "@/modules/ban-hang-online/api/banHangOnlineApi";

export const useGioHangOnlineStore = defineStore("gioHangOnline", () => {
  const items = ref<GioHangOnlineItem[]>([]);
  const authStore = useAuthStore();

  const getStorageKey = () => {
    const userId = authStore.user?.idTaiKhoan;
    if (userId) {
      return `kc-drink-online-cart-${userId}`;
    }
    return null;
  };

  const loadCartForCurrentUser = () => {
    const key = getStorageKey();
    if (key) {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          items.value = JSON.parse(stored);
        } catch (e) {
          console.error("Lỗi khi load giỏ hàng:", e);
          items.value = [];
        }
      } else {
        items.value = [];
      }
    } else {
      items.value = [];
    }
  };

  // Lắng nghe thay đổi của items để lưu vào localStorage
  watch(
    items,
    (newItems) => {
      const key = getStorageKey();
      if (key) {
        localStorage.setItem(key, JSON.stringify(newItems));
      }
    },
    { deep: true }
  );

  // Lắng nghe user đổi -> đổi giỏ hàng
  watch(
    () => authStore.user,
    () => {
      loadCartForCurrentUser();
    }
  );

  const totalQuantity = computed(() => {
    return items.value.reduce((total, item) => total + item.soLuong, 0);
  });

  const estimatedTotal = computed(() => {
    return items.value.reduce((total, item) => {
      const toppingTotal = item.toppings.reduce(
        (sum, t) => sum + t.giaTopping * t.soLuong,
        0
      );
      return total + item.giaSanPhamHienThi * item.soLuong + toppingTotal;
    }, 0);
  });

  const generateItemId = (
    idSanPham: number,
    idSize: number,
    mucDuong: number,
    mucDa: number,
    ghiChu: string,
    toppings: { idTopping: number; soLuong: number }[]
  ) => {
    const sortedToppings = [...toppings].sort((a, b) => a.idTopping - b.idTopping);
    return `${idSanPham}-${idSize}-${mucDuong}-${mucDa}-${ghiChu}-${JSON.stringify(sortedToppings)}`;
  };

  const generateItemIdFromItem = (item: GioHangOnlineItem) => {
    return generateItemId(
      item.idSanPham,
      item.idSize,
      item.mucDuong,
      item.mucDa,
      item.ghiChu?.trim() ?? "",
      item.toppings.map((t) => ({
        idTopping: t.idTopping,
        soLuong: t.soLuong,
      }))
    );
  };

  const mergeItemQuantities = (target: GioHangOnlineItem, source: GioHangOnlineItem | Omit<GioHangOnlineItem, "id">) => {
    target.soLuong += source.soLuong;
    
    // Overwrite snapshot prices from source (fresh)
    target.giaSanPhamHienThi = source.giaSanPhamHienThi;
    target.tenSanPham = source.tenSanPham;
    target.hinhAnh = source.hinhAnh;

    source.toppings.forEach(st => {
      const tt = target.toppings.find(t => t.idTopping === st.idTopping);
      if (tt) {
        tt.soLuong += st.soLuong;
        // Overwrite topping price
        tt.giaTopping = st.giaTopping;
        tt.tenTopping = st.tenTopping;
      } else {
        target.toppings.push({ ...st });
      }
    });
    target.id = generateItemIdFromItem(target);
  };

  const ensureUniqueItems = () => {
    let hasDuplicates = true;
    while (hasDuplicates) {
      hasDuplicates = false;
      for (let i = 0; i < items.value.length; i++) {
        for (let j = i + 1; j < items.value.length; j++) {
          const item1 = items.value[i];
          const item2 = items.value[j];
          if (item1 && item2 && item1.id === item2.id) {
            mergeItemQuantities(item1, item2);
            items.value.splice(j, 1);
            hasDuplicates = true;
            break;
          }
        }
        if (hasDuplicates) break;
      }
    }
  };

  const addItem = (newItem: Omit<GioHangOnlineItem, "id">) => {
    const toppingConfig = newItem.toppings.map((t) => ({
      idTopping: t.idTopping,
      soLuong: t.soLuong,
    }));

    const normalizedNote = newItem.ghiChu?.trim() ?? "";

    const configId = generateItemId(
      newItem.idSanPham,
      newItem.idSize,
      newItem.mucDuong,
      newItem.mucDa,
      normalizedNote,
      toppingConfig
    );

    items.value.push({
      ...newItem,
      ghiChu: normalizedNote,
      id: configId,
    });

    ensureUniqueItems();
  };

  const updateDrinkQuantity = (id: string, soLuongMoi: number) => {
    if (soLuongMoi < 1) return;
    const item = items.value.find((i) => i.id === id);
    if (item) {
      item.soLuong = soLuongMoi;
    }
  };

  const updateToppingQuantity = (itemId: string, toppingId: number, soLuongMoi: number) => {
    if (soLuongMoi < 1) return;
    
    const item = items.value.find((i) => i.id === itemId);
    if (!item) return;

    const topping = item.toppings.find((t) => t.idTopping === toppingId);
    if (!topping) return;

    topping.soLuong = soLuongMoi;
    
    item.id = generateItemIdFromItem(item);
    
    ensureUniqueItems();
  };

  const removeItem = (id: string) => {
    items.value = items.value.filter((item) => item.id !== id);
  };

  const clearCart = () => {
    items.value = [];
  };

  const refreshPrices = async () => {
    if (items.value.length === 0) return;
    const uniqueIds = Array.from(new Set(items.value.map(i => i.idSanPham)));
    try {
      const responses = await Promise.all(
        uniqueIds.map(id => getChiTietSanPhamOnline(id).then(res => res.data.data).catch(() => null))
      );
      
      items.value.forEach(item => {
        const detail = responses.find(d => d && d.sanPham.idSanPham === item.idSanPham);
        if (!detail) return;
        
        const basePrice = detail.sanPham.coKhuyenMai ? detail.sanPham.giaSauKhuyenMai : detail.sanPham.gia;
        const selectedSize = detail.sizes.find(s => s.idSize === item.idSize);
        const sizePrice = selectedSize ? selectedSize.phuThu : 0;
        
        item.giaSanPhamHienThi = basePrice + sizePrice;
        item.tenSanPham = detail.sanPham.tenSanPham;
        item.hinhAnh = detail.sanPham.hinhAnh;
        
        item.toppings.forEach(t => {
          const toppingDetail = detail.toppings.find(td => td.idTopping === t.idTopping);
          if (toppingDetail) {
            t.giaTopping = toppingDetail.giaTopping;
            t.tenTopping = toppingDetail.tenTopping;
          }
        });
      });
    } catch (e) {
      console.error("Lỗi khi refresh giá:", e);
    }
  };

  return {
    items,
    totalQuantity,
    estimatedTotal,
    loadCartForCurrentUser,
    addItem,
    updateDrinkQuantity,
    updateToppingQuantity,
    removeItem,
    clearCart,
    refreshPrices,
  };
});
