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

  openCartDrawer: () => set({ isCartDrawerOpen: true }),
  closeCartDrawer: () => set({ isCartDrawerOpen: false }),
  toggleFilterPanel: () => set((s) => ({ isFilterPanelOpen: !s.isFilterPanelOpen })),
  setCheckoutStep: (checkoutStep) => set({ checkoutStep }),
  resetCheckout: () => set({ checkoutStep: 'shipping' }),
}));
