'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/ui/sonner';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { ProductCard } from '@/features/home/components/ProductCard';
import { ApiClientError } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { useVisualSearchMutation } from '../api/mutations';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // backend MAX_UPLOAD_SIZE_BYTES ile aynı

export function VisualSearchPanel({ locale }: { locale: string }) {
  const t = useTranslations('visualSearch');
  const storeId = useAuthStore((state) => state.activeStoreId);
  const visualSearch = useVisualSearchMutation(storeId);

  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(t('tooLarge'));
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    visualSearch.reset();
    visualSearch.mutate(file);
  }

  function handleUploadAnother() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    visualSearch.reset();
    if (inputRef.current) inputRef.current.value = '';
    inputRef.current?.click();
  }

  const error = visualSearch.error as ApiClientError | null;
  const noMatches = error?.i18nKey === 'errors.no_visual_matches';

  return (
    <section className="mt-6">
      <div>
        <h1 className="text-foreground text-2xl font-medium tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t('description')}</p>
      </div>

      <div className="mt-5">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <Button
          type="button"
          variant="outline"
          disabled={visualSearch.isPending}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          {preview ? t('uploadAnother') : t('upload')}
        </Button>

        {preview && (
          <div className="border-border mt-4 overflow-hidden rounded-xl border">
            {/* eslint-disable-next-line @next/next/no-img-element -- yerel önizleme, remote pattern gerekmez */}
            <img
              src={preview}
              alt=""
              className="mx-auto max-h-64 w-auto object-contain"
            />
          </div>
        )}

        {visualSearch.isPending && (
          <div className="text-muted-foreground mt-6 flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            {t('finding')}
          </div>
        )}

        {visualSearch.isError && noMatches && (
          <div className="mt-6">
            <EmptyState
              icon={SearchX}
              title={t('noMatchesTitle')}
              description={t('noMatchesDescription')}
            />
          </div>
        )}

        {!visualSearch.isPending && visualSearch.data && (
          <>
            <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {visualSearch.data.items.map(({ product, similarity }) => (
                <li key={product.id} className="relative">
                  <ProductCard product={product} locale={locale} />
                  <span className="bg-background/90 text-foreground absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur">
                    {t('similarityMatch', { percent: Math.round(similarity * 100) })}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleUploadAnother}
              className="mt-4"
            >
              {t('tryAnother')}
            </Button>
          </>
        )}
      </div>
    </section>
  );
}