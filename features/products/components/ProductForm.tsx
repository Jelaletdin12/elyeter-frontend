'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { ImagePlus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { useAuthStore } from '@/stores/auth-store';
import { adminCategoryTreeOptions } from '@/features/categories/api/queries';
import { brandListOptions } from '@/features/brands/api/queries';
import { brandTranslation } from '@/features/brands/types';
import { flattenCategoryTree } from '@/features/categories/types';
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
  return {
    en: { name: '', description: '' },
    ru: { name: '', description: '' },
    tk: { name: '', description: '' },
  };
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  initialProduct?: Product;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmitCreate: (values: CreateProductInput) => void;
  onSubmitEdit: (values: UpdateProductInput) => void;
}

type ProductPendingMedia = Extract<PendingMedia, { context: 'PRODUCT_IMAGE' }>;

/**
 * Create: translations + category + initial variant (sku/price/initialStock) + multi image.
 * Edit: ONLY translations + category + isActive — variant/stock managed in VariantManager,
 * image deletion in separate list (ProductImageList).
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
  const { data: categoryData } = useQuery(adminCategoryTreeOptions(storeId));
  const { data: brandData } = useQuery(brandListOptions(storeId));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    pendingMediaList,
    isUploading,
    error: uploadError,
    upload,
    discard,
  } = useMediaUpload('PRODUCT_IMAGE');

  const [translations, setTranslations] = useState<TranslationDrafts>(emptyTranslations());
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [attributePairs, setAttributePairs] = useState<{ key: string; value: string }[]>([
    { key: '', value: '' },
  ]);
  const [primaryMediaId, setPrimaryMediaId] = useState<string | null>(null);

  const uploadedImages = useMemo(
    () =>
      pendingMediaList.filter(
        (media): media is ProductPendingMedia => media.context === 'PRODUCT_IMAGE',
      ),
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
      setBrandId(initialProduct.brandId ?? '');
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
      // Handled in useMediaUpload error state
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

      const attributes: Record<string, string> = {};
      for (const { key, value } of attributePairs) {
        if (key.trim()) attributes[key.trim()] = value.trim();
      }

      onSubmitCreate({
        categoryId,
        brandId: brandId.trim() || undefined,
        isActive,
        translations: translationInputs,
        variants: [
          {
            sku,
            price: Number(price),
            initialStock: Number(initialStock),
            lowStockThreshold: 5,
            isActive: true,
            attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
          },
        ],
        images: uploadedImages.map((media) => ({
          mediaId: media.id,
          isPrimary: media.id === effectivePrimaryMediaId,
        })),
      });
    } else {
      onSubmitEdit({
        categoryId,
        brandId: brandId.trim() || undefined,
        isActive,
        translations: translationInputs,
      });
    }
  }

  const canSubmit =
    translations.en.name.trim() !== '' &&
    categoryId !== '' &&
    (mode === 'edit' ||
      (sku.trim() !== '' && price !== '' && initialStock !== '' && uploadedImages.length > 0));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">General Information</CardTitle>
          <CardDescription className="text-xs">
            Assign category and optional brand for this product.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="category">Category *</Label>
            <SearchableSelect
              id="category"
              value={categoryId}
              onValueChange={setCategoryId}
              placeholder="Select a category"
              searchPlaceholder="Search categories…"
              emptyText="No categories"
              label="Category"
              options={flattenCategoryTree(categoryData ?? []).map((opt) => ({
                value: opt.id,
                label: opt.label,
                depth: opt.depth,
                hasChildren: opt.hasChildren,
                isParent: opt.isParent,
                parentId: opt.parentId,
                disabled: !opt.isActive && categoryId !== opt.id,
              }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brand">Brand</Label>
            <SearchableSelect
              value={brandId}
              onValueChange={setBrandId}
              placeholder="Select a brand"
              searchPlaceholder="Search brands…"
              emptyText="No brands"
              label="Brand"
              options={(brandData?.items ?? []).map((brief) => ({
                value: brief.id,
                label: brandTranslation(brief, 'en')?.name ?? brief.translations[0]?.name ?? '—',
                disabled: !brief.isActive && brandId !== brief.id,
              }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Translations</CardTitle>
          <CardDescription className="text-xs">
            Provide product names and descriptions in supported languages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {LOCALES.map(({ code, label }) => (
            <div
              key={code}
              className="border-border/60 bg-muted/20 space-y-3 rounded-lg border p-3.5"
            >
              <Label
                htmlFor={`name-${code}`}
                className="text-muted-foreground text-xs font-medium tracking-wider uppercase"
              >
                {label} {code === 'en' && <span className="text-destructive">*</span>}
              </Label>
              <div className="space-y-2">
                <Input
                  id={`name-${code}`}
                  placeholder={`Product name (${label})`}
                  value={translations[code].name}
                  onChange={(e) =>
                    setTranslations((t) => ({ ...t, [code]: { ...t[code], name: e.target.value } }))
                  }
                />
                <Textarea
                  id={`description-${code}`}
                  aria-label={`Description (${label})`}
                  placeholder={`Description (${label})`}
                  value={translations[code].description}
                  onChange={(e) =>
                    setTranslations((t) => ({
                      ...t,
                      [code]: { ...t[code], description: e.target.value },
                    }))
                  }
                  rows={2}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {mode === 'create' && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Initial Variant & Images</CardTitle>
            <CardDescription className="text-xs">
              Set the initial pricing, stock level, and product images.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  placeholder="e.g. PRD-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="initialStock">Initial Stock *</Label>
                <Input
                  id="initialStock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                />
              </div>
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

            <div className="space-y-3">
              <Label>Product Images *</Label>
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
                      <div className="group border-border bg-muted relative aspect-square overflow-hidden rounded-lg border">
                        <Image
                          src={media.urls.PRODUCT_CARD}
                          alt="Product image preview"
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          unoptimized
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveImage(media.id)}
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
                  className="text-muted-foreground hover:text-foreground flex aspect-square h-auto w-full flex-col items-center justify-center gap-2 border-dashed"
                >
                  <ImagePlus className="size-5" />
                  <span className="text-xs">
                    {isUploading
                      ? 'Uploading…'
                      : uploadedImages.length > 0
                        ? 'Add more'
                        : 'Upload image'}
                  </span>
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Upload one or multiple images. Pick which one should serve as the primary thumbnail.
              </p>
              {uploadError && <p className="text-destructive text-sm font-medium">{uploadError}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
            />
            <Label htmlFor="isActive" className="cursor-pointer text-sm font-medium">
              Product is active and visible to customers
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-2">
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
