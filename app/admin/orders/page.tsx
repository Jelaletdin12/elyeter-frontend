'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Eye, ShoppingCart } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { adminOrderListOptions } from '@/features/orders/api/admin-queries';
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from '@/features/orders/types';
import type { Order } from '@/features/orders/types';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
 * Admin sipariş listesi — GET /orders (staff için tüm siparişler, createdAt desc).
 * Backend'de durum filtreleme YOK (?status= okunmuyor, findAll sadece
 * PaginationQuery) — şimdilik sadece sayfalama var.
 *
 * Response'ta müşteri adı/email'i yok (sadece clientId) — "Customer" hücresi
 * kısa clientId gösterir. Durum güncelleme detay sayfasında yapılır.
 *
 * Sıralama client-side ve YALNIZCA geçerli sayfa üzerindedir.
 */

const getRowId = (row: Order) => row.id;

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatMoney(value: string | number) {
  const n = Number(value);
  return Number.isFinite(n)
    ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : String(value);
}

export default function AdminOrdersPage() {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const { can } = useAuth();
  const [page, setPage] = useState(1);

  // Store değişince 1. sayfaya dön.
  useEffect(() => {
    setPage(1);
  }, [storeId]);

  const { data, isLoading, isFetching } = useQuery({
    ...adminOrderListOptions(storeId, page),
    // Sayfa değişiminde tablo skeleton'a düşmesin, eski veri kalsın.
    placeholderData: keepPreviousData,
  });

  const orders = data?.items ?? [];
  const meta = data?.meta;
  const canView = can('order.viewAll') || can('order.updateStatus');

  return (
    <div>
      <div>
        <h1 className="text-foreground font-serif text-2xl italic">Orders</h1>
        <p className="text-muted-foreground mt-1 text-sm">{meta?.total ?? 0} orders</p>
      </div>

      <div
        className={`mt-6 transition-opacity ${isFetching && !isLoading ? 'opacity-70' : 'opacity-100'}`}
      >
        <DataTable<Order>
          isLoading={isLoading}
          rows={orders}
          getRowId={getRowId}
          emptyTitle="No orders yet"
          emptyDescription="Orders placed through the storefront will show up here."
          emptyIcon={ShoppingCart}
          enableRowSelection
          currentPage={meta?.page ?? page}
          totalPages={meta?.totalPages ?? 1}
          totalCount={meta?.total}
          onPageChange={setPage}
          columns={[
            {
              id: 'order',
              header: 'Order',
              sortValue: (row) => new Date(row.createdAt).getTime(),
              cell: (row) => (
                <div>
                  {canView ? (
                    <Link
                      href={`/admin/orders/${row.id}`}
                      className="text-foreground hover:text-sidebar-primary font-mono text-xs font-medium transition-colors"
                    >
                      #{row.id.slice(0, 8)}
                    </Link>
                  ) : (
                    <p className="text-foreground font-mono text-xs font-medium">
                      #{row.id.slice(0, 8)}
                    </p>
                  )}
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {dateFormatter.format(new Date(row.createdAt))}
                  </p>
                </div>
              ),
            },
            {
              id: 'customer',
              header: 'Customer',
              cell: (row) => (
                <span className="text-muted-foreground font-mono text-xs">
                  {row.clientId.slice(0, 8)}…
                </span>
              ),
            },
            {
              id: 'items',
              header: 'Items',
              sortValue: (row) => row.items.length,
              cell: (row) => (
                <span className="text-muted-foreground text-sm">{row.items.length}</span>
              ),
            },
            {
              id: 'fulfillment',
              header: 'Fulfillment',
              cell: (row) => (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="text-xs font-normal">
                    {row.fulfillmentType}
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-normal uppercase">
                    {row.paymentMethod}
                  </Badge>
                </div>
              ),
            },
            {
              id: 'total',
              header: 'Total',
              sortValue: (row) => Number(row.total),
              cell: (row) => (
                <span className="text-foreground font-serif italic">{formatMoney(row.total)}</span>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              sortValue: (row) => ORDER_STATUS_LABELS[row.status],
              cell: (row) => (
                <StatusBadge tone={ORDER_STATUS_TONES[row.status]}>
                  {ORDER_STATUS_LABELS[row.status]}
                </StatusBadge>
              ),
            },
            {
              header: '',
              className: 'text-right',
              cell: (row) =>
                canView ? (
                  <div className="flex justify-end">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/orders/${row.id}`}>
                        <Eye size={14} /> View
                      </Link>
                    </Button>
                  </div>
                ) : null,
            },
          ]}
        />
      </div>
    </div>
  );
}
