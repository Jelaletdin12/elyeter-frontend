import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authorizedFetch } from '@/lib/auth/authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';
import type { ProductVariant } from '@/features/products/types';

/**
 * docs-json.json: POST /api/v1/cart/items, body: AddCartItemDto
 * { productVariantId: string; quantity: number }
 */
export function useAddCartItemMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productVariantId, quantity }: { productVariantId: string; quantity: number }) =>
      authorizedFetch<void>('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productVariantId, quantity }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart.current(storeId) }),
  });
}

/** PATCH /api/v1/cart/items/{id}, body: UpdateCartItemDto { quantity } — üzerine yazar, eklemez. */
export function useUpdateCartItemMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) =>
      authorizedFetch<void>(`/cart/items/${cartItemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart.current(storeId) }),
  });
}

export function useRemoveCartItemMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cartItemId: string) =>
      authorizedFetch<void>(`/cart/items/${cartItemId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart.current(storeId) }),
  });
}

/** DELETE /api/v1/cart — sepeti tamamen boşaltır. */
export function useClearCartMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authorizedFetch<void>('/cart', { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart.current(storeId) }),
  });
}

/**
 * docs-json.json: POST /api/v1/cart/checkout, body: CheckoutDto.
 * ÖNEMLİ: checkout endpoint'i /orders/checkout DEĞİL /cart/checkout — sepeti
 * temizleyip mevcut sepet içeriğinden sipariş oluşturuyor (items body'de
 * gönderilmiyor, backend zaten kullanıcının sepetini biliyor).
 * POST /orders ayrı bir endpoint — items'ı elle belirterek doğrudan sipariş
 * oluşturmak için (muhtemelen admin'in manuel sipariş girişi senaryosu).
 */
export type CheckoutInput = {
  paymentMethod: 'CASH' | 'CARD';
  fulfillmentType: 'DELIVERY' | 'PICKUP';
  couponCode?: string;
  savedAddressId?: string;
  recipientName?: string;
  recipientPhone?: string;
  shippingAddress?: string;
};

export type OrderItemDto = {
  id: string;
  orderId: string;
  productVariantId: string;
  quantity: number;
  price: string;
  productVariant: ProductVariant;
};

export type OrderDto = {
  id: string;
  clientId: string;
  status: string;
  total: string;
  paymentMethod: string;
  fulfillmentType: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDto[];
};

export function useCheckoutMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CheckoutInput) =>
      authorizedFetch<OrderDto>('/cart/checkout', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.current(storeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all(storeId) });
    },
  });
}
