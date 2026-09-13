import { create } from 'zustand';

/**
 * FRONTEND_STANDARDS.md #3: Zustand'a SADECE client-only UI state girer.
 * Burada "products: Product[]" gibi bir alan görülmesi mimari ihlaldir —
 * server'dan gelen her şey TanStack Query'de yaşar.
 */

type CheckoutStep = 'shipping' | 'payment' | 'review';

type UiState = {
  isCartDrawerOpen: boolean;
  isFilterPanelOpen: boolean;
  checkoutStep: CheckoutStep;

  /** AuthDialog — header'da değil store'da yaşar; account/checkout guard'ı
   *  (middleware ?auth=… yönlendirmesi) ve "Giriş yap" bağlantıları da açabilir. */
  authDialogOpen: boolean;
  authDialogTab: 'login' | 'register';
  /** Giriş başarılı olunca gidilecek hedef (middleware'in ?redirect= param'ı). */
  authRedirect: string | null;

  openAuthDialog: (tab: 'login' | 'register') => void;
  setAuthDialogOpen: (open: boolean) => void;
  setAuthRedirect: (path: string | null) => void;

  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  toggleFilterPanel: () => void;
  setCheckoutStep: (step: CheckoutStep) => void;
  resetCheckout: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  isCartDrawerOpen: false,
  isFilterPanelOpen: false,
  checkoutStep: 'shipping',

  authDialogOpen: false,
  authDialogTab: 'login',
  authRedirect: null,

  openAuthDialog: (authDialogTab) => set({ authDialogOpen: true, authDialogTab }),
  setAuthDialogOpen: (authDialogOpen) => set({ authDialogOpen }),
  setAuthRedirect: (authRedirect) => set({ authRedirect }),

  openCartDrawer: () => set({ isCartDrawerOpen: true }),
  closeCartDrawer: () => set({ isCartDrawerOpen: false }),
  toggleFilterPanel: () => set((s) => ({ isFilterPanelOpen: !s.isFilterPanelOpen })),
  setCheckoutStep: (checkoutStep) => set({ checkoutStep }),
  resetCheckout: () => set({ checkoutStep: 'shipping' }),
}));
