'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Trash2, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useMediaUpload, type PendingMedia } from '@/features/media/hooks/useMediaUpload';
import {
  useDeleteProductImageMutation,
  useUpdateProductMutation,
} from '@/features/products/api/mutations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProductImage } from '@/features/products/types';

type ProductPendingMedia = Extract<PendingMedia, { context: 'PRODUCT_IMAGE' }>;

interface ProductImageListProps {
  productId: string;
  images: ProductImage[];
}

export function ProductImageList({ productId, images }: ProductImageListProps) {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deleteImage = useDeleteProductImageMutation(storeId);
  const updateProduct = useUpdateProductMutation(storeId);
  const {
    pendingMediaList,
    isUploading,
    error: uploadError,
    upload,
    discard,
    reset,
  } = useMediaUpload('PRODUCT_IMAGE');
  const [primaryMediaId, setPrimaryMediaId] = useState<string | null>(null);

  const uploadedImages = useMemo(
    () =>
      pendingMediaList.filter(
        (media): media is ProductPendingMedia => media.context === 'PRODUCT_IMAGE',
      ),
    [pendingMediaList],
  );

  const effectivePrimaryMediaId = useMemo(() => {
    if (images.length > 0) return null;
    if (primaryMediaId && uploadedImages.some((media) => media.id === primaryMediaId)) {
      return primaryMediaId;
    }
    return uploadedImages[0]?.id ?? null;
  }, [images.length, primaryMediaId, uploadedImages]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    try {
      for (const file of files) {
        await upload(file);
      }
    } catch {
      // Hata hook state'inde tutuluyor.
    } finally {
      e.target.value = '';
    }
  }

  async function handleRemovePending(mediaId: string) {
    await discard(mediaId);
    if (primaryMediaId === mediaId) {
      const nextPrimary = uploadedImages.find((media) => media.id !== mediaId)?.id ?? null;
      setPrimaryMediaId(nextPrimary);
    }
  }

  function handleAppendImages() {
    if (uploadedImages.length === 0) return;

    updateProduct.mutate(
      {
        productId,
        input: {
          images: uploadedImages.map((media) => ({
            mediaId: media.id,
            isPrimary: images.length === 0 && media.id === effectivePrimaryMediaId,
          })),
        },
      },
      {
        onSuccess: () => {
          reset();
          setPrimaryMediaId(null);
          toast.success('Images added.');
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-4">
          <div>
            <CardTitle className="text-base font-semibold">Add images</CardTitle>
            <CardDescription className="text-xs">
              New images are appended to the product. Existing ones stay until deleted.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || updateProduct.isPending}
          >
            <ImagePlus className="size-4" />
            {isUploading ? 'Uploading…' : 'Select images'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {uploadedImages.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {uploadedImages.map((image) => {
                  const isPrimaryCandidate = image.id === effectivePrimaryMediaId;

                  return (
                    <div key={image.id} className="space-y-2">
                      <div className="group border-border bg-muted relative aspect-square overflow-hidden rounded-lg border">
                        <Image
                          src={image.urls.PRODUCT_CARD}
                          alt="Pending upload preview"
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          unoptimized
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemovePending(image.id)}
                            className="h-8 gap-1 px-3 text-xs"
                          >
                            <X className="size-3.5" />
                            Remove
                          </Button>
                        </div>
                        {isPrimaryCandidate && (
                          <Badge
                            variant="default"
                            className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] shadow-xs"
                          >
                            Primary
                          </Badge>
                        )}
                      </div>

                      {images.length === 0 && (
                        <Button
                          type="button"
                          variant={isPrimaryCandidate ? 'default' : 'outline'}
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => setPrimaryMediaId(image.id)}
                        >
                          {isPrimaryCandidate ? 'Primary image' : 'Make primary'}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleAppendImages}
                  disabled={updateProduct.isPending}
                >
                  {updateProduct.isPending ? 'Saving…' : 'Append images'}
                </Button>
              </div>
            </div>
          )}

          {uploadError && <p className="text-destructive text-sm font-medium">{uploadError}</p>}
        </CardContent>
      </Card>

      {images.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground text-sm">No images yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group border-border bg-muted relative aspect-square overflow-hidden rounded-lg border"
            >
              <Image
                src={image.cardUrl}
                alt="Product image"
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                unoptimized
              />
              {image.isPrimary && (
                <Badge
                  variant="default"
                  className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] shadow-xs"
                >
                  Primary
                </Badge>
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                onClick={() =>
                  deleteImage.mutate(
                    { productId, imageId: image.id },
                    { onSuccess: () => toast.success('Image removed.') },
                  )
                }
                aria-label="Delete image"
                className="absolute top-2 right-2 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
