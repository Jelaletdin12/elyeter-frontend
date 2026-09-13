'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { adminOrderDetailOptions } from '@/features/orders/api/admin-queries';
import { useUpdateOrderStatusMutation } from '@/features/orders/api/admin-mutations';
import { downloadOrderInvoice } from '@/features/orders/api/invoice';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  ORDER_STATUS_TRANSITIONS,
} from '@/features/orders/types';
import type { OrderStatus } from '@/features/orders/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Admin sipariş detayı — GET /orders/{id} + PATCH /orders/{id}/status.
 * Status picker SADECE backend ORDER_STATUS_TRANSITIONS'ın izin verdiği
 * sonraki status'ları sunar (terminal status'larda yok). reason özellikle
 * CANCELLED/RETURN_REQUESTED için faydalı (OrderStatusHistory'ye yazılır),
 * ama opsiyonel.
 *
 * Not: Response'ta müşteri profili yok (clientId var) — ad/email istenirse
 * profile endpoint'inden ayrıca çekilebilir, şu an gösterilmiyor.
 */
export default function AdminOrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const storeId = useAuthStore((s) => s.activeStoreId);
  const { can } = useAuth();

  const { data: order, isLoading } = useQuery(adminOrderDetailOptions(storeId, params.orderId));

  const updateStatus = useUpdateOrderStatusMutation(storeId);
  const [nextStatus, setNextStatus] = useState<OrderStatus | ''>('');
  const [reason, setReason] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setNextStatus('');
    setReason('');
  }, [order?.status]);

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading order…</p>;
  if (!order) return <p className="text-muted-foreground text-sm">Order not found.</p>;

  const transitions = ORDER_STATUS_TRANSITIONS[order.status];
  const isDelivery = order.fulfillmentType === 'DELIVERY';

  const handleUpdateStatus = async () => {
    if (!order || !nextStatus) return;
    await updateStatus.mutateAsync({
      orderId: order.id,
      input: { status: nextStatus, reason: reason.trim() || undefined },
    });
    toast.success(`Order #${order.id.slice(0, 8)} marked ${ORDER_STATUS_LABELS[nextStatus]}.`);
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      await downloadOrderInvoice(order.id);
    } catch {
      toast.error('Invoice download failed.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/orders"
        className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
      >
        <ArrowLeft size={14} /> Orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-foreground font-serif text-2xl italic">
              Order #{order.id.slice(0, 8)}
            </h1>
            <StatusBadge tone={ORDER_STATUS_TONES[order.status]}>
              {ORDER_STATUS_LABELS[order.status]}
            </StatusBadge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownloadInvoice} disabled={downloading}>
          <Download size={14} /> {downloading ? 'Downloading…' : 'Invoice PDF'}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="border-border rounded-md border p-4 text-sm">
          <h2 className="text-foreground text-xs font-semibold uppercase">Fulfillment</h2>
          <dl className="text-muted-foreground mt-2 space-y-1">
            <div className="flex gap-2">
              <dt className="w-24 shrink-0">Type</dt>
              <dd>{order.fulfillmentType}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 shrink-0">Payment</dt>
              <dd>{order.paymentMethod}</dd>
            </div>
            {isDelivery && (
              <>
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0">Recipient</dt>
                  <dd>{order.recipientName ?? '—'}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0">Phone</dt>
                  <dd>{order.recipientPhone ?? '—'}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0">Address</dt>
                  <dd>{order.shippingAddress ?? '—'}</dd>
                </div>
              </>
            )}
          </dl>
        </div>

        <div className="border-border rounded-md border p-4 text-sm">
          <h2 className="text-foreground text-xs font-semibold uppercase">Totals</h2>
          <dl className="text-muted-foreground mt-2 space-y-1">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{order.subtotal ?? '—'}</dd>
            </div>
            {order.coupon && (
              <div className="flex justify-between">
                <dt>Coupon {order.coupon.code}</dt>
                <dd className="text-sidebar-primary">−{order.discountAmount}</dd>
              </div>
            )}
            <div className="text-foreground flex justify-between font-medium">
              <dt>Total</dt>
              <dd>{order.total}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-foreground text-sm font-semibold">Items</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="text-sm">
            <thead>
              <tr className="text-muted-foreground text-left text-xs uppercase">
                <th className="pr-4 pb-2 font-medium">Product</th>
                <th className="pr-4 pb-2 font-medium">SKU</th>
                <th className="pr-4 pb-2 font-medium">Qty</th>
                <th className="pr-4 pb-2 font-medium">Price</th>
                <th className="pb-2 text-right font-medium">Line total</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="text-foreground max-w-xs truncate py-3 pr-4">
                    {item.productVariant.product.translations[0]?.name ?? item.productVariant.sku}
                  </td>
                  <td className="text-muted-foreground py-3 pr-4 font-mono text-xs">
                    {item.productVariant.sku}
                  </td>
                  <td className="text-muted-foreground py-3 pr-4">{item.quantity}</td>
                  <td className="text-muted-foreground py-3 pr-4">{item.price}</td>
                  <td className="text-foreground py-3 text-right">
                    {(Number(item.price) * item.quantity).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {can('order.updateStatus') && transitions.length > 0 && (
        <div className="border-border mt-6 rounded-md border p-4">
          <h2 className="text-foreground text-sm font-semibold">Update status</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Allowed next: {transitions.map((s) => ORDER_STATUS_LABELS[s]).join(', ')}
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label htmlFor="order-next-status" className="text-muted-foreground text-xs">
                Next status
              </label>
              <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as OrderStatus)}>
                <SelectTrigger id="order-next-status" className="w-48">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {transitions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {ORDER_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1">
              <label htmlFor="order-reason" className="text-muted-foreground text-xs">
                Reason (optional)
              </label>
              <Input
                id="order-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Customer requested cancellation"
              />
            </div>
            <Button onClick={handleUpdateStatus} disabled={!nextStatus || updateStatus.isPending}>
              {updateStatus.isPending ? 'Updating…' : 'Update status'}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-foreground text-sm font-semibold">Status history</h2>
        <ul className="text-muted-foreground mt-2 space-y-1 text-xs">
          {order.statusHistory.map((h) => (
            <li key={h.id}>
              {h.fromStatus ? ORDER_STATUS_LABELS[h.fromStatus] : '—'} →{' '}
              {ORDER_STATUS_LABELS[h.toStatus]} · {new Date(h.createdAt).toLocaleString()}
              {h.reason && <span className="text-foreground"> — “{h.reason}”</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
