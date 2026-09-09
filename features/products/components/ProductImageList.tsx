'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useDeleteProductImageMutation } from '@/features/products/api/mutations';
import { Button } from '@/components/ui/button';
import type { ProductImage } from '@/features/products/types';

/**
 * ⚠️ SADECE SİLME. Mevcut ürüne yeni görsel eklemek için ayrı bir
 * POST /products/:id/images endpoint'i Swagger path listesinde YOK — sadece
 * DELETE var. UpdateProductDto'nun `images` alanı üzerinden PATCH ile
 * eklenebilir gibi görünüyor ama PATCH'in mevcut görselleri SİLİP silmediği
 * (replace mi, append mi) doğrulanmadı — yanlış varsayarsam mevcut görselleri
 * kazayla silebilirim. Bu yüzden "yeni görsel ekle" burada YOK; backend'den
 * bu davranış netleşince eklenecek.
 */
export function ProductImageList({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const deleteImage = useDeleteProductImageMutation(storeId);

  if (images.length === 0) {
    return <p className="text-sm text-ink-muted">No images yet.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {images.map((image) => (
        <div key={image.id} className="group relative overflow-hidden rounded-card border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.cardUrl} alt="" className="aspect-square w-full object-cover" />
          {image.isPrimary && (
            <span className="absolute left-1.5 top-1.5 rounded-sm bg-ink/80 px-1.5 py-0.5 text-[10px] text-white">
              Primary
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() =>
              deleteImage.mutate(
                { productId, imageId: image.id },
                { onSuccess: () => toast.success('Image removed.') },
              )
            }
            aria-label="Delete image"
            className="absolute right-1.5 top-1.5 h-6 w-6 bg-ink/70 text-white opacity-0 hover:bg-ink group-hover:opacity-100"
          >
            <Trash2 size={12} />
          </Button>
        </div>
      ))}
    </div>
  );
}
