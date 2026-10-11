import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as productsApi from '../api/products';

const useStore = create(
  persist(
    (set, get) => ({
      // ─── Products ───────────────────────────────────────────
      products: [],
      loading: false,
      error: null,

      fetchProducts: async () => {
        set({ loading: true, error: null });
        try {
          const data = await productsApi.getProducts();
          set({ products: data, loading: false });
        } catch (err) {
          set({ error: err.message, loading: false });
        }
      },

      addProduct: async (payload) => {
        set({ loading: true, error: null });
        try {
          const newProduct = await productsApi.addProduct(payload);
          set((state) => ({
            products: [newProduct, ...state.products],
            loading: false,
          }));
          return newProduct;
        } catch (err) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      removeProduct: async (productId) => {
        try {
          await productsApi.deleteProduct(productId);
          set((state) => ({
            products: state.products.filter((p) => p.id !== productId),
          }));
        } catch (err) {
          set({ error: err.message });
          throw err;
        }
      },

      updateProduct: async (productId, payload) => {
        try {
          const updated = await productsApi.updateProduct(productId, payload);
          set((state) => ({
            products: state.products.map((p) =>
              p.id === productId ? { ...p, ...updated } : p
            ),
          }));
          return updated;
        } catch (err) {
          set({ error: err.message });
          throw err;
        }
      },

      // Called by WebSocket when price update arrives
      updateProductPrice: (productId, priceData) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  currentPrice: priceData.currentPrice,
                  previousPrice: priceData.previousPrice,
                  lastChecked: priceData.timestamp,
                  priceChange: priceData.priceChange,
                  priceChangePercent: priceData.priceChangePercent,
                }
              : p
          ),
        }));
      },

      // ─── Compare ────────────────────────────────────────────
      compareProducts: { a: null, b: null },
      compareResult: null,
      compareLoading: false,

      setCompareProduct: (slot, product) => {
        set((state) => ({
          compareProducts: { ...state.compareProducts, [slot]: product },
          compareResult: null,
        }));
      },

      runCompare: async (payload) => {
        set({ compareLoading: true });
        try {
          const result = await productsApi.compareProducts(payload);
          set({ compareResult: result, compareLoading: false });
          return result;
        } catch (err) {
          set({ error: err.message, compareLoading: false });
          throw err;
        }
      },

      clearCompare: () => {
        set({ compareProducts: { a: null, b: null }, compareResult: null });
      },

      // ─── Theme ──────────────────────────────────────────────
      theme: 'light',

      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { theme: newTheme };
        });
      },

      initTheme: () => {
        const { theme } = get();
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      // ─── Notifications ──────────────────────────────────────
      notifications: [],

      addNotification: (notification) => {
        const id = Date.now().toString();
        set((state) => ({
          notifications: [{ id, ...notification, read: false }, ...state.notifications],
        }));
        return id;
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      clearNotifications: () => set({ notifications: [] }),

      // ─── User ───────────────────────────────────────────────
      user: null,

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem('ph_token');
        set({ user: null, products: [], notifications: [] });
      },

      // ─── Price Drop Banner ──────────────────────────────────
      priceDrop: null,

      setPriceDrop: (drop) => set({ priceDrop: drop }),
      clearPriceDrop: () => set({ priceDrop: null }),
    }),
    {
      name: 'pricehawk-store',
      partialize: (state) => ({
        theme: state.theme,
        user: state.user,
        notifications: state.notifications.slice(0, 50),
      }),
    }
  )
);

export default useStore;
