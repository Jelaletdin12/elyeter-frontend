'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth-store';
import { adminBrandDetailOptions } from '@/features/brands/api/queries';
import { useUpdateBrandMutation } from '@/features/brands/api/mutations';
import { BrandForm } from '@/features/brands/components/BrandForm';
import { brandTranslation } from '@/features/brands/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function EditBrandPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const storeId = useAuthStore((s) => s.activeStoreId);

  const {
    data: brand,
    isLoading,
    isError,
    refetch,
  } = useQuery(adminBrandDetailOptions(storeId, params.id));
  const updateBrand = useUpdateBrandMutation(storeId);

  const backButton = (
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
              This brand couldn&apos;t be loaded.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" /> Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        {backButton}
        <Card className="p-8 text-center">
          <p className="text-muted-foreground text-sm">Brand not found.</p>
        </Card>
      </div>
    );
  }

  const title = brandTranslation(brand, 'en')?.name ?? 'Edit brand';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-3">
        {backButton}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-foreground font-serif text-2xl tracking-tight italic">{title}</h1>
          <Badge variant={brand.isActive ? 'default' : 'secondary'} className="px-2.5 py-0.5">
            {brand.isActive ? 'Active' : 'Disabled'}
          </Badge>
        </div>
      </div>

      <BrandForm
        mode="edit"
        initialBrand={brand}
        isSubmitting={updateBrand.isPending}
        onCancel={() => router.push('/admin/brands')}
        onSubmitCreate={() => {}}
        onSubmitEdit={(values) =>
          updateBrand.mutate(
            { brandId: brand.id, input: values },
            {
              onSuccess: () => toast.success('Brand updated.'),
              onError: () => toast.error('Could not save changes. Please try again.'),
            },
          )
        }
      />
    </div>
  );
}
