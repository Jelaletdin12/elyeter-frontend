import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authorizedFetch } from '@/lib/auth/authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';

/**
 * Wishlist tamamen private/kişisel veri — Next Data Cache'e hiç girmez, bu
 * yüzden burada dual invalidation YOK (STANDARDS.md #6 sadece public
 * sayfası ISR olan admin mutation'ları için geçerli).
 */
export function useToggleWishlistMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, isWishlisted }: { productId: string; isWishlisted: boolean }) =>
      isWishlisted
        ? authorizedFetch<void>(`/wishlist/${productId}`, { method: 'DELETE' })
        : authorizedFetch<void>(`/wishlist/${productId}`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.current(storeId) });
    },
  });
}
