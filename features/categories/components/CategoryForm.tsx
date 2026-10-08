'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { useMediaUpload } from '@/features/media/hooks/useMediaUpload';
import { MediaUploadField } from '@/features/media/components/MediaUploadField';
import type {
  Category,
  CategoryLocale,
  CategoryTreeNode,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../types';
import { collectSubtreeIds, flattenCategoryTree } from '../types';

const LOCALES: { code: CategoryLocale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'tk', label: 'Türkmençe' },
];

const ROOT_SENTINEL = '__root__';

interface CategoryFormProps {
  mode: 'create' | 'edit';
  tree: CategoryTreeNode[];
  initialCategory?: Category;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmitCreate: (values: CreateCategoryInput) => void;
  onSubmitEdit: (values: UpdateCategoryInput) => void;
}

function emptyNames(): Record<CategoryLocale, string> {
  return { en: '', ru: '', tk: '' };
}

export function CategoryForm({
  mode,
  tree,
  initialCategory,
  isSubmitting,
  onCancel,
  onSubmitCreate,
  onSubmitEdit,
}: CategoryFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pendingMedia, isUploading, error, upload, discard, reset } =
    useMediaUpload('CATEGORY_IMAGE');

  const [names, setNames] = useState<Record<CategoryLocale, string>>(emptyNames());
  const [isActive, setIsActive] = useState(true);
  const [parentId, setParentId] = useState<string | null>(null);
  const [imageMediaId, setImageMediaId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (mode === 'edit' && initialCategory) {
      const next = emptyNames();
      for (const t of initialCategory.translations) next[t.locale] = t.name;
      setNames(next);
      setIsActive(initialCategory.isActive);
      setParentId(initialCategory.parentId);
      setImageUrl(initialCategory.imageUrl ?? '');
    } else {
      setNames(emptyNames());
      setIsActive(true);
      setParentId(null);
      setImageUrl('');
    }
    setImageMediaId(null);
    reset();
  }, [mode, initialCategory]);

  const parentOptions = flattenCategoryTree(
    tree,
    0,
    mode === 'edit' && initialCategory
      ? collectSubtreeIds(tree, initialCategory.id)
      : new Set<string>(),
  );

  async function handleFileSelect(file: File) {
    try {
      const result = await upload(file);
      setImageMediaId(result.id);
    } catch {}
  }

  async function handleCancel() {
    if (pendingMedia) await discard();
    onCancel();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const translations = LOCALES.filter(({ code }) => names[code].trim()).map(({ code }) => ({
      locale: code,
      name: names[code].trim(),
    }));
    const typedUrl = imageUrl.trim() || null;

    if (mode === 'create') {
      onSubmitCreate({
        isActive,
        parentId,
        ...(imageMediaId ? { imageMediaId } : {}),
        ...(imageMediaId ? {} : typedUrl ? { imageUrl: typedUrl } : {}),
        translations,
      });
    } else {
      const parentChanged = parentId !== (initialCategory?.parentId ?? null);
      const imageChanged = typedUrl !== (initialCategory?.imageUrl ?? null);

      let patch: UpdateCategoryInput = { isActive, translations };
      if (imageMediaId) {
        patch = { ...patch, imageMediaId };
      } else if (imageChanged) {
        patch = { ...patch, imageUrl: typedUrl };
      }
      if (parentChanged) patch = { ...patch, parentId };
      onSubmitEdit(patch);
    }
  }

  const hasAtLeastOneName = LOCALES.some(({ code }) => names[code].trim());

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Category Names</CardTitle>
          <CardDescription className="text-xs">
            Enter the category name in English, Russian, and Turkmen.
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
                placeholder={code === 'en' ? 'e.g. Electronics' : undefined}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Parent & Image</CardTitle>
          <CardDescription className="text-xs">
            Set hierarchy and upload an optional cover image.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="parent-category">Parent category</Label>
            <SearchableSelect
              value={parentId ?? ROOT_SENTINEL}
              onValueChange={(v) => setParentId(v === ROOT_SENTINEL ? null : v)}
              options={[
                { value: ROOT_SENTINEL, label: 'No parent (root category)' },
                ...parentOptions.map((opt) => ({ value: opt.id, label: opt.label })),
              ]}
              placeholder="No parent (root category)"
              searchPlaceholder="Search categories…"
              emptyText="No results"
              label="Parent category"
            />
          </div>

          <MediaUploadField
            label="Category Image"
            hint="Upload a file — it's cropped to a category card and stored on MinIO."
            initialUrl={initialCategory?.imageUrl ?? null}
            pendingMedia={pendingMedia}
            isUploading={isUploading}
            error={error}
            aspectClassName="aspect-[2/1]"
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            onRemovePending={() => {
              discard();
              setImageMediaId(null);
            }}
          />

          <div className="space-y-1.5 pt-1">
            <Label htmlFor="category-image-url">Image URL (alternative)</Label>
            <Input
              id="category-image-url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/categories/electronics.webp"
              disabled={!!imageMediaId}
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
            <Label htmlFor="isActive" className="cursor-pointer text-sm font-medium">
              Category is active and visible to customers
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isUploading || !hasAtLeastOneName}>
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create category' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
