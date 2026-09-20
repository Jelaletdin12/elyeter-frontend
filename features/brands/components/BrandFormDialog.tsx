'use client';

import { useState, useEffect, useRef } from 'react';
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
import { useMediaUpload } from '@/features/media/hooks/useMediaUpload';
import { MediaUploadField } from '@/features/media/components/MediaUploadField';
import type {
  Brand,
  BrandLocale,
  BrandTranslationInput,
  CreateBrandInput,
  UpdateBrandInput,
} from '../types';

const LOCALES: { code: BrandLocale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'tk', label: 'Türkmençe' },
];

type BrandFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialBrand?: Brand;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmitCreate: (values: CreateBrandInput) => void;
  onSubmitEdit: (values: UpdateBrandInput) => void;
};

function emptyNames(): Record<BrandLocale, string> {
  return { en: '', ru: '', tk: '' };
}

export function BrandFormDialog({
  open,
  mode,
  initialBrand,
  isSubmitting,
  onCancel,
  onSubmitCreate,
  onSubmitEdit,
}: BrandFormDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pendingMedia, isUploading, error, upload, discard, reset } =
    useMediaUpload('BRAND_IMAGE');

  const [names, setNames] = useState<Record<BrandLocale, string>>(emptyNames());
  const [logoMediaId, setLogoMediaId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (mode === 'edit' && initialBrand) {
      const next = emptyNames();
      for (const t of initialBrand.translations) next[t.locale] = t.name;
      setNames(next);
      setLogoUrl(initialBrand.logoUrl ?? '');
      setIsActive(initialBrand.isActive);
    } else {
      setNames(emptyNames());
      setLogoUrl('');
      setIsActive(true);
    }
    setLogoMediaId(null);
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialBrand, open]);

  async function handleFileSelect(file: File) {
    try {
      const result = await upload(file);
      setLogoMediaId(result.id);
    } catch {
      // Hata zaten useMediaUpload'ın `error` state'inde.
    }
  }

  async function handleCancel() {
    if (pendingMedia) await discard();
    onCancel();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Brand'de parent/SEO otomatik üretimi yok — sadece locale+name zorunlu.
    // slug/metaTitle/metaDescription backend'de name'den üretilir. logoUrl
    // opsiyonel URL string'i (backend zorunlu tutmuyor).
    const translations: BrandTranslationInput[] = LOCALES.filter(({ code }) =>
      names[code].trim(),
    ).map(({ code }) => ({ locale: code, name: names[code].trim() }));

    const typedUrl = logoUrl.trim() || null;
    const base = { isActive, translations };

    if (mode === 'create') {
      onSubmitCreate({
        ...base,
        ...(logoMediaId ? { logoMediaId } : {}),
        ...(logoMediaId ? {} : typedUrl ? { logoUrl: typedUrl } : {}),
      });
    } else {
      let patch: UpdateBrandInput = { ...base };
      if (logoMediaId) {
        // Yeni dosya yüklendi — backend eski MinIO logo object'ini siler (claim akışı).
        patch = { ...patch, logoMediaId };
      } else {
        const logoChanged = typedUrl !== (initialBrand?.logoUrl ?? null);
        if (logoChanged) patch = { ...patch, logoUrl: typedUrl };
      }
      onSubmitEdit(patch);
    }
  }

  const hasAtLeastOneName = LOCALES.some(({ code }) => names[code].trim());

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New brand' : 'Edit brand'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {LOCALES.map(({ code, label }) => (
            <div key={code} className="space-y-1.5">
              <Label htmlFor={`name-${code}`}>
                Name <span className="text-muted-foreground">({label})</span>
              </Label>
              <Input
                id={`name-${code}`}
                value={names[code]}
                onChange={(e) => setNames((n) => ({ ...n, [code]: e.target.value }))}
                placeholder={code === 'en' ? 'Nike' : undefined}
              />
            </div>
          ))}

          <MediaUploadField
            label="Logo"
            hint="Upload a square logo file — it's resized and stored on MinIO."
            initialUrl={initialBrand?.logoUrl ?? null}
            pendingMedia={pendingMedia}
            isUploading={isUploading}
            error={error}
            aspectClassName="aspect-square max-w-[160px]"
            contain
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            onRemovePending={() => {
              discard();
              setLogoMediaId(null);
            }}
          />

          <div className="space-y-1.5">
            <Label htmlFor="brand-logo-url">Logo URL (alternative)</Label>
            <Input
              id="brand-logo-url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logos/nike.webp"
              disabled={!!logoMediaId}
            />
            <p className="text-muted-foreground text-xs">
              Optional. Only if you don&apos;t upload a file above.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="brand-active">Active</Label>
              <p className="text-muted-foreground text-xs">
                Inaktif markalar public sayfalarda listelenmez.
              </p>
            </div>
            <input
              id="brand-active"
              type="checkbox"
              className="accent-primary size-4"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading || !hasAtLeastOneName}
            >
              {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
