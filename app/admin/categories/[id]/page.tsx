'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth-store';
import {
  adminCategoryDetailOptions,
  adminCategoryTreeOptions,
} from '@/features/categories/api/queries';
import { useUpdateCategoryMutation } from '@/features/categories/api/mutations';
import { CategoryForm } from '@/features/categories/components/CategoryForm';
import { categoryTranslation } from '@/features/categories/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function EditCategoryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const storeId = useAuthStore((s) => s.activeStoreId);

  const {
    data: category,
    isLoading,
    isError,
    refetch,
  } = useQuery(adminCategoryDetailOptions(storeId, params.id));
  const { data: treeData } = useQuery(adminCategoryTreeOptions(storeId));
  const tree = treeData ?? [];
  const updateCategory = useUpdateCategoryMutation(storeId);

  const backButton = (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className="text-muted-foreground hover:text-foreground -ml-2 h-8"
    >
      <Link href="/admin/categories">
        <ArrowLeft className="size-4" />
        Back to categories
      </Link>
    </Button>
  );

  if (isLoading) {
    return (
      <div className="mx-auto space-y-6">
        {backButton}
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto space-y-6">
        {backButton}
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <CardContent className="flex flex-col items-center gap-3 pt-6">
            <AlertCircle className="text-destructive size-8" />
            <p className="text-muted-foreground text-sm font-medium">
              This category couldn&apos;t be loaded.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" /> Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="mx-auto space-y-6">
        {backButton}
        <Card className="p-8 text-center">
          <p className="text-muted-foreground text-sm">Category not found.</p>
        </Card>
      </div>
    );
  }

  const title = categoryTranslation(category, 'en')?.name ?? 'Edit category';

  return (
    <div className="mx-auto space-y-6">
      <div className="space-y-3">
        {backButton}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-foreground font-serif text-2xl tracking-tight italic">{title}</h1>
          <Badge variant={category.isActive ? 'default' : 'secondary'} className="px-2.5 py-0.5">
            {category.isActive ? 'Active' : 'Disabled'}
          </Badge>
        </div>
      </div>

      <CategoryForm
        mode="edit"
        tree={tree}
        initialCategory={category}
        isSubmitting={updateCategory.isPending}
        onCancel={() => router.push('/admin/categories')}
        onSubmitCreate={() => {}}
        onSubmitEdit={(values) =>
          updateCategory.mutate(
            { categoryId: category.id, input: values },
            {
              onSuccess: () => toast.success('Category updated.'),
              onError: () => toast.error('Could not save changes. Please try again.'),
            },
          )
        }
      />
    </div>
  );
}
