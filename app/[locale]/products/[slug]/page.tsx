import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ApiClientError } from '@/lib/api/client';
import { getProductBySlug } from '@/features/products/api/queries';
import { WishlistButton } from '@/features/wishlist/components/WishlistButton';
import { ProductVariantPicker } from '@/features/products/components/ProductVariantPicker';
import type { Product } from '@/features/products/types';

/**
 * STANDARDS.md #4: revalidate:600. `metaTitle`/`metaDescription` ve
 * `viewCount` crawler için server'da render edilmeli — bu yüzden ISR,
 * CSR değil. Interaktif kısım (wishlist kalp butonu, varyant/sepet) ayrı
 * Client Component (ProductVariantPicker, WishlistButton).
 *
 * NOT: schema.prisma'daki Product.viewCount SADECE
 * GET /products/slug/:locale/:slug controller metodundan artırılır — bu,
 * bu sayfanın her ISR revalidate'inde backend tarafında bir kez artar,
 * findOne() gibi iç çağrılardan artmaz (bkz. şemadaki not).
 */

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
  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{translation?.name}</h1>
          {translation?.description && (
            <p className="mt-2 text-sm text-ink-muted">{translation.description}</p>
          )}
        </div>
        <WishlistButton productId={product.id} />
      </div>

      {primaryImage && (
        <img
          src={primaryImage.detailUrl}
          alt={translation?.name ?? ''}
          className="mt-6 w-full max-w-md rounded-lg object-cover"
        />
      )}

      {/* Fiyat/stok/SKU artık ürün seviyesinde değil — her variant'ta ayrı
          (schema.prisma notu: "SKU/fiyat/stok artık burada, ürün seviyesinde değil").
          Bu yüzden "sepete ekle" bir variant seçimi gerektiriyor. */}
      <div className="mt-6">
        <ProductVariantPicker productId={product.id} variants={product.variants} />
      </div>
    </div>
  );
}
