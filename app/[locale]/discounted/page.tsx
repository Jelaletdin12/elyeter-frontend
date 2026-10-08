import type { Metadata } from 'next';
import { apiFetch } from '@/lib/api/client';
import { dataCacheTags } from '@/lib/api/query-keys';
import { ProductGrid } from '@/features/home/components/ProductGrid';
import type { ProductListResponse } from '@/features/products/types';

async function getDiscountedProducts(locale: string): Promise<ProductListResponse> {
  return apiFetch<ProductListResponse>(`/products/discounted?locale=${locale}&limit=12`, {
    next: { revalidate: 300, tags: [dataCacheTags.products()] },
  });
}

export const metadata: Metadata = {
  title: 'Discounted products',
};

export default async function DiscountedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const productList = await getDiscountedProducts(locale);

  return (
    <div>
      <ProductGrid products={productList.items} locale={locale} title="Discounted products" />
    </div>
  );
}
