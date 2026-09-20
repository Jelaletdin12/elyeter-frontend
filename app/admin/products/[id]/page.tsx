'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth-store';
import { adminProductDetailOptions } from '@/features/products/api/queries';
import { useUpdateProductMutation } from '@/features/products/api/mutations';
import { ProductForm } from '@/features/products/components/ProductForm';
import { VariantManager } from '@/features/products/components/VariantManager';
import { ProductImageList } from '@/features/products/components/ProductImageList';
import { Button } from '@/components/ui/button';

export default function EditProductPage() {
  const { t } = useTranslation();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const storeId = useAuthStore((s) => s.activeStoreId);

  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useQuery(adminProductDetailOptions(storeId, params.id));
  const updateProduct = useUpdateProductMutation(storeId);

  const BackLink = (
    <Link
      href="/admin/products"
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
    >
      <ArrowLeft size={14} />
      {t('products.backToProducts', 'Back to products')}
    </Link>
  );

  if (isLoading) {
    return (
      <div className="mx-auto space-y-6">
        {BackLink}
        <div className="animate-pulse space-y-4">
          <div className="bg-background h-8 w-64 rounded-md" />
          <div className="bg-background h-64 rounded-md" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto space-y-6">
        {BackLink}
        <div className="border-border bg-background flex flex-col items-center justify-center gap-3 rounded-md border py-16 text-center">
          <p className="text-muted-foreground text-sm">
            {t('products.loadFailed', "This product couldn't be loaded.")}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} /> {t('common.retry', 'Try again')}
          </Button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto space-y-6">
        {BackLink}
        <p className="text-muted-foreground text-sm">
          {t('products.notFound', 'Product not found.')}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-10">
      <div className="space-y-3">
        {BackLink}
        <div>
          <h1 className="text-foreground font-serif text-2xl italic">
            {product.translations.find((tr) => tr.locale === 'en')?.name}
          </h1>
          <p className="text-muted-foreground mt-1 text-xs">
            {t('products.viewCount', '{{count}} views', { count: product.viewCount })}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-foreground mb-3 text-sm font-medium">
          {t('products.basicInfo', 'Basic info')}
        </h2>
        <ProductForm
          mode="edit"
          initialProduct={product}
          isSubmitting={updateProduct.isPending}
          onCancel={() => router.push('/admin/products')}
          onSubmitCreate={() => {}}
          onSubmitEdit={(values) =>
            updateProduct.mutate(
              { productId: product.id, input: values },
              {
                onSuccess: () => toast.success(t('products.updated', 'Product updated.')),
                onError: () =>
                  toast.error(
                    t('products.updateFailed', 'Could not save changes. Please try again.'),
                  ),
              },
            )
          }
        />
      </div>

      <div>
        <h2 className="text-foreground mb-3 text-sm font-medium">
          {t('products.images', 'Images')}
        </h2>
        <ProductImageList productId={product.id} images={product.images} />
      </div>

      <div>
        <h2 className="text-foreground mb-3 text-sm font-medium">
          {t('products.inventory', 'Inventory')}
        </h2>
        <VariantManager productId={product.id} variants={product.variants} />
      </div>
    </div>
  );
}
