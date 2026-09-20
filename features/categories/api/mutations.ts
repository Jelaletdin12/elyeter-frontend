import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAuthorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { queryKeys, dataCacheTags } from '@/lib/api/query-keys';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../types';

/**
 * FRONTEND_AGENTS.md #7 — dual invalidation, features/products/api/mutations.ts
 * ile AYNI pattern. Kategori adı/slug değiştiğinde hem admin'in kendi listesi
 * hem public kategori sayfası (ve o kategorideki ürün listesi, çünkü ürün
 * kartlarında kategori adı görünebilir) revalidate edilir.
 */

async function revalidatePublicTags(tags: string[]) {
  await fetch('/api/revalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags }),
  });
}

export function useCreateCategoryMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCategoryInput) =>
      adminAuthorizedFetch<Category>('/categories', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminCategories.all(storeId) });
      await revalidatePublicTags([dataCacheTags.categories(), dataCacheTags.home()]);
    },
  });
}

export function useUpdateCategoryMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, input }: { categoryId: string; input: UpdateCategoryInput }) =>
      adminAuthorizedFetch<Category>(`/categories/${categoryId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: async (updatedCategory) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminCategories.all(storeId) });
      // Kategorinin TÜM dillerdeki slug'ları revalidate edilir — hangi dilde
      // düzenlendiği önceden bilinmiyor (liste sayfasından herhangi bir satır
      // seçilebilir), response'taki translations array'inden türetiliyor.
      const tags = updatedCategory.translations.map((t) =>
        dataCacheTags.category(t.locale, t.slug),
      );
      await revalidatePublicTags([...tags, dataCacheTags.categories(), dataCacheTags.products()]);
    },
  });
}

export function useDeleteCategoryMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) =>
      adminAuthorizedFetch<void>(`/categories/${categoryId}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminCategories.all(storeId) });
      await revalidatePublicTags([dataCacheTags.categories(), dataCacheTags.home()]);
    },
  });
}
