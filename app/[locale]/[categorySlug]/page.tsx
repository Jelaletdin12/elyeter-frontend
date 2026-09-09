import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { apiFetch, ApiClientError } from '@/lib/api/client';
import { dataCacheTags } from '@/lib/api/query-keys';
import type { ProductListResponse } from '@/features/products/types';
import { getCategoryBySlug } from '@/features/categories/api/queries';
import { categoryTranslation } from '@/features/categories/types';
import { CategoryFilters } from '@/features/products/components/CategoryFilters';

/**
 * STANDARDS.md #4: ISR (temel liste) + filtreler client'ta.
 * `generateStaticParams` KULLANILMAZ (STANDARDS.md #11) — katalog büyüdükçe
 * build süresi patlar; slug'lar `dynamicParams: true` ile ilk istekte
 * ISR'a girer (Next.js varsayılanı zaten budur, elle kapatılmaz).
 *
 * ✅ Category tipi artık features/categories/types.ts'te GERÇEK/doğrulanmış
 * response'a göre tanımlı (curl ile doğrulandı, 2026-09-07) — eski "tahmin"
 * tipi kaldırıldı.
 */

async function getCategory(locale: string, slug: string) {
  try {
    return await getCategoryBySlug(locale, slug);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) notFound();
    throw err;
  }
}

async function getBaseProductList(
  locale: string,
  categoryId: string,
): Promise<ProductListResponse> {
  // Bu, temel/varsayılan sıralamayla ISR'lanan listedir. Kullanıcı sıralama/
  // filtre değiştirdiğinde CategoryFilters (Client Component) kendi TanStack
  // query'siyle devralır — search param kombinasyonları Next Data Cache'e
  // GİRMEZ (aksi halde cache anlamsız şişer, bkz. STANDARDS.md #4).
  return apiFetch<ProductListResponse>(`/products?locale=${locale}&categoryId=${categoryId}`, {
    next: {
      revalidate: 300,
      tags: [dataCacheTags.products()],
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; categorySlug: string }>;
}): Promise<Metadata> {
  const { locale, categorySlug } = await params;
  try {
    const category = await getCategory(locale, categorySlug);
    const translation = categoryTranslation(category, locale);
    return { title: translation?.metaTitle, description: translation?.metaDescription };
  } catch {
    return {};
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; categorySlug: string }>;
}) {
  const { locale, categorySlug } = await params;
  const category = await getCategory(locale, categorySlug);
  const initialProductList = await getBaseProductList(locale, category.id);
  const translation = categoryTranslation(category, locale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-2xl italic text-ink">{translation?.name}</h1>
      <CategoryFilters categoryId={category.id} initialProductList={initialProductList} />
    </div>
  );
}
