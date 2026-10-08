'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useCreateBrandMutation } from '@/features/brands/api/mutations';
import { BrandForm } from '@/features/brands/components/BrandForm';

export default function NewBrandPage() {
  const router = useRouter();
  const storeId = useAuthStore((s) => s.activeStoreId);
  const createBrand = useCreateBrandMutation(storeId);

  return (
    <div className="mx-auto space-y-6">
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground hover:text-foreground -ml-2 h-8"
        >
          <Link href="/admin/brands">
            <ArrowLeft className="size-4" />
            Back to brands
          </Link>
        </Button>

        <div>
          <h1 className="text-foreground font-serif text-2xl tracking-tight italic">New brand</h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Create a new manufacturer brand entry.
          </p>
        </div>
      </div>

      <BrandForm
        mode="create"
        isSubmitting={createBrand.isPending}
        onCancel={() => router.push('/admin/brands')}
        onSubmitCreate={(values) =>
          createBrand.mutate(values, {
            onSuccess: (brand) => {
              toast.success('Brand created.');
              router.push(`/admin/brands/${brand.id}`);
            },
            onError: () => {
              toast.error('Could not create the brand. Please try again.');
            },
          })
        }
        onSubmitEdit={() => {}}
      />
    </div>
  );
}
