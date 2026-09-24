import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ApiClientError } from '@/lib/api/client';
import { getProductBySlug } from '@/features/products/api/queries';
import { getSimilarProducts } from '@/features/recommendations/api/queries';
import { brandTranslation } from '@/features/brands/types';

import { WishlistButton } from '@/features/wishlist/components/WishlistButton';
import { ProductVariantPicker } from '@/features/products/components/ProductVariantPicker';
import { ProductGallery } from '@/features/products/components/ProductGallery';
import { ProductGrid } from '@/features/home/components/ProductGrid';

import { Separator } from '@/components/ui/separator';

import type { Product } from '@/features/products/types';

export const revalidate = 600;

function translationFor(
  product: Product,
  locale: string,
) {
  return (
    product.translations.find(
      (translation) => translation.locale === locale,
    ) ?? product.translations[0]
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  try {
    const product = await getProductBySlug(locale, slug);
    const translation = translationFor(product, locale);

    return {
      title: translation?.metaTitle ?? translation?.name,
      description: translation?.metaDescription,
    };
  } catch {
    return {};
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}) {
  const { locale, slug } = await params;

  let product: Product;

  try {
    product = await getProductBySlug(locale, slug);
  } catch (error) {
    if (
      error instanceof ApiClientError &&
      error.status === 404
    ) {
      notFound();
    }

    throw error;
  }

  const translation = translationFor(product, locale);

  const related = await getSimilarProducts(
    product.id,
    8,
  ).catch(() => []);

  const t = await getTranslations('products');

  const brandName =
    product.brand &&
    brandTranslation(product.brand, locale)?.name;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8">
      {/* PRODUCT */}
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] lg:gap-14">
        {/* LEFT - GALLERY */}
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <ProductGallery
            images={product.images}
            alt={translation?.name ?? ''}
          />
        </div>

        {/* RIGHT - INFO */}
        <div className="min-w-0">
          <div className="flex flex-col">
            {/* CATEGORY */}
            {product.category?.name && (
              <div className="mb-3">
                <span className="inline-flex rounded-full border bg-muted/40 px-3 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground">
                  {product.category.name}
                </span>
              </div>
            )}

            {/* TITLE + WISHLIST */}
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  {translation?.name}
                </h1>

                {brandName && (
                  <p className="text-muted-foreground mt-2 text-sm">
                    {brandName}
                  </p>
                )}
              </div>

              <WishlistButton productId={product.id} />
            </div>

            {/* DESCRIPTION */}
            {translation?.description && (
              <>
                <Separator className="my-6" />

                <p className="text-muted-foreground text-sm leading-7">
                  {translation.description}
                </p>
              </>
            )}

            {/* VARIANT / PURCHASE */}
            <div className="mt-7">
              <ProductVariantPicker
                variants={product.variants}
              />
            </div>
          </div>
        </div>
      </section>

      {/* RELATED PRODUCTS */}
      {related.length > 0 && (
        <section className="mt-16 border-t pt-12 sm:mt-24 sm:pt-16">
          <ProductGrid
            products={related}
            locale={locale}
            title={t('similarProducts')}
          />
        </section>
      )}
    </main>
  );
}