'use client';

import { useMemo, useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useMediaUpload, type PendingMedia } from '@/features/media/hooks/useMediaUpload';
import {
  useDeleteProductImageMutation,
  useUpdateProductMutation,
} from '@/features/products/api/mutations';
import { Button } from '@/components/ui/button';
import type { ProductImage } from '@/features/products/types';

type ProductPendingMedia = Extract<PendingMedia, { context: 'PRODUCT_IMAGE' }>;

export function ProductImageList({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
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
    <div className="space-y-4">
      <div className="border-border space-y-2 rounded-md border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-foreground text-sm font-medium">Add images</p>
            <p className="text-muted-foreground text-xs">
              New images are appended to the product. Existing ones stay until deleted.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || updateProduct.isPending}
          >
            <ImagePlus size={16} />
            {isUploading ? 'Uploading…' : 'Select images'}
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {uploadedImages.length > 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {uploadedImages.map((image) => {
                const isPrimaryCandidate = image.id === effectivePrimaryMediaId;

                return (
                  <div key={image.id} className="space-y-2">
                    <div className="group border-border relative overflow-hidden rounded-md border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.urls.PRODUCT_CARD}
                        alt=""
                        className="aspect-square w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePending(image.id)}
                        className="bg-ink/60 absolute inset-0 flex items-center justify-center text-xs text-white opacity-0 group-hover:opacity-100 hover:opacity-100"
                      >
                        Remove
                      </button>
                      {isPrimaryCandidate && (
                        <span className="bg-ink/80 absolute top-1.5 left-1.5 rounded-sm px-1.5 py-0.5 text-[10px] text-white">
                          Primary
                        </span>
                      )}
                    </div>

                    {images.length === 0 && (
                      <Button
                        type="button"
                        variant={isPrimaryCandidate ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
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
              <Button type="button" onClick={handleAppendImages} disabled={updateProduct.isPending}>
                {updateProduct.isPending ? 'Saving…' : 'Append images'}
              </Button>
            </div>
          </div>
        )}

        {uploadError && <p className="text-destructive text-sm">{uploadError}</p>}
      </div>

      {images.length === 0 ? (
        <p className="text-muted-foreground text-sm">No images yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group border-border relative overflow-hidden rounded-md border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.cardUrl} alt="" className="aspect-square w-full object-cover" />
              {image.isPrimary && (
                <span className="bg-ink/80 absolute top-1.5 left-1.5 rounded-sm px-1.5 py-0.5 text-[10px] text-white">
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
                className="bg-ink/70 hover:bg-ink absolute top-1.5 right-1.5 h-6 w-6 text-white opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={12} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
