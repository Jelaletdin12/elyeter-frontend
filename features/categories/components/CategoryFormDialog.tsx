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
import type { Category, CategoryLocale, CreateCategoryInput, UpdateCategoryInput } from '../types';

const LOCALES: { code: CategoryLocale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'tk', label: 'Türkmençe' },
];

type CategoryFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
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
  initialCategory,
  isSubmitting,
  onCancel,
  onSubmitCreate,
  onSubmitEdit,
}: CategoryFormDialogProps) {
  const [names, setNames] = useState<Record<CategoryLocale, string>>(emptyNames());
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (mode === 'edit' && initialCategory) {
      const next = emptyNames();
      for (const t of initialCategory.translations) next[t.locale] = t.name;
      setNames(next);
      setIsActive(initialCategory.isActive);
    } else {
      setNames(emptyNames());
      setIsActive(true);
    }
  }, [mode, initialCategory, open]);

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
      onSubmitCreate({ isActive, translations });
    } else {
      onSubmitEdit({ isActive, translations });
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
                Name <span className="text-ink-muted">({label})</span>
              </Label>
              <Input
                id={`name-${code}`}
                value={names[code]}
                onChange={(e) => setNames((n) => ({ ...n, [code]: e.target.value }))}
                placeholder={code === 'en' ? 'Electronics' : undefined}
              />
            </div>
          ))}

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-line"
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
