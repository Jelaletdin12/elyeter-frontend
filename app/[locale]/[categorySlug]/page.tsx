import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { apiFetch, ApiClientError } from '@/lib/api/client';
import { dataCacheTags } from '@/lib/api/query-keys';
import type { ProductListResponse } from '@/features/products/types';
import { getCategoryBySlug } from '@/features/categories/api/queries';
import { categoryTranslation } from '@/features/categories/types';
import { ProductBrowser } from '@/features/products/components/ProductBrowser';

/**
 * STANDARDS.md #4: ISR (temel liste) + filtreler client'ta.
 * `generateStaticParams` KULLANILMAZ (STANDARDS.md #11) — katalog büyüdükçe
 * build süresi patlar; slug'lar `dynamicParams: true` ile ilk istekte
 * ISR'a girer (Next.js varsayılanı zaten budur, elle kapatılmaz).
 *
 * Alt kategori şeridi: findBySlug artık aktif children'ı döner
 * (backend categories.service.ts, 2026-09-14) — tek istek, ayrı query yok.
 * Filtre kategori ağacı için GET /categories/tree'den gelen tüm aktif
 * kategorileri kullanır.
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
  // Bu, temel/varsayılan sıralamayla ISR'lanan listedir. Kullanıcı arama/marka
  // filtresi değiştirdiğinde ProductBrowser (Client Component) kendi TanStack
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
    <div className="mx-auto max-w-7xl px-4 py-8">
      {category.imageUrl ? (
        <div className="relative mb-6 aspect-[21/9] w-full overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={category.imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}

      <h1 className="text-foreground font-serif text-2xl italic">{translation?.name}</h1>

      {category.children && category.children.length > 0 && (
        <nav className="mt-3 flex flex-wrap gap-2" aria-label="Subcategories">
          {category.children.map((child) => {
            const childTranslation = categoryTranslation(child, locale);
            if (!childTranslation) return null;
            return (
              <Link
                key={child.id}
                href={`/${locale}/${childTranslation.slug}`}
                className="border-input text-muted-foreground hover:border-ring hover:text-foreground rounded-full border px-3 py-1 text-sm transition-colors"
              >
                {childTranslation.name}
              </Link>
            );
          })}
        </nav>
      )}

      <ProductBrowser
        categoryId={category.id}
        initialProductList={initialProductList}
        locale={locale}
      />
    </div>
  );
}
