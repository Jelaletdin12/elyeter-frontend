import { OrderHistoryList } from '@/features/orders/components/OrderHistoryList';

/** STANDARDS.md #4: Hesap/Sipariş geçmişi — CSR, cache yok, auth gerektirir. */
export const dynamic = 'force-dynamic';

export default function OrderHistoryPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-xl font-semibold">Order history</h1>
      <div className="mt-6">
        <OrderHistoryList />
      </div>
    </div>
  );
}
