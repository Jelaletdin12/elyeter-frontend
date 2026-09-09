'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { categoryListOptions } from '@/features/categories/api/queries';
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '@/features/categories/api/mutations';
import { CategoryFormDialog } from '@/features/categories/components/CategoryFormDialog';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { categoryTranslation, type Category } from '@/features/categories/types';

/**
 * ✅ Şema doğrulandı (curl, 2026-09-07): POST/GET /categories,
 * GET/PATCH/DELETE /categories/{id}. Users/Products sayfalarıyla AYNI
 * pattern: DataTable + tek dialog (create/edit) + ConfirmDialog (delete) +
 * dual invalidation (bkz. features/categories/api/mutations.ts).
 */
export default function AdminCategoriesPage() {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const { can } = useAuth();

  const [page] = useState(1);
  const { data, isLoading } = useQuery(categoryListOptions(storeId, page));

  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<Category | null>(null);

  const createCategory = useCreateCategoryMutation(storeId);
  const updateCategory = useUpdateCategoryMutation(storeId);
  const deleteCategory = useDeleteCategoryMutation(storeId);

  const categories = data?.items ?? [];

  function openCreate() {
    setEditingCategory(null);
    setDialogMode('create');
  }

  function openEdit(category: Category) {
    setEditingCategory(category);
    setDialogMode('edit');
  }

  function closeDialog() {
    setDialogMode(null);
    setEditingCategory(null);
  }

  async function confirmDelete() {
    if (!pendingDeleteCategory) return;
    const name = categoryTranslation(pendingDeleteCategory, 'en')?.name ?? 'Category';
    await deleteCategory.mutateAsync(pendingDeleteCategory.id);
    toast.success(`${name} was deleted.`);
    setPendingDeleteCategory(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl italic text-ink">Categories</h1>
          <p className="mt-1 text-sm text-ink-muted">{data?.meta.total ?? 0} categories</p>
        </div>
        {can('category.create') && (
          <Button onClick={openCreate}>
            <Plus size={16} /> New category
          </Button>
        )}
      </div>

      <div className="mt-6">
        <DataTable<Category>
          isLoading={isLoading}
          rows={categories}
          getRowId={(row) => row.id}
          emptyTitle="No categories yet"
          emptyDescription="Categories you create will show up here and organize your product catalog."
          emptyIcon={Tag}
          columns={[
            {
              header: 'Name',
              cell: (row) => (
                <div>
                  <p className="font-medium text-ink">{categoryTranslation(row, 'en')?.name ?? '—'}</p>
                  <p className="text-xs text-ink-muted">
                    {row.translations.map((t) => t.locale.toUpperCase()).join(' · ')}
                  </p>
                </div>
              ),
            },
            {
              header: 'Slug',
              cell: (row) => (
                <span className="text-sm text-ink-muted">{categoryTranslation(row, 'en')?.slug}</span>
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
              header: '',
              className: 'text-right',
              cell: (row) => (
                <div className="flex justify-end gap-1">
                  {can('category.update') && (
                    <Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label="Edit">
                      <Pencil size={15} />
                    </Button>
                  )}
                  {can('category.delete') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPendingDeleteCategory(row)}
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

      <CategoryFormDialog
        open={dialogMode !== null}
        mode={dialogMode ?? 'create'}
        initialCategory={editingCategory ?? undefined}
        isSubmitting={createCategory.isPending || updateCategory.isPending}
        onCancel={closeDialog}
        onSubmitCreate={(values) =>
          createCategory.mutate(values, {
            onSuccess: () => {
              toast.success('Category created.');
              closeDialog();
            },
          })
        }
        onSubmitEdit={(values) => {
          if (!editingCategory) return;
          updateCategory.mutate(
            { categoryId: editingCategory.id, input: values },
            {
              onSuccess: () => {
                toast.success('Category updated.');
                closeDialog();
              },
            },
          );
        }}
      />

      <ConfirmDialog
        open={pendingDeleteCategory !== null}
        title={
          pendingDeleteCategory
            ? `Delete ${categoryTranslation(pendingDeleteCategory, 'en')?.name ?? 'this category'}?`
            : ''
        }
        description="Products in this category will not be deleted, but they will lose this category association."
        confirmLabel="Delete"
        isDestructive
        isLoading={deleteCategory.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteCategory(null)}
      />
    </div>
  );
}
