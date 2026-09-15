'use client';

import { useState, useEffect } from 'react';
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
  const [names, setNames] = useState<Record<CategoryLocale, string>>(emptyNames());
  const [isActive, setIsActive] = useState(true);
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && initialCategory) {
      const next = emptyNames();
      for (const t of initialCategory.translations) next[t.locale] = t.name;
      setNames(next);
      setIsActive(initialCategory.isActive);
      setParentId(initialCategory.parentId);
    } else {
      setNames(emptyNames());
      setIsActive(true);
      setParentId(null);
    }
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Sadece dolu bırakılan diller gönderilir — slug/metaTitle/metaDescription
    // backend'de name'den otomatik üretiliyor (CategoryTranslationDto notu),
    // frontend elle doldurmaz.
    const translations = LOCALES.filter(({ code }) => names[code].trim()).map(({ code }) => ({
      locale: code,
      name: names[code].trim(),
    }));

    if (mode === 'create') {
      onSubmitCreate({ isActive, parentId, translations });
    } else {
      // parentId yalnızca kullanıcı değiştirdiyse gönderilir — undefined
      // "dokunma" anlamına gelir (backend update semantiği).
      const parentChanged = parentId !== (initialCategory?.parentId ?? null);
      onSubmitEdit({
        isActive,
        translations,
        ...(parentChanged ? { parentId } : {}),
      });
    }
  }

  const hasAtLeastOneName = LOCALES.some(({ code }) => names[code].trim());

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
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
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !hasAtLeastOneName}>
              {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
