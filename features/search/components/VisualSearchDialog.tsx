'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, SearchX } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { ProductCard } from '@/features/home/components/ProductCard';
import { ApiClientError } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { useVisualSearchMutation } from '../api/mutations';

interface VisualSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // backend MAX_UPLOAD_SIZE_BYTES ile aynı

export function VisualSearchDialog({ open, onOpenChange, locale }: VisualSearchDialogProps) {
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
      toast.error('This image is too large (max 10 MB).');
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search by image</DialogTitle>
          <DialogDescription>
            Upload a photo and we&apos;ll find visually similar products.
          </DialogDescription>
        </DialogHeader>

        <div>
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
            {preview ? 'Choose another image' : 'Upload an image'}
          </Button>

          {preview && (
            <div className="border-border mt-4 overflow-hidden rounded-xl border">
              {/* eslint-disable-next-line @next/next/no-img-element -- yerel önizleme, remote pattern gerekmez */}
              <img
                src={preview}
                alt="Search reference"
                className="mx-auto max-h-64 w-auto object-contain"
              />
            </div>
          )}

          {visualSearch.isPending && (
            <div className="text-muted-foreground mt-6 flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Finding similar products...
            </div>
          )}

          {visualSearch.isError && noMatches && (
            <div className="mt-6">
              <EmptyState
                icon={SearchX}
                title="No visual matches"
                description="Try a different photo or a closer crop of the product."
              />
            </div>
          )}

          {!visualSearch.isPending && visualSearch.data && (
            <>
              <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {visualSearch.data.items.map(({ product, similarity }) => (
                  <li key={product.id} className="relative">
                    <ProductCard product={product} locale={locale} />
                    <span className="bg-background/90 text-foreground absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur">
                      {Math.round(similarity * 100)}% match
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
                Try another image
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
