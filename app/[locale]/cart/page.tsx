import { CartView } from '@/features/cart/components/CartView';

/**
 * STANDARDS.md #4: CSR, force-dynamic. Kişisel veri, `availableQuantity`
 * (schema.prisma: quantity - reservedQuantity, her zaman uygulama katmanında
 * hesaplanır) her seferinde canlı okunmalı — hiçbir şey Next Data Cache'e girmez.
 */
export const dynamic = 'force-dynamic';

export default function CartPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <CartView />
    </div>
  );
}
