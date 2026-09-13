import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAuthorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { authorizedFetch } from '@/lib/auth/authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';
import type {
  Coupon,
  CreateCouponInput,
  UpdateCouponInput,
  ValidateCouponInput,
  ValidateCouponResponse,
} from '../types';

/**
 * Coupon'lar public ISR sayfalarında GÖRÜNMEZ (sadece checkout — force-dynamic
 * CSR) — o yüzden FRONTEND_AGENTS.md #7 dual invalidation'ın revalidate yarısı
 * burada YOK. Sadece TanStack cache'i invalidate edilir (admin listesi +
 * scope listeleri; `adminCoupons.all` prefix'i hepsini kapsar).
 */

/**
 * POST /coupons/validate — checkout'ta kupon uygulama. MÜŞTERİ tarafı
 * (authorizedFetch, kullanıcının oturumu), adminAuthorizedFetch DEĞİL.
 * items boş bırakılırsa backend kullanıcının güncel sepetini kullanır.
 */
export function useValidateCouponMutation() {
  return useMutation({
    mutationFn: (input: ValidateCouponInput) =>
      authorizedFetch<ValidateCouponResponse>('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

export function useCreateCouponMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCouponInput) =>
      adminAuthorizedFetch<Coupon>('/coupons', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCoupons.all(storeId) }),
  });
}

export function useUpdateCouponMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ couponId, input }: { couponId: string; input: UpdateCouponInput }) =>
      adminAuthorizedFetch<Coupon>(`/coupons/${couponId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCoupons.all(storeId) }),
  });
}

export function useDeleteCouponMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (couponId: string) =>
      adminAuthorizedFetch<void>(`/coupons/${couponId}`, { method: 'DELETE' }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCoupons.all(storeId) }),
  });
}

/** POST /coupons/{couponId}/products/{productId} — ürünü kupon kapsamına ekler. */
export function useAttachCouponProductMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ couponId, productId }: { couponId: string; productId: string }) =>
      adminAuthorizedFetch<Coupon>(`/coupons/${couponId}/products/${productId}`, {
        method: 'POST',
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCoupons.all(storeId) }),
  });
}

/** DELETE /coupons/{couponId}/products/{productId} — ürünü kapsamdan çıkarır. */
export function useDetachCouponProductMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ couponId, productId }: { couponId: string; productId: string }) =>
      adminAuthorizedFetch<Coupon>(`/coupons/${couponId}/products/${productId}`, {
        method: 'DELETE',
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCoupons.all(storeId) }),
  });
}

/** POST /coupons/{couponId}/categories/{categoryId} — kategoriyi kapsama ekler. */
export function useAttachCouponCategoryMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ couponId, categoryId }: { couponId: string; categoryId: string }) =>
      adminAuthorizedFetch<Coupon>(`/coupons/${couponId}/categories/${categoryId}`, {
        method: 'POST',
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCoupons.all(storeId) }),
  });
}

/** DELETE /coupons/{couponId}/categories/{categoryId} — kategoriyi kapsamdan çıkarır. */
export function useDetachCouponCategoryMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ couponId, categoryId }: { couponId: string; categoryId: string }) =>
      adminAuthorizedFetch<Coupon>(`/coupons/${couponId}/categories/${categoryId}`, {
        method: 'DELETE',
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCoupons.all(storeId) }),
  });
}
