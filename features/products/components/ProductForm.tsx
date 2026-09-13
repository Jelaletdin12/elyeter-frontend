'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useAuthStore } from '@/stores/auth-store';
import { categoryListOptions } from '@/features/categories/api/queries';
import { categoryTranslation } from '@/features/categories/types';
import { useMediaUpload, type PendingMedia } from '@/features/media/hooks/useMediaUpload';
import type { Product, CreateProductInput, UpdateProductInput } from '../types';

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'tk', label: 'Türkmençe' },
] as const;

type TranslationDraft = { name: string; description: string };
type TranslationDrafts = Record<'en' | 'ru' | 'tk', TranslationDraft>;

function emptyTranslations(): TranslationDrafts {
  return { en: { name: '', description: '' }, ru: { name: '', description: '' }, tk: { name: '', description: '' } };
}

type ProductFormProps = {
  mode: 'create' | 'edit';
  initialProduct?: Product;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmitCreate: (values: CreateProductInput) => void;
  onSubmitEdit: (values: UpdateProductInput) => void;
};

type ProductPendingMedia = Extract<PendingMedia, { context: 'PRODUCT_IMAGE' }>;

/**
 * Create'de: çeviriler + kategori + ilk varyant (sku/price/initialStock) +
 * coklu gorsel. Edit'te: SADECE ceviriler + kategori + isActive —
 * varyant/stok yonetimi VariantManager'da, gorsel silme ayri bir listede
 * (bkz. app/admin/products/[id]/page.tsx'teki not: PATCH'in images alaninin
 * mevcut gorselleri silip silmedigi dogrulanmadigi icin edit'te gorsel
 * ekleme buraya yazilmadi).
 */
export function ProductForm({
  mode,
  initialProduct,
  isSubmitting,
  onCancel,
  onSubmitCreate,
  onSubmitEdit,
}: ProductFormProps) {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const { data: categoryData } = useQuery(categoryListOptions(storeId));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pendingMediaList, isUploading, error: uploadError, upload, discard } = useMediaUpload('PRODUCT_IMAGE');

  const [translations, setTranslations] = useState<TranslationDrafts>(emptyTranslations());
  const [categoryId, setCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [primaryMediaId, setPrimaryMediaId] = useState<string | null>(null);

  const uploadedImages = useMemo(
    () => pendingMediaList.filter((media): media is ProductPendingMedia => media.context === 'PRODUCT_IMAGE'),
    [pendingMediaList],
  );

  const effectivePrimaryMediaId = useMemo(() => {
    if (primaryMediaId && uploadedImages.some((media) => media.id === primaryMediaId)) {
      return primaryMediaId;
    }
    return uploadedImages[0]?.id ?? null;
  }, [primaryMediaId, uploadedImages]);

  useEffect(() => {
    if (mode === 'edit' && initialProduct) {
      const next = emptyTranslations();
      for (const t of initialProduct.translations) {
        next[t.locale as 'en' | 'ru' | 'tk'] = { name: t.name, description: t.description ?? '' };
      }
      setTranslations(next);
      setCategoryId(initialProduct.categoryId);
      setIsActive(initialProduct.isActive);
    }
  }, [mode, initialProduct]);

  useEffect(() => {
    if (mode !== 'create') return;
    if (primaryMediaId && uploadedImages.some((media) => media.id === primaryMediaId)) return;
    setPrimaryMediaId(uploadedImages[0]?.id ?? null);
  }, [mode, primaryMediaId, uploadedImages]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    try {
      for (const file of files) {
        await upload(file);
      }
    } catch {
      // Hata zaten useMediaUpload'ın error state'inde.
    } finally {
      e.target.value = '';
    }
  }

  async function handleRemoveImage(mediaId: string) {
    await discard(mediaId);
    if (primaryMediaId === mediaId) {
      const nextPrimary = uploadedImages.find((media) => media.id !== mediaId)?.id ?? null;
      setPrimaryMediaId(nextPrimary);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const translationInputs = LOCALES.filter(({ code }) => translations[code].name.trim()).map(
      ({ code }) => ({
        locale: code,
        name: translations[code].name.trim(),
        description: translations[code].description.trim() || undefined,
      }),
    );

    if (mode === 'create') {
      if (uploadedImages.length === 0) return;
      onSubmitCreate({
        categoryId,
        isActive,
        translations: translationInputs,
        variants: [
          {
            sku,
            price: Number(price),
            initialStock: Number(initialStock),
            lowStockThreshold: 5,
            isActive: true,
          },
        ],
        images: uploadedImages.map((media) => ({
          mediaId: media.id,
          isPrimary: media.id === effectivePrimaryMediaId,
        })),
      });
    } else {
      onSubmitEdit({ categoryId, isActive, translations: translationInputs });
    }
  }

  const canSubmit =
    translations.en.name.trim() !== '' &&
    categoryId !== '' &&
    (mode === 'edit' || (sku.trim() !== '' && price !== '' && initialStock !== '' && uploadedImages.length > 0));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="category">Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categoryData?.items.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {categoryTranslation(category, 'en')?.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 rounded-md border border-border p-4">
        <p className="text-sm font-medium text-foreground">Translations</p>
        {LOCALES.map(({ code, label }) => (
          <div key={code} className="space-y-2">
            <Label htmlFor={`name-${code}`}>
              Name <span className="text-muted-foreground">({label})</span>
              {code === 'en' && <span className="text-destructive"> *</span>}
            </Label>
            <Input
              id={`name-${code}`}
              value={translations[code].name}
              onChange={(e) =>
                setTranslations((t) => ({ ...t, [code]: { ...t[code], name: e.target.value } }))
              }
            />
            <textarea
              placeholder={`Description (${label})`}
              value={translations[code].description}
              onChange={(e) =>
                setTranslations((t) => ({ ...t, [code]: { ...t[code], description: e.target.value } }))
              }
              rows={2}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
        ))}
      </div>

      {mode === 'create' && (
        <div className="space-y-4 rounded-md border border-border p-4">
          <p className="text-sm font-medium text-foreground">Initial variant</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="initialStock">Stock</Label>
              <Input
                id="initialStock"
                type="number"
                min="0"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Images</Label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {uploadedImages.map((media) => {
                const isPrimaryImage = media.id === effectivePrimaryMediaId;

                return (
                  <div key={media.id} className="space-y-2">
                    <div className="group relative overflow-hidden rounded-md border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={media.urls.PRODUCT_CARD} alt="" className="aspect-square w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(media.id)}
                        className="absolute inset-0 flex items-center justify-center bg-ink/60 text-xs text-white opacity-0 hover:opacity-100 group-hover:opacity-100"
                      >
                        Remove
                      </button>
                      {isPrimaryImage && (
                        <span className="absolute left-1.5 top-1.5 rounded-sm bg-ink/80 px-1.5 py-0.5 text-[10px] text-white">
                          Primary
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant={isPrimaryImage ? 'default' : 'outline'}
                      size="sm"
                      className="w-full"
                      onClick={() => setPrimaryMediaId(media.id)}
                    >
                      {isPrimaryImage ? 'Primary image' : 'Make primary'}
                    </Button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground hover:border-ink/30 disabled:opacity-50"
              >
                <ImagePlus size={18} strokeWidth={1.5} />
                <span className="text-xs">{isUploading ? 'Uploading…' : uploadedImages.length > 0 ? 'Add more' : 'Upload'}</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground">You can upload multiple images and choose which one is primary.</p>
            {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        Active
      </label>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !canSubmit}>
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create product' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
