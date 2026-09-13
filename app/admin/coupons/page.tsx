'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Pencil,
  Trash2,
  TicketPercent,
  Link2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { couponListOptions } from '@/features/coupons/api/queries';
import {
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} from '@/features/coupons/api/mutations';
import { CouponFormDialog } from '@/features/coupons/components/CouponFormDialog';
import { CouponScopeDialog } from '@/features/coupons/components/CouponScopeDialog';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import type { Coupon } from '@/features/coupons/types';

/**
 * Kupon yönetimi — products/categories sayfalarıyla AYNI pattern
 * (DataTable + tek dialog create/edit + ConfirmDialog delete + kapsam
 * yönetimi için CouponScopeDialog). Dual invalidation'ın revalidate yarısı
 * YOK, çünkü kuponlar public ISR'da değil (bkz. features/coupons/api/mutations.ts).
 *
 * ⚠️ GET /coupons'ta sayfalama query parametreleri Swagger'da dokümante değil;
 * `?page=` products/categories convention'ından alındı (curl'de meta döndüğü
 * doğrulandı). Backend page param'ını okumuyorsa sayfa 2'den itibaren ilk
 * sayfayı gösterir — backend'e @ApiQuery eklenerek doğrulanmalı.
 */
export default function AdminCouponsPage() {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const { can } = useAuth();

  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery(couponListOptions(storeId, page));

  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [pendingDeleteCoupon, setPendingDeleteCoupon] = useState<Coupon | null>(null);
  const [scopeCoupon, setScopeCoupon] = useState<Coupon | null>(null);

  const createCoupon = useCreateCouponMutation(storeId);
  const updateCoupon = useUpdateCouponMutation(storeId);
  const deleteCoupon = useDeleteCouponMutation(storeId);

  const coupons = data?.items ?? [];
  const meta = data?.meta;

  function openCreate() {
    setEditingCoupon(null);
    setDialogMode('create');
  }

  function openEdit(coupon: Coupon) {
    setEditingCoupon(coupon);
    setDialogMode('edit');
  }

  function closeDialog() {
    setDialogMode(null);
    setEditingCoupon(null);
  }

  async function confirmDelete() {
    if (!pendingDeleteCoupon) return;
    await deleteCoupon.mutateAsync(pendingDeleteCoupon.id);
    toast.success(`Coupon ${pendingDeleteCoupon.code} was deleted.`);
    setPendingDeleteCoupon(null);
  }

  function formatUsage(coupon: Coupon): string {
    return Number.isFinite(coupon.usageLimit) && coupon.usageLimit > 0
      ? `${coupon.usedCount} / ${coupon.usageLimit}`
      : `${coupon.usedCount}`;
  }

  function formatValue(coupon: Coupon): string {
    const raw = Number(coupon.value);
    const display = Number.isFinite(raw) ? String(raw) : coupon.value;
    return coupon.type === 'PERCENTAGE' ? `${display}%` : display;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground font-serif text-2xl italic">Coupons</h1>
          <p className="text-muted-foreground mt-1 text-sm">{meta?.total ?? 0} coupons</p>
        </div>
        {can('coupon.manage') && (
          <Button onClick={openCreate}>
            <Plus size={16} /> New coupon
          </Button>
        )}
      </div>

      <div className="mt-6">
        <DataTable<Coupon>
          isLoading={isLoading}
          rows={coupons}
          getRowId={(row) => row.id}
          emptyTitle="No coupons yet"
          emptyDescription="Create a promo code and it will show up here, ready to be applied at checkout."
          emptyIcon={TicketPercent}
          columns={[
            {
              header: 'Code',
              cell: (row) => (
                <div>
                  <p className="text-foreground font-mono font-medium">{row.code}</p>
                  <p className="text-muted-foreground text-xs">
                    {row.type === 'PERCENTAGE'
                      ? `Rewards ${formatValue(row)} off`
                      : `${formatValue(row)} off`}
                  </p>
                </div>
              ),
            },
            {
              header: 'Value',
              cell: (row) => (
                <span className="text-foreground font-serif italic">{formatValue(row)}</span>
              ),
            },
            {
              header: 'Usage',
              cell: (row) => (
                <div className="flex items-center gap-2">
                  <StatusBadge tone={row.usedCount > 0 ? 'success' : 'neutral'}>
                    {formatUsage(row)}
                  </StatusBadge>
                </div>
              ),
            },
            {
              header: 'Scope',
              cell: (row) => (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    {row.products.length > 0 && `${row.products.length} products`}
                    {row.products.length > 0 && row.categories.length > 0 && ' · '}
                    {row.categories.length > 0 && `${row.categories.length} categories`}
                    {row.products.length === 0 && row.categories.length === 0 && 'All products'}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setScopeCoupon(row)}
                    aria-label="Manage scope"
                    className="text-muted-foreground"
                  >
                    <Link2 size={14} />
                  </Button>
                </div>
              ),
            },
            {
              header: 'Status',
              cell: (row) => (
                <StatusBadge tone={row.isActive ? 'success' : 'neutral'}>
                  {row.isActive ? 'Active' : 'Disabled'}
                </StatusBadge>
              ),
            },
            {
              header: 'Expires',
              cell: (row) => (
                <span className="text-muted-foreground text-sm">
                  {row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : 'Never'}
                </span>
              ),
            },
            {
              header: '',
              className: 'text-right',
              cell: (row) => (
                <div className="flex justify-end gap-1">
                  {can('coupon.manage') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(row)}
                      aria-label="Edit"
                    >
                      <Pencil size={15} />
                    </Button>
                  )}
                  {can('coupon.manage') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPendingDeleteCoupon(row)}
                      aria-label="Delete"
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={15} />
                    </Button>
                  )}
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

      <CouponFormDialog
        open={dialogMode !== null}
        mode={dialogMode ?? 'create'}
        initialCoupon={editingCoupon ?? undefined}
        isSubmitting={createCoupon.isPending || updateCoupon.isPending}
        onCancel={closeDialog}
        onSubmitCreate={(values) =>
          createCoupon.mutate(values, {
            onSuccess: () => {
              toast.success('Coupon created.');
              closeDialog();
            },
          })
        }
        onSubmitEdit={(values) => {
          if (!editingCoupon) return;
          updateCoupon.mutate(
            { couponId: editingCoupon.id, input: values },
            {
              onSuccess: () => {
                toast.success('Coupon updated.');
                closeDialog();
              },
            },
          );
        }}
      />

      <CouponScopeDialog
        open={scopeCoupon !== null}
        coupon={scopeCoupon}
        storeId={storeId}
        onCancel={() => setScopeCoupon(null)}
      />

      <ConfirmDialog
        open={pendingDeleteCoupon !== null}
        title={`Delete ${pendingDeleteCoupon?.code ?? 'this coupon'}?`}
        description="Customers will no longer be able to use this code at checkout."
        confirmLabel="Delete"
        isDestructive
        isLoading={deleteCoupon.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteCoupon(null)}
      />
    </div>
  );
}
