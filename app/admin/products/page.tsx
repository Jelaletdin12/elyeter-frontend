'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Plus, ImageOff, RefreshCw, PackageOpen, SearchX, ScanSearch } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { adminAuthorizedFetch as authorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';
import { adminCategoryTreeOptions } from '@/features/categories/api/queries';
import { flattenCategoryTree } from '@/features/categories/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDeleteProductMutation } from '@/features/products/api/mutations';
import { useVisualSearchReindexMutation } from '@/features/search/api/mutations';
import { DataTable, type ColumnDef } from '@/components/shared/DataTable';
import { DataTableToolbar } from '@/components/shared/DataTableToolbar';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TableActions } from '@/components/shared/TableActions';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { Product, ProductListResponse } from '@/features/products/types';

/**
 * FRONTEND_AGENTS.md #7'deki dual invalidation akışı: silme başarılı olduğunda
 * useDeleteProductMutation hem admin listesini (invalidateQueries) hem de public
 * tarafı (POST /api/revalidate) günceller.
 *
 * ⚠️ Admin'in TÜM ürünleri (pasif dahil) görebilmesi gerekiyor — GET /products'ın
 * `search`/`page`/`perPage` query paramlarını docs-json.json'a göre doğrula, isimler
 * farklıysa aşağıdaki queryFn'i güncelle.
 */

const PER_PAGE = 25;

