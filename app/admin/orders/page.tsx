import { ComingSoonPanel } from '@/components/shared/ComingSoonPanel';

export default function AdminOrdersPage() {
  return (
    <div>
      <h1 className="font-display text-2xl italic text-ink">Orders</h1>
      <div className="mt-6">
        <ComingSoonPanel feature="Order" />
      </div>
    </div>
  );
}
