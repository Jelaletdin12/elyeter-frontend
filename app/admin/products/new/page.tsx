'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/admin';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useCreateProductMutation } from '@/features/products/api/mutations';
import { ProductForm } from '@/features/products/components/ProductForm';

export default function NewProductPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const storeId = useAuthStore((s) => s.activeStoreId);
  const createProduct = useCreateProductMutation(storeId);

  return (
    <div className="mx-auto space-y-6">
      <div className="space-y-3">
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

        <div>
          <h1 className="text-foreground font-serif text-2xl tracking-tight italic">
            {t('products.newTitle', 'New product')}
          </h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Create a new product item in your store catalog.
          </p>
        </div>
      </div>

      <ProductForm
        mode="create"
        isSubmitting={createProduct.isPending}
        onCancel={() => router.push('/admin/products')}
        onSubmitCreate={(values) =>
          createProduct.mutate(values, {
            onSuccess: (product) => {
              toast.success(t('products.created', 'Product created.'));
              router.push(`/admin/products/${product.id}`);
            },
            onError: () => {
              toast.error(
                t('products.createFailed', 'Could not create the product. Please try again.'),
              );
            },
          })
        }
        onSubmitEdit={() => {}}
      />
    </div>
  );
}
