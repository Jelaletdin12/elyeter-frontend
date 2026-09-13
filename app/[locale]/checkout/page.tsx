import { CheckoutWizard } from '@/features/orders/components/CheckoutWizard';

/**
 * STANDARDS.md #4: force-dynamic. `priceChanged`/`inStock` bayrakları anlık
 * — cache asla kullanıcıya yanlış fiyat göstermemeli. Wizard adımı
 * (`shipping`/`payment`/`review`) client-only UI state olduğu için
 * stores/ui-store.ts'teki `checkoutStep`'te tutulur, TanStack'e girmez.
 */
export const dynamic = 'force-dynamic';

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <CheckoutWizard />
    </div>
  );
}
