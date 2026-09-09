'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useCreateProductMutation } from '@/features/products/api/mutations';
import { ProductForm } from '@/features/products/components/ProductForm';

export default function NewProductPage() {
  const router = useRouter();
  const storeId = useAuthStore((s) => s.activeStoreId);
  const createProduct = useCreateProductMutation(storeId);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl italic text-ink">New product</h1>

      <div className="mt-6">
        <ProductForm
          mode="create"
          isSubmitting={createProduct.isPending}
          onCancel={() => router.push('/admin/products')}
          onSubmitCreate={(values) =>
            createProduct.mutate(values, {
              onSuccess: (product) => {
                toast.success('Product created.');
                router.push(`/admin/products/${product.id}`);
              },
            })
          }
          onSubmitEdit={() => {}}
        />
      </div>
    </div>
  );
}
