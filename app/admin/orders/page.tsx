'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { adminOrderListOptions } from '@/features/orders/api/admin-queries';
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from '@/features/orders/types';
import type { Order } from '@/features/orders/types';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';

/**
 * Admin sipariş listesi — GET /orders (staff için tüm siparişler, createdAt
 * desc). Backend'de durum filtreleme YOK (?status= okunmuyor, findAll sadece
 * PaginationQuery) — kontroller backend'e eklenene kadar sadece sayfalama var.
 *
 * Response'ta müşteri adı/email'i yok (sadece clientId) — "Customer" hücresi
 * kısa clientId gösterir. Durum güncelleme detay sayfasında
 * (updateStatus sadece staff'a açık), listeden detaya açılır.
 */
export default function AdminOrdersPage() {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const { can } = useAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery(adminOrderListOptions(storeId, page));

  const orders = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div>
      <div>
        <h1 className="font-serif text-foreground text-2xl italic">Orders</h1>
        <p className="text-muted-foreground mt-1 text-sm">{meta?.total ?? 0} orders</p>
      </div>

      <div className="mt-6">
        <DataTable<Order>
          isLoading={isLoading}
          rows={orders}
          getRowId={(row) => row.id}
          emptyTitle="No orders yet"
          emptyDescription="Orders placed through the storefront will show up here."
          emptyIcon={ShoppingCart}
          columns={[
            {
              header: 'Order',
              cell: (row) => (
                <div>
                  <p className="text-foreground font-mono text-xs">#{row.id.slice(0, 8)}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(row.createdAt).toLocaleString()}
                  </p>
                </div>
              ),
            },
            {
              header: 'Customer',
              cell: (row) => (
                <span className="text-muted-foreground font-mono text-xs">
                  {row.clientId.slice(0, 8)}…
                </span>
              ),
            },
            {
              header: 'Items',
              cell: (row) => <span className="text-muted-foreground text-sm">{row.items.length}</span>,
            },
            {
              header: 'Fulfillment',
              cell: (row) => (
                <div className="text-muted-foreground text-xs">
                  <p>{row.fulfillmentType}</p>
                  <p className="uppercase">{row.paymentMethod}</p>
                </div>
              ),
            },
            {
              header: 'Total',
              cell: (row) => <span className="text-foreground font-serif italic">{row.total}</span>,
            },
            {
              header: 'Status',
              cell: (row) => (
                <StatusBadge tone={ORDER_STATUS_TONES[row.status]}>
                  {ORDER_STATUS_LABELS[row.status]}
                </StatusBadge>
              ),
            },
            {
              header: '',
              className: 'text-right',
              cell: (row) => (
                <div className="flex justify-end gap-1">
                  {can('order.viewAll') || can('order.updateStatus') ? (
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/orders/${row.id}`}>
                        <Eye size={14} /> View
                      </Link>
                    </Button>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      </div>

      {(meta?.totalPages ?? 0) > 1 && (
        <div className="text-muted-foreground mt-4 flex items-center justify-between text-sm">
          <p>
            Page {meta?.page} of {meta?.totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft size={14} /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= (meta?.totalPages ?? 1)}
            >
              Next <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
