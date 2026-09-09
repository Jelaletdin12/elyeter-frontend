'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { adminAuthorizedFetch as authorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';
import { useDeleteProductMutation } from '@/features/products/api/mutations';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { Product, ProductListResponse } from '@/features/products/types';

/**
 * Bu sayfa FRONTEND_AGENTS.md #7'deki dual invalidation akışını gösterir:
 * silme başarılı olduğunda useDeleteProductMutation (features/products/api/mutations.ts)
 * hem admin'in kendi listesini (invalidateQueries) hem de public tarafı
 * (POST /api/revalidate) günceller.
 *
 * ⚠️ Admin'in TÜM ürünleri (pasif dahil) görebilmesi gerekiyor ama GET /products'ta
 * bunu ayırt eden bir query param docs-json.json'da YOK — backend'in JWT rolüne
 * göre kendi içinde davrandığı varsayılıyor, backend davranışına göre doğrula.
 */
export default function AdminProductsPage() {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const { can } = useAuth();
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState<Product | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.adminProducts.list(storeId, {}),
    queryFn: () => authorizedFetch<ProductListResponse>('/products'),
    staleTime: 30_000, // STANDARDS.md #5: admin liste sayfaları
  });

  const products = data?.items ?? [];
  const deleteProduct = useDeleteProductMutation(storeId);

  async function confirmDelete() {
    if (!pendingDeleteProduct) return;
    const name = pendingDeleteProduct.translations[0]?.name ?? 'Product';
    await deleteProduct.mutateAsync(pendingDeleteProduct.id);
    toast.success(`${name} was deleted.`);
    setPendingDeleteProduct(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl italic text-ink">Products</h1>
          <p className="mt-1 text-sm text-ink-muted">{data?.meta.total ?? 0} products in catalog</p>
        </div>
        {can('product.create') && (
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus size={16} /> New product
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-6">
        <DataTable<Product>
          isLoading={isLoading}
          rows={products}
          getRowId={(row) => row.id}
          emptyTitle="No products yet"
          emptyDescription="Products you add to the catalog will show up here."
          emptyIcon={Package}
          columns={[
            {
              header: 'Name',
              cell: (row) => {
                const image = row.images.find((img) => img.isPrimary) ?? row.images[0];
                return (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-card bg-paper">
                      {image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image.cardUrl} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <p className="font-medium text-ink">{row.translations[0]?.name ?? '—'}</p>
                  </div>
                );
              },
            },
            {
              header: 'Price',
              cell: (row) => (
                <span className="font-display italic text-ink">
                  {row.variants[0] ? row.variants[0].price : '—'}
                </span>
              ),
            },
            {
              header: 'Stock',
              cell: (row) => {
                const totalAvailable = row.variants.reduce(
                  (sum, v) => sum + (v.inventory ? v.inventory.quantity - v.inventory.reservedQuantity : 0),
                  0,
                );
                return (
                  <StatusBadge tone={totalAvailable > 0 ? 'success' : 'destructive'}>
                    {totalAvailable > 0 ? `${totalAvailable} in stock` : 'Out of stock'}
                  </StatusBadge>
                );
              },
            },
            {
              header: '',
              className: 'text-right',
              cell: (row) => (
                <div className="flex justify-end gap-1">
                  {can('product.update') && (
                    <Button asChild variant="ghost" size="icon" aria-label="Edit">
                      <Link href={`/admin/products/${row.id}`}>
                        <Pencil size={15} />
                      </Link>
                    </Button>
                  )}
                  {can('product.delete') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPendingDeleteProduct(row)}
                      aria-label="Delete"
                      className="text-danger hover:bg-danger/10"
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

      <ConfirmDialog
        open={pendingDeleteProduct !== null}
        title={`Delete ${pendingDeleteProduct?.translations[0]?.name ?? 'this product'}?`}
        description="This will remove the product from the catalog immediately. The public product page will also be revalidated."
        confirmLabel="Delete"
        isDestructive
        isLoading={deleteProduct.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteProduct(null)}
      />
    </div>
  );
}
