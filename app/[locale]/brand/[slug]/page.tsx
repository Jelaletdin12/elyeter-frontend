import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ApiClientError, apiFetch } from '@/lib/api/client';
import { dataCacheTags } from '@/lib/api/query-keys';
import { getBrandBySlug } from '@/features/brands/api/queries';
import { brandTranslation } from '@/features/brands/types';
import { ProductBrowser } from '@/features/products/components/ProductBrowser';
import type { ProductListResponse } from '@/features/products/types';

/**
 * MARKA DETAYI — GET /brands/slug/:locale/:slug (public besleme) + bu markanın
 * ürünleri GET /products?brandId=<id> (İş #1: brandId filtresi curl ile
 * doğrulandı, 2026-09-17). STANDARDS.md #4: ISR, tags:['brand','brands','products'].
 * 2026-09-18: ProductBrowser filtresi — arama yalnızca BU markada arama yapar
 * (backend findAll'da brandId + search aynı where'da birleşir).
 */
async function getBrandProducts(brandId: string, locale: string): Promise<ProductListResponse> {
  return apiFetch<ProductListResponse>(`/products?locale=${locale}&brandId=${brandId}&limit=12`, {
    next: { revalidate: 300, tags: [dataCacheTags.products()] },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const brand = await getBrandBySlug(locale, slug);
    const translation = brandTranslation(brand, locale);
    return {
      title: translation?.metaTitle,
      description: translation?.metaDescription,
    };
  } catch {
    return {};
  }
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  let brand: Awaited<ReturnType<typeof getBrandBySlug>>;
  try {
    brand = await getBrandBySlug(locale, slug);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) notFound();
    throw err;
  }

  const translation = brandTranslation(brand, locale);
  // Marka ürünleri başarısız olursa ürün bölümünü gizle, sayfayı bozma.
  const productList = await getBrandProducts(brand.id, locale).catch(() => null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-center gap-4">
        {brand.logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={brand.logoUrl} alt="" className="size-16 shrink-0 rounded-xl object-contain" />
        ) : null}
        <div>
          <h1 className="text-foreground font-serif text-2xl italic">{translation?.name ?? '—'}</h1>
          {productList && (
            <p className="text-muted-foreground mt-1 text-sm">{productList.meta.total} products</p>
          )}
        </div>
      </div>

      {productList ? (
        <ProductBrowser brandId={brand.id} initialProductList={productList} locale={locale} />
      ) : null}
    </div>
  );
}
