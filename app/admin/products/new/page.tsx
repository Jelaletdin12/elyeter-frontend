'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
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
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/products"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft size={14} />
        {t('products.backToProducts', 'Back to products')}
      </Link>

      <h1 className="text-foreground mt-3 font-serif text-2xl italic">
        {t('products.newTitle', 'New product')}
      </h1>

      <div className="mt-6">
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
    </div>
  );
}
