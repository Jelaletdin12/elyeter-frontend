'use client';

import type { RefObject } from 'react';
import Image from 'next/image';
import { ImagePlus, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { mediaPreviewUrl, type PendingMedia } from '@/features/media/hooks/useMediaUpload';

/**
 * FRONTEND_AGENTS.md #11 "önce yükle, sonra bağla" akışının ortak görsel alanı.
 * Upload/discard/reset yaşam döngüsünü YÖNETMEZ — bunlar parent form'daki
 * tek `useMediaUpload(context)` hook'undadır.
 */
interface MediaUploadFieldProps {
  label: string;
  hint?: string;
  initialUrl?: string | null;
  pendingMedia: PendingMedia | null;
  isUploading: boolean;
  error?: string | null;
  accept?: string;
  /** Görsel alanının en-boy oranı: category 'aspect-[2/1]', brand 'aspect-square' vb. */
  aspectClassName?: string;
  /** Yüklenen görselin beyaz zemin üzerinde kenar boşluğuyla gösterilmesi (logo). */
  contain?: boolean;
  fileInputRef?: RefObject<HTMLInputElement | null>;
  onFileSelect: (file: File) => void;
  /** Askıdaki (henüz bağlanmamış) yüklemeyi sil. */
  onRemovePending: () => void;
}

export function MediaUploadField({
  label,
  hint,
  initialUrl,
  pendingMedia,
  isUploading,
  error,
  accept = 'image/jpeg,image/png,image/webp',
  aspectClassName = 'aspect-[16/7]',
  contain = false,
  fileInputRef,
  onFileSelect,
  onRemovePending,
}: MediaUploadFieldProps) {
  const previewUrl =
    (pendingMedia ? mediaPreviewUrl(pendingMedia.context, pendingMedia) : null) ??
    initialUrl ??
    null;

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          onFileSelect(file);
          e.target.value = '';
        }}
        className="hidden"
      />

      {previewUrl ? (
        <div
          className={`group border-border bg-muted relative overflow-hidden rounded-lg border ${aspectClassName}`}
        >
          <Image
            src={previewUrl}
            alt={label}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={`transition-transform duration-300 group-hover:scale-105 ${
              contain ? 'bg-background object-contain p-2' : 'object-cover'
            }`}
            unoptimized
          />
          <Button
            type="button"
            variant={pendingMedia ? 'destructive' : 'secondary'}
            size="icon-sm"
            onClick={() => {
              if (pendingMedia) onRemovePending();
              else fileInputRef?.current?.click();
            }}
            className="absolute top-2 right-2 shadow-sm transition-opacity"
            aria-label={pendingMedia ? 'Remove uploaded image' : 'Replace image'}
          >
            {pendingMedia ? <X className="size-3.5" /> : <ImagePlus className="size-3.5" />}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef?.current?.click()}
          disabled={isUploading}
          className={`text-muted-foreground hover:text-foreground flex h-auto w-full flex-col items-center justify-center gap-2 border-dashed ${aspectClassName}`}
        >
          <ImagePlus className="size-5" />
          <span className="text-xs">{isUploading ? 'Uploading…' : 'Click to upload'}</span>
        </Button>
      )}

      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      {error && <p className="text-destructive text-sm font-medium">{error}</p>}
    </div>
  );
}
