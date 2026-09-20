import { CartView } from '@/features/cart/components/CartView';

/**
 * STANDARDS.md #4: CSR, force-dynamic. Kişisel veri, `availableQuantity`
 * (schema.prisma: quantity - reservedQuantity, her zaman uygulama katmanında
 * hesaplanır) her seferinde canlı okunmalı — hiçbir şey Next Data Cache'e girmez.
 */
export const dynamic = 'force-dynamic';

export default function CartPage() {
  return (
    <div className="max-w-6l mx-auto px-4 py-10">
      <CartView />
    </div>
  );
}
