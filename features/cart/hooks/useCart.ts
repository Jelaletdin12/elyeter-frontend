'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { cartOptions, type CartDto, type CartItemDto } from '../api/queries';
import {
  useAddCartItemMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} from '../api/mutations';
import { useCallback } from 'react';

/**
 * Merkezi useCart hook'u:
 * - Sepet verisini TanStack Query cache'inden çeker ve tek noktadan türetilmiş
 *   değerleri (itemCount, subtotal, cartItems) sağlar.
 * - staleTime (2 dk) ve refetchOnWindowFocus (false) sayesinde gereksiz GET
 *   isteklerini engeller.
 * - Mutasyonlar `queryClient.setQueryData` kullanarak doğrudan cache'i günceller,
 *   böylece her ekleme/güncelleme/silme sonrası ekstra GET /cart atılmaz.
 */
export function useCart() {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrating = useAuthStore((s) => s.isHydrating);

  const {
    data: cart,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    ...cartOptions(storeId),
    enabled: isAuthenticated && !isHydrating,
  });

  const items = cart?.items ?? [];
  const itemCount = cart?.itemCount ?? items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart?.subtotal ?? '0.00';

  const getItem = useCallback(
    (productVariantId: string) => items.find((item) => item.productVariantId === productVariantId),
    [items],
  );

  const getItemQuantity = (productVariantId: string): number => {
    return getItem(productVariantId)?.quantity ?? 0;
  };

  const addMutation = useAddCartItemMutation(storeId);
  const updateMutation = useUpdateCartItemMutation(storeId);
  const removeMutation = useRemoveCartItemMutation(storeId);
  const clearMutation = useClearCartMutation(storeId);

  return {
    cart,
    items,
    itemCount,
    subtotal,
    isLoading: isHydrating || isLoading,
    isFetching,
    error,
    refetch,
    getItem,
    getItemQuantity,
    addMutation,
    updateMutation,
    removeMutation,
    clearMutation,
    storeId,
    isAuthenticated,
  };
}
