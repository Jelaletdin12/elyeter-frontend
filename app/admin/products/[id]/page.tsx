'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/admin';
import { toast } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth-store';
import { adminProductDetailOptions } from '@/features/products/api/queries';
import { useUpdateProductMutation } from '@/features/products/api/mutations';
import { ProductForm } from '@/features/products/components/ProductForm';
import { VariantManager } from '@/features/products/components/VariantManager';
import { ProductImageList } from '@/features/products/components/ProductImageList';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

  const backButton = (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className="text-muted-foreground hover:text-foreground -ml-2 h-8"
    >
      <Link href="/admin/products">
        <ArrowLeft className="size-4" />
        {t('products.backToProducts', 'Back to products')}
      </Link>
    </Button>
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
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
      <div className="mx-auto max-w-4xl space-y-6">
        {backButton}
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <CardContent className="flex flex-col items-center gap-3 pt-6">
            <AlertCircle className="text-destructive size-8" />
            <p className="text-muted-foreground text-sm font-medium">
              {t('products.loadFailed', "This product couldn't be loaded.")}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" />
              {t('common.retry', 'Try again')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        {backButton}
        <Card className="p-8 text-center">
          <p className="text-muted-foreground text-sm">
            {t('products.notFound', 'Product not found.')}
          </p>
        </Card>
      </div>
    );
  }

  const productName =
    product.translations.find((tr) => tr.locale === 'en')?.name ?? 'Product details';

  return (
    <div className="mx-auto space-y-10">
      <div className="space-y-3">
        {backButton}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-foreground font-serif text-2xl tracking-tight italic">
              {productName}
            </h1>
            <p className="text-muted-foreground mt-1 text-xs">
              {t('products.viewCount', '{{count}} views', { count: product.viewCount })}
            </p>
          </div>
          <Badge variant={product.isActive ? 'default' : 'secondary'} className="px-2.5 py-0.5">
            {product.isActive ? 'Active' : 'Draft'}
          </Badge>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-foreground text-sm font-semibold tracking-wider uppercase">
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
      </section>

      <section className="space-y-4">
        <h2 className="text-foreground text-sm font-semibold tracking-wider uppercase">
          {t('products.images', 'Images')}
        </h2>
        <ProductImageList productId={product.id} images={product.images} />
      </section>

      <section className="space-y-4">
        <h2 className="text-foreground text-sm font-semibold tracking-wider uppercase">
          {t('products.inventory', 'Inventory')}
        </h2>
        <VariantManager productId={product.id} variants={product.variants} />
      </section>
    </div>
  );
}
