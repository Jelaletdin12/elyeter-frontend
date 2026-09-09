import { ProductCard } from './ProductCard';
import type { Product } from '@/features/products/types';

export function ProductGrid({ products, locale }: { products: Product[]; locale: string }) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 pt-14">
      <h2 className="font-display text-2xl italic">New arrivals</h2>

      <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} locale={locale} />
        ))}
      </div>
    </section>
  );
}
