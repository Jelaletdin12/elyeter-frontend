'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

interface BrandFormProps {
  mode: 'create' | 'edit';
  initialBrand?: Brand;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmitCreate: (values: CreateBrandInput) => void;
  onSubmitEdit: (values: UpdateBrandInput) => void;
}

function emptyNames(): Record<BrandLocale, string> {
  return { en: '', ru: '', tk: '' };
}

export function BrandForm({
  mode,
  initialBrand,
  isSubmitting,
  onCancel,
  onSubmitCreate,
  onSubmitEdit,
}: BrandFormProps) {
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
  }, [mode, initialBrand]);

  async function handleFileSelect(file: File) {
    try {
      const result = await upload(file);
      setLogoMediaId(result.id);
    } catch {
      // Captured in useMediaUpload error state
    }
  }

  async function handleCancel() {
    if (pendingMedia) await discard();
    onCancel();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Brand Names</CardTitle>
          <CardDescription className="text-xs">
            Enter the brand name in English, Russian, and Turkmen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {LOCALES.map(({ code, label }) => (
            <div key={code} className="space-y-1.5">
              <Label htmlFor={`name-${code}`}>
                Name <span className="text-muted-foreground">({label})</span>
                {code === 'en' && <span className="text-destructive"> *</span>}
              </Label>
              <Input
                id={`name-${code}`}
                value={names[code]}
                onChange={(e) => setNames((n) => ({ ...n, [code]: e.target.value }))}
                placeholder={code === 'en' ? 'e.g. Nike' : undefined}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Brand Logo</CardTitle>
          <CardDescription className="text-xs">
            Upload a square logo image for this brand.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
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

          <div className="space-y-1.5 pt-1">
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="isActive" className="cursor-pointer text-sm font-medium">
                Brand is active
              </Label>
              <p className="text-muted-foreground text-xs">
                Inactive brands will not be shown on public store pages.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isUploading || !hasAtLeastOneName}>
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create brand' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
