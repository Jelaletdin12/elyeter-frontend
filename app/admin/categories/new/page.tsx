'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useCreateCategoryMutation } from '@/features/categories/api/mutations';
import { adminCategoryTreeOptions } from '@/features/categories/api/queries';
import { CategoryForm } from '@/features/categories/components/CategoryForm';

export default function NewCategoryPage() {
  const router = useRouter();
  const storeId = useAuthStore((s) => s.activeStoreId);
  const createCategory = useCreateCategoryMutation(storeId);
  const { data: treeData } = useQuery(adminCategoryTreeOptions(storeId));
  const tree = treeData ?? [];

  return (
    <div className="mx-auto space-y-6">
      <div className="space-y-3">
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

        <div>
          <h1 className="text-foreground font-serif text-2xl tracking-tight italic">
            New category
          </h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Create a new category node to organize products.
          </p>
        </div>
      </div>

      <CategoryForm
        mode="create"
        tree={tree}
        isSubmitting={createCategory.isPending}
        onCancel={() => router.push('/admin/categories')}
        onSubmitCreate={(values) =>
          createCategory.mutate(values, {
            onSuccess: (category) => {
              toast.success('Category created.');
              router.push(`/admin/categories/${category.id}`);
            },
            onError: () => {
              toast.error('Could not create the category. Please try again.');
            },
          })
        }
        onSubmitEdit={() => {}}
      />
    </div>
  );
}
