import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ApiClientError } from '@/lib/api/client';
import { getProductBySlug } from '@/features/products/api/queries';
import { WishlistButton } from '@/features/wishlist/components/WishlistButton';
import { ProductVariantPicker } from '@/features/products/components/ProductVariantPicker';
import { ProductGallery } from '@/features/products/components/ProductGallery';
import { Separator } from '@/components/ui/separator';
import type { Product } from '@/features/products/types';

/**
 * STANDARDS.md #4: revalidate:600. `metaTitle`/`metaDescription` ve
 * `viewCount` crawler için server'da render edilmeli — bu yüzden ISR,
 * CSR değil. Interaktif kısım (galeri, wishlist kalp butonu, varyant/sepet)
 * ayrı Client Component'ler (ProductGallery, WishlistButton, ProductVariantPicker).
 *
 * NOT: schema.prisma'daki Product.viewCount SADECE
 * GET /products/slug/:locale/:slug controller metodundan artırılır — bu,
 * bu sayfanın her ISR revalidate'inde backend tarafında bir kez artar,
 * findOne() gibi iç çağrılardan artmaz (bkz. şemadaki not).
 */

export const revalidate = 600;

function translationFor(product: Product, locale: string) {
  return product.translations.find((t) => t.locale === locale) ?? product.translations[0];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const product = await getProductBySlug(locale, slug);
    const translation = translationFor(product, locale);
    return {
      title: translation?.metaTitle,
      description: translation?.metaDescription,
    };
  } catch {
    return {};
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  let product: Product;
  try {
    product = await getProductBySlug(locale, slug);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) notFound();
    throw err;
  }

  const translation = translationFor(product, locale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-10 md:grid-cols-2">
        {/* GALLERY */}
        <ProductGallery images={product.images} alt={translation?.name ?? ''} />

        {/* INFO */}
        <div className="flex flex-col">
          {product.category?.name && (
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              {product.category.name}
            </p>
          )}

          <div className="mt-1 flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              {translation?.name}
            </h1>
            <WishlistButton productId={product.id} />
          </div>

          {translation?.description && (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {translation.description}
            </p>
          )}

          <Separator className="my-6" />

          {/* Fiyat/stok/SKU artık ürün seviyesinde değil — her variant'ta ayrı
              (schema.prisma notu: "SKU/fiyat/stok artık burada, ürün seviyesinde değil").
              Bu yüzden "sepete ekle" bir variant seçimi gerektiriyor. */}
          <ProductVariantPicker variants={product.variants} />
        </div>
      </div>
    </div>
  );
}