export default function AdminProductsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const storeId = useAuthStore((s) => s.activeStoreId);
  const { can } = useAuth();

  const [pendingDeleteProduct, setPendingDeleteProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [columnOrder, setColumnOrder] = useState<string[]>(['name', 'price', 'stock', 'actions']);

  const { data: categoryTree } = useQuery(adminCategoryTreeOptions(storeId));
  const categoryOptions = flattenCategoryTree(categoryTree ?? []);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.adminProducts.list(storeId, {
      search,
      categoryId: categoryFilter || undefined,
      page,
      perPage: PER_PAGE,
    }),
    queryFn: () =>
      authorizedFetch<ProductListResponse>(
        `/products?page=${page}&perPage=${PER_PAGE}${search ? `&search=${encodeURIComponent(search)}` : ''}${
          categoryFilter ? `&categoryId=${encodeURIComponent(categoryFilter)}` : ''
        }`,
      ),
    staleTime: 30_000, // STANDARDS.md #5: admin liste sayfaları
    placeholderData: (prev) => prev, // sayfa/arama değişirken tablo boşalıp sıçramasın
  });

  const products = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const deleteProduct = useDeleteProductMutation(storeId);
  const reindexVisualSearch = useVisualSearchReindexMutation();

  async function handleReindexVisualSearch() {
    try {
      const result = await reindexVisualSearch.mutateAsync();
      toast.success(
        t(
          'products.reindexVisualSearchSuccess',
          'Visual search index rebuilt — {{indexed}} new, {{skipped}} already indexed.',
          { indexed: result.indexed, skipped: result.skipped },
        ),
      );
    } catch {
      // Hata toast'ı global MutationCache onError yakalar (providers/QueryProvider.tsx).
    }
  }

  function totalAvailable(product: Product): number {
    return product.variants.reduce(
      (sum, v) => sum + (v.inventory ? v.inventory.quantity - v.inventory.reservedQuantity : 0),
      0,
    );
  }

  async function confirmDelete() {
    if (!pendingDeleteProduct) return;
    const name =
      pendingDeleteProduct.translations[0]?.name ?? t('products.thisProduct', 'this product');
    try {
      await deleteProduct.mutateAsync(pendingDeleteProduct.id);
      toast.success(t('products.deleted', '{{name}} was deleted.', { name }));
      setPendingDeleteProduct(null);
    } catch {
      toast.error(
        t('products.deleteFailed', 'Could not delete {{name}}. Please try again.', { name }),
      );
    }
  }

  const columns: ColumnDef<Product>[] = useMemo(
    () => [
      {
        id: 'name',
        header: t('products.column.name', 'Name'),
        sortValue: (row) => row.translations[0]?.name ?? '',
        cell: (product) => {
          const image = product.images.find((img) => img.isPrimary) ?? product.images[0];
          return (
            <div className="flex min-w-0 items-center gap-3">
              <div className="bg-background flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.cardUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageOff size={15} className="text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-foreground truncate font-medium">
                  {product.translations[0]?.name ?? '—'}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'price',
        header: t('products.column.price', 'Price'),
        sortValue: (row) => Number(row.variants[0]?.price ?? 0),
        cell: (product) => (
          <span className="text-foreground font-serif italic">
            {product.variants[0] ? product.variants[0].price : '—'}
          </span>
        ),
      },
      {
        id: 'stock',
        header: t('products.column.stock', 'Stock'),
        sortValue: (row) => totalAvailable(row),
        cell: (product) => {
          const totalAvailableCount = totalAvailable(product);
          return (
            <StatusBadge tone={totalAvailableCount > 0 ? 'success' : 'destructive'}>
              {totalAvailableCount > 0
                ? t('products.inStock', '{{count}} in stock', { count: totalAvailableCount })
                : t('products.outOfStock', 'Out of stock')}
            </StatusBadge>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: (product) => {
          return (
            <TableActions
              onEdit={
                can('product.update')
                  ? () => router.push(`/admin/products/${product.id}`)
                  : undefined
              }
              onDelete={can('product.delete') ? () => setPendingDeleteProduct(product) : undefined}
              isDeleting={deleteProduct.isPending && pendingDeleteProduct?.id === product.id}
            />
          );
        },
      },
    ],
    [t, can, router, deleteProduct.isPending, pendingDeleteProduct, totalAvailable],
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground font-serif text-2xl italic">
            {t('products.title', 'Products')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isLoading
              ? t('common.loading', 'Loading…')
              : t('products.countInCatalog', '{{count}} products in catalog', { count: total })}
          </p>
        </div>
        {can('visualSearch.reindex') && (
          <Button
            variant="outline"
            onClick={handleReindexVisualSearch}
            disabled={reindexVisualSearch.isPending}
          >
            <ScanSearch size={16} />
            {reindexVisualSearch.isPending
              ? t('products.reindexVisualSearching', 'Reindexing…')
              : t('products.reindexVisualSearch', 'Reindex visual search')}
          </Button>
        )}
        {can('product.create') && (
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus size={16} /> {t('products.new', 'New product')}
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <DataTableToolbar
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder={t('products.searchPlaceholder', 'Search products…')}
            columns={[
              { id: 'name', label: t('products.column.name', 'Name') },
              { id: 'price', label: t('products.column.price', 'Price') },
              { id: 'stock', label: t('products.column.stock', 'Stock') },
            ]}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            columnOrder={columnOrder}
            onColumnOrderChange={setColumnOrder}
            hideAction
          />

          <Select
            value={categoryFilter || '__all__'}
            onValueChange={(value) => {
              setCategoryFilter(value === '__all__' ? '' : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder={t('products.filterByCategory', 'All categories')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">
                {t('products.filterByCategory', 'All categories')}
              </SelectItem>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isError ? (
          <div className="border-border bg-background flex flex-col items-center justify-center gap-3 rounded-md border py-16 text-center">
            <p className="text-muted-foreground text-sm">
              {t('products.loadFailed', "Products couldn't be loaded.")}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw size={14} /> {t('common.retry', 'Try again')}
            </Button>
          </div>
        ) : (
          <DataTable<Product>
            columns={columns}
            rows={products}
            isLoading={isLoading}
            getRowId={(row) => row.id}
            columnVisibility={columnVisibility}
            columnOrder={columnOrder}
            emptyTitle={
              search
                ? t('products.noSearchResults', 'No products match "{{search}}".', { search })
                : t('products.empty', 'Products you add to the catalog will show up here.')
            }
            emptyIcon={search ? SearchX : PackageOpen}
            currentPage={page}
            totalPages={totalPages}
            totalCount={total}
            onPageChange={setPage}
          />
        )}
      </div>

      <ConfirmDialog
        open={pendingDeleteProduct !== null}
        onOpenChange={(open) => !open && setPendingDeleteProduct(null)}
        title={t('products.deleteTitle', 'Delete {{name}}?', {
          name:
            pendingDeleteProduct?.translations[0]?.name ??
            t('products.thisProduct', 'this product'),
        })}
        description={t(
          'products.deleteDescription',
          'This will remove the product from the catalog immediately. The public product page will also be revalidated.',
        )}
        confirmLabel={t('common.delete', 'Delete')}
        cancelLabel={t('common.cancel', 'Cancel')}
        isLoading={deleteProduct.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
