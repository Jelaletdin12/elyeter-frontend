import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAuthorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { queryKeys, dataCacheTags } from '@/lib/api/query-keys';
import type {
  CreateProductInput,
  UpdateProductInput,
  CreateProductVariantInput,
  StockAdjustmentInput,
  Product,
  ProductVariant,
} from '../types';

/**
 * FRONTEND_AGENTS.md #7 — DUAL INVALIDATION, en sık atlanan / en pahalıya
 * patlayan hata. Admin panelden yapılan HER mutation şu iki adımı da yapar:
 *
 *   1) invalidateQueries  → admin'in kendi TanStack listesi (CSR)
 *   2) POST /api/revalidate → public sayfanın Next Data Cache tag'i (ISR)
 *
 * Sadece (1) yapılırsa: admin'de değişiklik görünür ama public ürün detay
 * sayfası `revalidate:600` süresi dolana kadar (10dk) eski fiyat/stok
 * gösterir.
 */

async function revalidatePublicTags(tags: string[]) {
  await fetch('/api/revalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags }),
  });
}

/** Ürünün TÜM dillerdeki slug'larını revalidate eder — hangi dilde düzenlendiği önemli değil. */
function productTags(product: Product): string[] {
  return product.translations.map((t) => dataCacheTags.product(t.locale, t.slug));
}

export function useCreateProductMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) =>
      adminAuthorizedFetch<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts.all(storeId) });
      await revalidatePublicTags([dataCacheTags.products(), dataCacheTags.home()]);
    },
  });
}

export function useUpdateProductMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, input }: { productId: string; input: UpdateProductInput }) =>
      adminAuthorizedFetch<Product>(`/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: async (updatedProduct) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts.all(storeId) }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.adminProducts.detail(storeId, updatedProduct.id),
        }),
      ]);
      await revalidatePublicTags([...productTags(updatedProduct), dataCacheTags.products()]);
    },
  });
}

export function useDeleteProductMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      adminAuthorizedFetch<void>(`/products/${productId}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts.all(storeId) });
      await revalidatePublicTags([dataCacheTags.products(), dataCacheTags.home()]);
    },
  });
}

/**
 * ✅ Doğrulandı (curl, 2026-09-08): POST /products/{id}/variants
 * body: CreateProductVariantDto. Yeni varyant eklemek ürünün price/stock'unu
 * değiştirebileceği için hem admin'in ürün detayı hem public ürün detayı
 * invalidate edilir.
 */
export function useAddVariantMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, input }: { productId: string; input: CreateProductVariantInput }) =>
      adminAuthorizedFetch<ProductVariant>(`/products/${productId}/variants`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async (_variant, { productId }) => {
      const product = queryClient.getQueryData<Product>(queryKeys.adminProducts.detail(storeId, productId));
      await queryClient.invalidateQueries({
        queryKey: queryKeys.adminProducts.detail(storeId, productId),
      });
      await revalidatePublicTags(
        product ? [...productTags(product), dataCacheTags.products()] : [dataCacheTags.products()],
      );
    },
  });
}

/**
 * ✅ Doğrulandı (curl, 2026-09-08): POST /products/{id}/variants/{variantId}/stock
 * body: StockAdjustmentDto { type, quantity, reason }.
 */
export function useStockAdjustmentMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      variantId,
      input,
    }: {
      productId: string;
      variantId: string;
      input: StockAdjustmentInput;
    }) =>
      adminAuthorizedFetch<ProductVariant>(`/products/${productId}/variants/${variantId}/stock`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async (_variant, { productId, variantId }) => {
      const product = queryClient.getQueryData<Product>(queryKeys.adminProducts.detail(storeId, productId));
      await queryClient.invalidateQueries({
        queryKey: queryKeys.adminProducts.detail(storeId, productId),
      });
      // Stok hareketi geçmişi de değişti — o query'yi de invalidate et.
      await queryClient.invalidateQueries({
        queryKey: [...queryKeys.adminProducts.detail(storeId, productId), 'stock-movements', variantId],
      });
      await revalidatePublicTags(
        product ? [...productTags(product), dataCacheTags.products()] : [dataCacheTags.products()],
      );
    },
  });
}

/** ✅ Doğrulandı: DELETE /products/{productId}/images/{imageId}. */
export function useDeleteProductImageMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, imageId }: { productId: string; imageId: string }) =>
      adminAuthorizedFetch<void>(`/products/${productId}/images/${imageId}`, { method: 'DELETE' }),
    onSuccess: async (_data, { productId }) => {
      const product = queryClient.getQueryData<Product>(queryKeys.adminProducts.detail(storeId, productId));
      await queryClient.invalidateQueries({
        queryKey: queryKeys.adminProducts.detail(storeId, productId),
      });
      await revalidatePublicTags(
        product ? [...productTags(product), dataCacheTags.products()] : [dataCacheTags.products()],
      );
    },
  });
}
