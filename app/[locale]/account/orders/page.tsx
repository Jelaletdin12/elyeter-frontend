import { OrderHistoryList } from '@/features/orders/components/OrderHistoryList';

/** STANDARDS.md #4: Hesap/Sipariş geçmişi — CSR, cache yok, auth gerektirir. */
export const dynamic = 'force-dynamic';

export default function OrderHistoryPage() {
  return <OrderHistoryList />;
}
