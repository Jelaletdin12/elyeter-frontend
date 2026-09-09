import { queryOptions } from '@tanstack/react-query';
import { authorizedFetch } from '@/lib/auth/authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';

export type WishlistItem = { productId: string };

export function wishlistOptions(storeId: string) {
  return queryOptions({
    queryKey: queryKeys.wishlist.current(storeId),
    queryFn: () => authorizedFetch<WishlistItem[]>('/wishlist'),
    staleTime: 5 * 60 * 1000,
  });
}
