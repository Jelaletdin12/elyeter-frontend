'use client';

import { useState, useEffect, useRef } from 'react';
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
import { useMediaUpload } from '@/features/media/hooks/useMediaUpload';
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

/**
 * Create'de: çeviriler + kategori + ilk varyant (sku/price/initialStock) +
 * tek görsel (primary). Edit'te: SADECE çeviriler + kategori + isActive —
 * varyant/stok yönetimi VariantManager'da, görsel silme ayrı bir listede
 * (bkz. app/admin/products/[id]/page.tsx'teki not: PATCH'in images alanının
 * mevcut görselleri silip silmediği doğrulanmadığı için edit'te görsel
 * ekleme buraya YAZILMADI).
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
  const { pendingMedia, isUploading, error: uploadError, upload, discard } = useMediaUpload('PRODUCT_IMAGE');

  const [translations, setTranslations] = useState<TranslationDrafts>(emptyTranslations());
  const [categoryId, setCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [initialStock, setInitialStock] = useState('');

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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await upload(file);
    } catch {
      // Hata zaten useMediaUpload'ın error state'inde.
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
      if (!pendingMedia || pendingMedia.context !== 'PRODUCT_IMAGE') return;
      onSubmitCreate({
        categoryId,
        isActive,
        translations: translationInputs,
        variants: [{ sku, price: Number(price), initialStock: Number(initialStock) }],
        images: [{ mediaId: pendingMedia.id, isPrimary: true }],
      });
    } else {
      onSubmitEdit({ categoryId, isActive, translations: translationInputs });
    }
  }

  const canSubmit =
    translations.en.name.trim() !== '' &&
    categoryId !== '' &&
    (mode === 'edit' || (sku.trim() !== '' && price !== '' && initialStock !== '' && pendingMedia !== null));

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

      <div className="space-y-4 rounded-card border border-line p-4">
        <p className="text-sm font-medium text-ink">Translations</p>
        {LOCALES.map(({ code, label }) => (
          <div key={code} className="space-y-2">
            <Label htmlFor={`name-${code}`}>
              Name <span className="text-ink-muted">({label})</span>
              {code === 'en' && <span className="text-danger"> *</span>}
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
              className="w-full rounded-card border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-ink/30"
            />
          </div>
        ))}
      </div>

      {mode === 'create' && (
        <div className="space-y-4 rounded-card border border-line p-4">
          <p className="text-sm font-medium text-ink">Initial variant</p>
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

          <div className="space-y-1.5">
            <Label>Image</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            {pendingMedia?.context === 'PRODUCT_IMAGE' ? (
              <div className="relative w-32 overflow-hidden rounded-card border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pendingMedia.urls.PRODUCT_CARD} alt="" className="aspect-square w-full object-cover" />
                <button
                  type="button"
                  onClick={() => discard()}
                  className="absolute inset-0 flex items-center justify-center bg-ink/60 text-xs text-white opacity-0 hover:opacity-100"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex aspect-square w-32 flex-col items-center justify-center gap-1 rounded-card border border-dashed border-line text-ink-muted hover:border-ink/30 disabled:opacity-50"
              >
                <ImagePlus size={18} strokeWidth={1.5} />
                <span className="text-xs">{isUploading ? 'Uploading…' : 'Upload'}</span>
              </button>
            )}
            {uploadError && <p className="text-sm text-danger">{uploadError}</p>}
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-line"
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
