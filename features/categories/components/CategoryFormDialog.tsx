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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

type CategoryFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  /** Hiyerarşik parent selector için GET /categories/tree yanıtı. */
  tree: CategoryTreeNode[];
  initialCategory?: Category;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmitCreate: (values: CreateCategoryInput) => void;
  onSubmitEdit: (values: UpdateCategoryInput) => void;
};

function emptyNames(): Record<CategoryLocale, string> {
  return { en: '', ru: '', tk: '' };
}

export function CategoryFormDialog({
  open,
  mode,
  tree,
  initialCategory,
  isSubmitting,
  onCancel,
  onSubmitCreate,
  onSubmitEdit,
}: CategoryFormDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pendingMedia, isUploading, error, upload, discard, reset } =
    useMediaUpload('CATEGORY_IMAGE');

  const [names, setNames] = useState<Record<CategoryLocale, string>>(emptyNames());
  const [isActive, setIsActive] = useState(true);
  const [parentId, setParentId] = useState<string | null>(null);
  // Dosyadan yüklenip henüz bağlanmamış görselin media id'si (submit'te imageMediaId olarak gider).
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialCategory, open]);

  // Düzenleme modunda bu kategorinin kendisi + alt ağacı parent olarak
  // seçilemez (derinlik döngüsü) — backend de reddeder ama UI erken engeller.
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

    // Sadece dolu bırakılan diller gönderilir — slug/metaTitle/metaDescription
    // backend'de name'den otomatik üretiliyor (CategoryTranslationDto notu),
    // frontend elle doldurmaz.
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
      // parentId yalnızca kullanıcı değiştirdiyse gönderilir — undefined
      // "dokunma" anlamına gelir (backend update semantiği).
      const parentChanged = parentId !== (initialCategory?.parentId ?? null);
      const imageChanged = typedUrl !== (initialCategory?.imageUrl ?? null);

      let patch: UpdateCategoryInput = { isActive, translations };
      if (imageMediaId) {
        // Yeni dosya yüklendi — backend eski MinIO object'ini siler (claim akışı).
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
    <Dialog open={open} onOpenChange={(next) => !next && handleCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New category' : 'Edit category'}</DialogTitle>
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
                placeholder={code === 'en' ? 'Electronics' : undefined}
              />
            </div>
          ))}

          <MediaUploadField
            label="Image"
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

          <div className="space-y-1.5">
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

          <div className="space-y-1.5">
            <Label htmlFor="parent-category">Parent category</Label>
            <Select
              value={parentId ?? ROOT_SENTINEL}
              onValueChange={(v) => setParentId(v === ROOT_SENTINEL ? null : v)}
            >
              <SelectTrigger id="parent-category" className="w-full">
                <SelectValue placeholder="No parent (root category)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ROOT_SENTINEL}>No parent (root category)</SelectItem>
                {parentOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="text-foreground flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="border-border h-4 w-4 rounded"
            />
            Active
          </label>

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
