'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { adminProductDetailOptions } from '@/features/products/api/queries';
import { useUpdateProductMutation } from '@/features/products/api/mutations';
import { ProductForm } from '@/features/products/components/ProductForm';
import { VariantManager } from '@/features/products/components/VariantManager';
import { ProductImageList } from '@/features/products/components/ProductImageList';

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const storeId = useAuthStore((s) => s.activeStoreId);

  const { data: product, isLoading } = useQuery(adminProductDetailOptions(storeId, params.id));
  const updateProduct = useUpdateProductMutation(storeId);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 rounded-card bg-paper" />
        <div className="h-64 rounded-card bg-paper" />
      </div>
    );
  }

  if (!product) {
    return <p className="text-sm text-ink-muted">Product not found.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <h1 className="font-display text-2xl italic text-ink">
          {product.translations.find((t) => t.locale === 'en')?.name}
        </h1>
        <p className="mt-1 text-xs text-ink-muted">{product.viewCount} views</p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-ink">Basic info</h2>
        <ProductForm
          mode="edit"
          initialProduct={product}
          isSubmitting={updateProduct.isPending}
          onCancel={() => router.push('/admin/products')}
          onSubmitCreate={() => {}}
          onSubmitEdit={(values) =>
            updateProduct.mutate(
              { productId: product.id, input: values },
              { onSuccess: () => toast.success('Product updated.') },
            )
          }
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-ink">Images</h2>
        <ProductImageList productId={product.id} images={product.images} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-ink">Inventory</h2>
        <VariantManager productId={product.id} variants={product.variants} />
      </div>
    </div>
  );
}
