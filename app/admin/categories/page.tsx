'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus, Tag, ImageOff } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { categoryListOptions, adminCategoryTreeOptions } from '@/features/categories/api/queries';
import { useDeleteCategoryMutation } from '@/features/categories/api/mutations';
import { DataTable } from '@/components/shared/DataTable';
import { DataTableToolbar } from '@/components/shared/DataTableToolbar';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TableActions } from '@/components/shared/TableActions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  categoryTranslation,
  type Category,
  type CategoryTreeNode,
} from '@/features/categories/types';

export default function AdminCategoriesPage() {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const { can } = useAuth();
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({});
  const [columnOrder, setColumnOrder] = useState<string[]>(['name', 'slug', 'parent', 'status']);

  const { data, isLoading } = useQuery(categoryListOptions(storeId, page, search));

  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<Category | null>(null);

  const deleteCategory = useDeleteCategoryMutation(storeId);

  const categories = data?.items ?? [];

  // Parent selector tree for mapping parent names
  const { data: treeData } = useQuery(adminCategoryTreeOptions(storeId));
  const tree = treeData ?? [];

  function flatten(nodes: CategoryTreeNode[]): CategoryTreeNode[] {
    return nodes.flatMap((n) => [n, ...flatten(n.children ?? [])]);
  }
  const parentNameById = new Map(
    flatten(tree).map((n) => [n.id, categoryTranslation(n, 'en')?.name ?? '—']),
  );

  async function confirmDelete() {
    if (!pendingDeleteCategory) return;
    const name = categoryTranslation(pendingDeleteCategory, 'en')?.name ?? 'Category';
    await deleteCategory.mutateAsync(pendingDeleteCategory.id);
    toast.success(`${name} was deleted.`);
    setPendingDeleteCategory(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground font-serif text-2xl tracking-tight italic">Categories</h1>
          <p className="text-muted-foreground mt-1 text-xs">
            {data?.meta.total ?? 0} total categories
          </p>
        </div>
        {can('category.create') && (
          <Button asChild>
            <Link href="/admin/categories/new">
              <Plus className="size-4" /> New category
            </Link>
          </Button>
        )}
      </div>

      <div>
        <DataTableToolbar
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Search categories…"
          columns={[
            { id: 'name', label: 'Name' },
            { id: 'slug', label: 'Slug' },
            { id: 'parent', label: 'Parent' },
            { id: 'status', label: 'Status' },
          ]}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          columnOrder={columnOrder}
          onColumnOrderChange={setColumnOrder}
          hideAction
        />

        <DataTable<Category>
          isLoading={isLoading}
          rows={categories}
          getRowId={(row) => row.id}
          currentPage={data?.meta.page ?? 1}
          totalPages={data?.meta.totalPages ?? 1}
          totalCount={data?.meta.total}
          onPageChange={setPage}
          columnVisibility={columnVisibility}
          columnOrder={columnOrder}
          enableRowSelection
          emptyTitle="No categories yet"
          emptyDescription="Categories you create will show up here and organize your product catalog."
          emptyIcon={Tag}
          columns={[
            {
              id: 'image',
              header: '',
              cell: (row) =>
                row.imageUrl ? (
                  <div className="border-border bg-muted relative h-10 w-16 overflow-hidden rounded-md border">
                    <Image
                      src={row.imageUrl}
                      alt={categoryTranslation(row, 'en')?.name ?? 'Category thumbnail'}
                      fill
                      sizes="64px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="border-border bg-muted text-muted-foreground flex h-10 w-16 items-center justify-center rounded-md border">
                    <ImageOff className="size-3.5" />
                  </div>
                ),
            },
            {
              id: 'name',
              header: 'Name',
              cell: (row) => (
                <div>
                  <p className="text-foreground font-medium">
                    {categoryTranslation(row, 'en')?.name ?? '—'}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {row.translations.map((t) => t.locale.toUpperCase()).join(' · ')}
                  </p>
                </div>
              ),
            },
            {
              id: 'slug',
              header: 'Slug',
              cell: (row) => (
                <span className="text-muted-foreground font-mono text-sm">
                  {categoryTranslation(row, 'en')?.slug}
                </span>
              ),
            },
            {
              id: 'parent',
              header: 'Parent',
              cell: (row) => (
                <span className="text-muted-foreground text-sm">
                  {row.parentId ? (parentNameById.get(row.parentId) ?? '—') : '—'}
                </span>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => (
                <Badge
                  variant={row.isActive ? 'default' : 'secondary'}
                  className="px-2 py-0.5 text-[11px]"
                >
                  {row.isActive ? 'Active' : 'Disabled'}
                </Badge>
              ),
            },
            {
              header: '',
              className: 'text-right',
              cell: (row) => (
                <TableActions
                  onEdit={
                    can('category.update')
                      ? () => router.push(`/admin/categories/${row.id}`)
                      : undefined
                  }
                  onDelete={
                    can('category.delete') ? () => setPendingDeleteCategory(row) : undefined
                  }
                />
              ),
            },
          ]}
        />
      </div>

      <ConfirmDialog
        open={pendingDeleteCategory !== null}
        title={
          pendingDeleteCategory
            ? `Delete ${categoryTranslation(pendingDeleteCategory, 'en')?.name ?? 'this category'}?`
            : ''
        }
        description="Subcategories must be moved or deleted before this category can be deleted. Products in this category will not be deleted, but they will lose this category association."
        confirmLabel="Delete"
        isDestructive
        isLoading={deleteCategory.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteCategory(null)}
      />
    </div>
  );
}
