'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Copy, Download, History, Package, Receipt, Truck } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

/**
 * Admin sipariş detayı — GET /orders/{id} + PATCH /orders/{id}/status.
 * Status picker SADECE backend ORDER_STATUS_TRANSITIONS'ın izin verdiği
 * sonraki status'ları sunar (terminal status'larda yok). reason opsiyonel,
 * OrderStatusHistory'ye yazılır.
 *
 * Not: Response'ta müşteri profili yok (sadece clientId).
 */

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function formatMoney(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  return Number.isFinite(n)
    ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : String(value);
}

async function copyToClipboard(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  } catch {
    toast.error('Could not copy to clipboard.');
  }
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-foreground text-right break-words">{children}</dd>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Skeleton className="h-8 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

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

  if (isLoading) return <OrderDetailSkeleton />;

  if (!order) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/admin/orders">
            <ArrowLeft size={14} /> Orders
          </Link>
        </Button>
        <p className="text-muted-foreground text-sm">Order not found.</p>
      </div>
    );
  }

  const transitions = ORDER_STATUS_TRANSITIONS[order.status];
  const isDelivery = order.fulfillmentType === 'DELIVERY';
  const history = [...order.statusHistory].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const shortId = order.id.slice(0, 8);

  const handleUpdateStatus = async () => {
    if (!nextStatus) return;
    try {
      await updateStatus.mutateAsync({
        orderId: order.id,
        input: { status: nextStatus, reason: reason.trim() || undefined },
      });
      toast.success(`Order #${shortId} marked ${ORDER_STATUS_LABELS[nextStatus]}.`);
    } catch {
      toast.error('Could not update the order status. Please try again.');
    }
  };

  const handleDownloadInvoice = async () => {
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
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ml-2">
          <Link href="/admin/orders">
            <ArrowLeft size={14} /> Orders
          </Link>
        </Button>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-foreground font-serif text-3xl italic">Order #{shortId}</h1>
              <StatusBadge tone={ORDER_STATUS_TONES[order.status]}>
                {ORDER_STATUS_LABELS[order.status]}
              </StatusBadge>
            </div>
            <p className="text-muted-foreground text-sm">
              Placed {formatDate(order.createdAt)} · {order.items.length}{' '}
              {order.items.length === 1 ? 'item' : 'items'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(order.id, 'Order ID copied.')}
            >
              <Copy size={14} /> Copy ID
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadInvoice}
              disabled={downloading}
            >
              <Download size={14} /> {downloading ? 'Downloading…' : 'Invoice PDF'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-border border-b py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Package size={16} className="text-muted-foreground" />
                Items
                <Badge variant="secondary" className="ml-1 font-normal">
                  {order.items.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-muted-foreground pl-6 text-xs uppercase">
                      Product
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase">Qty</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase">Price</TableHead>
                    <TableHead className="text-muted-foreground pr-6 text-right text-xs uppercase">
                      Line total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-xs py-4 pl-6">
                        <p className="text-foreground truncate text-sm font-medium">
                          {item.productVariant.product.translations[0]?.name ??
                            item.productVariant.sku}
                        </p>
                        <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                          {item.productVariant.sku}
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">×{item.quantity}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatMoney(item.price)}
                      </TableCell>
                      <TableCell className="text-foreground pr-6 text-right font-medium">
                        {formatMoney(Number(item.price) * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="gap-0 py-0">
            <CardHeader className="border-border border-b py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <History size={16} className="text-muted-foreground" />
                Status history
              </CardTitle>
            </CardHeader>
            <CardContent className="py-5">
              {history.length === 0 ? (
                <p className="text-muted-foreground text-sm">No status changes yet.</p>
              ) : (
                <ol className="border-border relative ml-1.5 space-y-5 border-l pl-6">
                  {history.map((h, index) => (
                    <li key={h.id} className="relative">
                      <span
                        aria-hidden="true"
                        className={cn(
                          'ring-card absolute top-1.5 -left-[29px] size-2.5 rounded-full ring-4',
                          index === 0 ? 'bg-sidebar-primary' : 'bg-border',
                        )}
                      />
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        {h.fromStatus && (
                          <>
                            <span className="text-muted-foreground">
                              {ORDER_STATUS_LABELS[h.fromStatus]}
                            </span>
                            <span className="text-muted-foreground">→</span>
                          </>
                        )}
                        <span className="text-foreground font-medium">
                          {ORDER_STATUS_LABELS[h.toStatus]}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {formatDate(h.createdAt)}
                      </p>
                      {h.reason && (
                        <p className="text-muted-foreground mt-1.5 text-sm italic">“{h.reason}”</p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {can('order.updateStatus') && transitions.length > 0 && (
            <Card className="border-sidebar-primary/30 gap-0 py-0">
              <CardHeader className="border-border border-b py-4">
                <CardTitle className="text-sm font-semibold">Update status</CardTitle>
                <p className="text-muted-foreground text-xs">
                  Allowed next: {transitions.map((s) => ORDER_STATUS_LABELS[s]).join(', ')}
                </p>
              </CardHeader>
              <CardContent className="space-y-4 py-5">
                <div className="space-y-1.5">
                  <Label htmlFor="order-next-status" className="text-muted-foreground text-xs">
                    Next status
                  </Label>
                  <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as OrderStatus)}>
                    <SelectTrigger id="order-next-status" className="w-full">
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

                <div className="space-y-1.5">
                  <Label htmlFor="order-reason" className="text-muted-foreground text-xs">
                    Reason (optional)
                  </Label>
                  <Textarea
                    id="order-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Customer requested cancellation"
                    rows={3}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleUpdateStatus}
                  disabled={!nextStatus || updateStatus.isPending}
                >
                  {updateStatus.isPending ? 'Updating…' : 'Update status'}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="gap-0 py-0">
            <CardHeader className="border-border border-b py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Receipt size={16} className="text-muted-foreground" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="py-5">
              <dl className="space-y-2.5">
                <InfoRow label="Subtotal">{formatMoney(order.subtotal)}</InfoRow>
                {order.coupon && (
                  <InfoRow label={`Coupon ${order.coupon.code}`}>
                    <span className="text-sidebar-primary">
                      −{formatMoney(order.discountAmount)}
                    </span>
                  </InfoRow>
                )}
              </dl>
              <Separator className="my-4" />
              <div className="flex items-baseline justify-between">
                <span className="text-foreground text-sm font-medium">Total</span>
                <span className="text-foreground font-serif text-2xl italic">
                  {formatMoney(order.total)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 py-0">
            <CardHeader className="border-border border-b py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Truck size={16} className="text-muted-foreground" />
                Fulfillment
              </CardTitle>
            </CardHeader>
            <CardContent className="py-5">
              <dl className="space-y-2.5">
                <InfoRow label="Type">
                  <Badge variant="outline" className="font-normal">
                    {order.fulfillmentType}
                  </Badge>
                </InfoRow>
                <InfoRow label="Payment">
                  <Badge variant="secondary" className="font-normal uppercase">
                    {order.paymentMethod}
                  </Badge>
                </InfoRow>
                <InfoRow label="Customer">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(order.clientId, 'Customer ID copied.')}
                    className="text-muted-foreground hover:text-foreground font-mono text-xs transition-colors"
                    title="Copy customer ID"
                  >
                    {order.clientId.slice(0, 8)}…
                  </button>
                </InfoRow>
              </dl>

              {isDelivery && (
                <>
                  <Separator className="my-4" />
                  <dl className="space-y-2.5">
                    <InfoRow label="Recipient">{order.recipientName ?? '—'}</InfoRow>
                    <InfoRow label="Phone">{order.recipientPhone ?? '—'}</InfoRow>
                    <InfoRow label="Address">{order.shippingAddress ?? '—'}</InfoRow>
                  </dl>
                </>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
