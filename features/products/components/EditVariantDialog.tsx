'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useMediaUpload, type PendingMedia } from '@/features/media/hooks/useMediaUpload';
import type { ProductVariant, UpdateProductVariantInput } from '../types';

type VariantPendingMedia = Extract<PendingMedia, { context: 'VARIANT_IMAGE' }>;

interface EditVariantDialogProps {
  variant: ProductVariant;
  open: boolean;
  isSubmitting: boolean;
  isDeletingImage: boolean;
  onCancel: () => void;
  onSubmit: (input: UpdateProductVariantInput) => void;
  onDeleteImage: (imageId: string) => void;
}

/**
 * Variant edit dialog: SKU/price/compare-at/isActive + freeform attributes +
 * variant image management ("önce yükle, sonra bağla" — yüklenen görseller
 * `images: [{ mediaId, isPrimary }]` olarak aynı PATCH isteğinde claim edilir).
 */
export function EditVariantDialog({
  variant,
  open,
  isSubmitting,
  isDeletingImage,
  onCancel,
  onSubmit,
  onDeleteImage,
}: EditVariantDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    pendingMediaList,
    isUploading,
    error: uploadError,
    upload,
    discard,
  } = useMediaUpload('VARIANT_IMAGE');

  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [attributePairs, setAttributePairs] = useState<{ key: string; value: string }[]>([]);
  const [primaryMediaId, setPrimaryMediaId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSku(variant.sku);
    setPrice(String(variant.price));
    setCompareAtPrice(variant.compareAtPrice != null ? String(variant.compareAtPrice) : '');
    setIsActive(variant.isActive);
    setAttributePairs(
      Object.keys(variant.attributes).length > 0
        ? Object.entries(variant.attributes).map(([key, value]) => ({ key, value }))
        : [{ key: '', value: '' }],
    );
    setPrimaryMediaId(null);
  }, [open, variant]);

  const uploadedImages = useMemo(
    () =>
      pendingMediaList.filter(
        (media): media is VariantPendingMedia => media.context === 'VARIANT_IMAGE',
      ),
    [pendingMediaList],
  );

  const effectivePrimaryMediaId = useMemo(() => {
    if (primaryMediaId && uploadedImages.some((media) => media.id === primaryMediaId)) {
      return primaryMediaId;
    }
    return uploadedImages[0]?.id ?? null;
  }, [primaryMediaId, uploadedImages]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    try {
      for (const file of files) {
        await upload(file);
      }
    } catch {
      // handled in useMediaUpload error state
    } finally {
      e.target.value = '';
    }
  }

  async function handleRemoveUpload(mediaId: string) {
    await discard(mediaId);
    if (primaryMediaId === mediaId) {
      setPrimaryMediaId(uploadedImages.find((media) => media.id !== mediaId)?.id ?? null);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const attributes: Record<string, string> = {};
    for (const { key, value } of attributePairs) {
      if (key.trim()) attributes[key.trim()] = value.trim();
    }

    onSubmit({
      sku: sku.trim(),
      price: Number(price),
      compareAtPrice: compareAtPrice !== '' ? Number(compareAtPrice) : undefined,
      isActive,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      images: uploadedImages.map((media) => ({
        mediaId: media.id,
        isPrimary: media.id === effectivePrimaryMediaId,
      })),
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Edit variant</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-variant-sku">SKU *</Label>
              <Input
                id="edit-variant-sku"
                required
                placeholder="PRD-BLK-M"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-variant-price">Price *</Label>
              <Input
                id="edit-variant-price"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-variant-compare-price">
              Compare-at price <span className="text-muted-foreground text-xs">(opt)</span>
            </Label>
            <Input
              id="edit-variant-compare-price"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 349.99"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Attributes
            </Label>
            <div className="space-y-2">
              {attributePairs.map((pair, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Attribute (e.g. Color)"
                    value={pair.key}
                    onChange={(e) =>
                      setAttributePairs((prev) =>
                        prev.map((p, idx) => (idx === i ? { ...p, key: e.target.value } : p)),
                      )
                    }
                  />
                  <Input
                    placeholder="Value (e.g. Red)"
                    value={pair.value}
                    onChange={(e) =>
                      setAttributePairs((prev) =>
                        prev.map((p, idx) => (idx === i ? { ...p, value: e.target.value } : p)),
                      )
                    }
                  />
                  {attributePairs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setAttributePairs((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      aria-label="Remove attribute"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAttributePairs((prev) => [...prev, { key: '', value: '' }])}
              className="mt-1 gap-1 text-xs"
            >
              <Plus className="size-3.5" /> Add attribute
            </Button>
          </div>

          <div className="border-border/60 bg-muted/20 flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div>
              <Label htmlFor="edit-variant-active" className="cursor-pointer text-sm font-medium">
                Variant is active
              </Label>
              <p className="text-muted-foreground text-xs">Deactivated variants cannot be sold.</p>
            </div>
            <Checkbox
              id="edit-variant-active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Variant images
            </Label>

            {(variant.images ?? []).length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(variant.images ?? []).map((variantImage) => (
                  <div key={variantImage.id} className="space-y-2">
                    <div className="group border-border bg-muted relative aspect-square overflow-hidden rounded-lg border">
                      <Image
                        src={variantImage.cardUrl}
                        alt="Variant image"
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover"
                        unoptimized
                      />
                      {variantImage.isPrimary && (
                        <Badge
                          variant="default"
                          className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] shadow-xs"
                        >
                          Primary
                        </Badge>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={isDeletingImage}
                          onClick={() => onDeleteImage(variantImage.id)}
                          className="h-8 gap-1 px-3 text-xs"
                        >
                          <X className="size-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {uploadedImages.map((media) => {
                const isPrimaryImage = media.id === effectivePrimaryMediaId;
                return (
                  <div key={media.id} className="space-y-2">
                    <div className="group border-border bg-muted relative aspect-square overflow-hidden rounded-lg border">
                      <Image
                        src={media.urls.PRODUCT_CARD}
                        alt="New variant image preview"
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveUpload(media.id)}
                          className="h-8 gap-1 px-3 text-xs"
                        >
                          <X className="size-3.5" />
                          Remove
                        </Button>
                      </div>
                      {isPrimaryImage && (
                        <Badge
                          variant="default"
                          className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] shadow-xs"
                        >
                          Primary
                        </Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant={isPrimaryImage ? 'default' : 'outline'}
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setPrimaryMediaId(media.id)}
                    >
                      {isPrimaryImage ? 'Primary image' : 'Make primary'}
                    </Button>
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-muted-foreground hover:text-foreground flex aspect-square h-full w-full flex-col items-center justify-center gap-2 border-dashed"
              >
                <Plus className="size-5" />
                <span className="text-xs">{isUploading ? 'Uploading…' : 'Add image'}</span>
              </Button>
            </div>

            <p className="text-muted-foreground text-xs">
              New uploads are attached to this variant when you save. The primary image is shown on
              the product detail page when this variant is selected.
            </p>
            {uploadError && <p className="text-destructive text-sm font-medium">{uploadError}</p>}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !sku || !price || isUploading}>
              {isSubmitting ? 'Saving…' : 'Save variant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
