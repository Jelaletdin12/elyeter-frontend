'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Award, ImageOff } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { brandListOptions } from '@/features/brands/api/queries';
import {
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} from '@/features/brands/api/mutations';
import { adminCategoryTreeOptions } from '@/features/categories/api/queries';
import { flattenCategoryTree } from '@/features/categories/types';
import { BrandFormDialog } from '@/features/brands/components/BrandFormDialog';
import { DataTable } from '@/components/shared/DataTable';
import { DataTableToolbar } from '@/components/shared/DataTableToolbar';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { brandTranslation } from '@/features/brands/types';
import type { Brand } from '@/features/brands/types';

/**
 * ✅ Şema doğrulandı (curl, 2026-09-16): GET/POST /brands, GET/PATCH/DELETE
 * /brands/{id}, public GET /brands/slug/{locale}/{slug}. Create/update
 * translation'ları Category ile AYNI createMany/deleteMany+create pattern'iyle
 * yazıyor; slug/metaTitle/metaDescription boş bırakılırsa backend name'den
 * üretiyor. 2026-09-18: backend `search` + `categoryId` filter'ları toolbar'a
 * bağlandı; logo önizleme kolonu (MinIO) + sayfalama eklendi.
 */
export default function AdminBrandsPage() {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const { can } = useAuth();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({});
  const [columnOrder, setColumnOrder] = useState<string[]>(['name', 'logo', 'products', 'status']);

  const { data, isLoading } = useQuery(brandListOptions(storeId, page, search, categoryFilter));

  const { data: categoryTreeData } = useQuery(adminCategoryTreeOptions(storeId));
  const categoryOptions = flattenCategoryTree(categoryTreeData ?? []);

  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [pendingDeleteBrand, setPendingDeleteBrand] = useState<Brand | null>(null);

  const createBrand = useCreateBrandMutation(storeId);
  const updateBrand = useUpdateBrandMutation(storeId);
  const deleteBrand = useDeleteBrandMutation(storeId);

  const brands = data?.items ?? [];

  function openCreate() {
    setEditingBrand(null);
    setDialogMode('create');
  }

  function openEdit(brand: Brand) {
    setEditingBrand(brand);
    setDialogMode('edit');
  }

  function closeDialog() {
    setDialogMode(null);
    setEditingBrand(null);
  }

  async function confirmDelete() {
    if (!pendingDeleteBrand) return;
    const name = brandTranslation(pendingDeleteBrand, 'en')?.name ?? 'Brand';
    await deleteBrand.mutateAsync(pendingDeleteBrand.id);
    toast.success(`${name} was deleted.`);
    setPendingDeleteBrand(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground font-serif text-2xl italic">Brands</h1>
          <p className="text-muted-foreground mt-1 text-sm">{data?.meta.total ?? 0} brands</p>
        </div>
        {can('brand.create') && (
          <Button onClick={openCreate}>
            <Plus size={16} /> New brand
          </Button>
        )}
      </div>

      <div className="mt-6">
        <DataTableToolbar
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Search brands…"
          columns={[
            { id: 'name', label: 'Name' },
            { id: 'logo', label: 'Logo' },
            { id: 'products', label: 'Products' },
            { id: 'status', label: 'Status' },
          ]}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          columnOrder={columnOrder}
          onColumnOrderChange={setColumnOrder}
          filterFields={[
            {
              id: 'category',
              label: 'Category',
              type: 'combobox',
              options: categoryOptions.map((o) => ({ value: o.id, label: o.label })),
            },
          ]}
          activeFilters={[{ fieldId: 'category', value: categoryFilter }]}
          onFilterChange={(fieldId, value) => {
            if (fieldId === 'category') {
              setCategoryFilter(value);
              setPage(1);
            }
          }}
          onFilterReset={() => {
            setCategoryFilter('');
            setPage(1);
          }}
          hideAction
        />

        <DataTable<Brand>
          isLoading={isLoading}
          rows={brands}
          getRowId={(row) => row.id}
          currentPage={data?.meta.page ?? 1}
          totalPages={data?.meta.totalPages ?? 1}
          totalCount={data?.meta.total}
          onPageChange={setPage}
          columnVisibility={columnVisibility}
          columnOrder={columnOrder}
          emptyTitle="No brands yet"
          emptyDescription="Brands you create will show up here and let you group your product catalog by manufacturer."
          emptyIcon={Award}
          columns={[
            {
              id: 'name',
              header: 'Name',
              cell: (row) => (
                <div>
                  <p className="text-foreground font-medium">
                    {brandTranslation(row, 'en')?.name ?? '—'}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {row.translations.map((t) => t.locale.toUpperCase()).join(' · ')}
                  </p>
                </div>
              ),
            },
            {
              id: 'logo',
              header: 'Logo',
              cell: (row) =>
                row.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.logoUrl}
                    alt=""
                    className="bg-background h-10 w-10 rounded-md object-contain p-1"
                  />
                ) : (
                  <span className="bg-background text-muted-foreground flex h-10 w-10 items-center justify-center rounded-md">
                    <ImageOff size={14} />
                  </span>
                ),
            },
            {
              id: 'products',
              header: 'Products',
              cell: (row) => (
                <span className="text-muted-foreground text-sm">{row._count?.products ?? 0}</span>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => (
                <StatusBadge tone={row.isActive ? 'success' : 'neutral'}>
                  {row.isActive ? 'Active' : 'Disabled'}
                </StatusBadge>
              ),
            },
            {
              header: '',
              className: 'text-right',
              cell: (row) => (
                <div className="flex justify-end gap-1">
                  {can('brand.update') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(row)}
                      aria-label="Edit"
                    >
                      <Pencil size={15} />
                    </Button>
                  )}
                  {can('brand.delete') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPendingDeleteBrand(row)}
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

      <BrandFormDialog
        open={dialogMode !== null}
        mode={dialogMode ?? 'create'}
        initialBrand={editingBrand ?? undefined}
        isSubmitting={createBrand.isPending || updateBrand.isPending}
        onCancel={closeDialog}
        onSubmitCreate={(values) =>
          createBrand.mutate(values, {
            onSuccess: () => {
              toast.success('Brand created.');
              closeDialog();
            },
          })
        }
        onSubmitEdit={(values) => {
          if (!editingBrand) return;
          updateBrand.mutate(
            { brandId: editingBrand.id, input: values },
            {
              onSuccess: () => {
                toast.success('Brand updated.');
                closeDialog();
              },
            },
          );
        }}
      />

      <ConfirmDialog
        open={pendingDeleteBrand !== null}
        title={
          pendingDeleteBrand
            ? `Delete ${brandTranslation(pendingDeleteBrand, 'en') ?? 'brand'}?`
            : ''
        }
        description="Brand with products cannot be deleted (backend returns conflict). The brand will be removed from admin and the public brand list."
        confirmLabel="Delete"
        isDestructive
        isLoading={deleteBrand.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteBrand(null)}
      />
    </div>
  );
}