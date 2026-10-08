import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ApiClientError, apiFetch } from '@/lib/api/client';
import { dataCacheTags } from '@/lib/api/query-keys';
import { getBrandBySlug } from '@/features/brands/api/queries';
import { brandTranslation } from '@/features/brands/types';
import { ProductBrowser } from '@/features/products/components/ProductBrowser';
import type { ProductListResponse } from '@/features/products/types';
import Image from 'next/image';

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
  const productList = await getBrandProducts(brand.id, locale).catch(() => null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-center gap-4">
        {brand.logoUrl ? (
          <Image
            src={brand.logoUrl}
            alt={translation?.name ?? ''}
            width={64}
            height={64}
            className="size-16 shrink-0 rounded-xl object-contain"
          />
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
