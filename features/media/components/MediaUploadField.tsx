'use client';

import { ImagePlus, X } from 'lucide-react';
import type { RefObject } from 'react';
import { Label } from '@/components/ui/label';
import { mediaPreviewUrl, type PendingMedia } from '@/features/media/hooks/useMediaUpload';

/**
 * FRONTEND_AGENTS.md #11 "önce yükle, sonra bağla" akışının ortak görsel alanı.
 * Upload/discard/reset yaşam döngüsünü YÖNETMEZ — bunlar parent form'daki
 * tek `useMediaUpload(context)` hook'undadır (böylece dialog iptal edilince
 * askıda kalan görsel `discard()` ile hemen silinebilir). Bu component salt
 * sunum + dosya seçme tetikleyicisidir.
 *
 * - Yeni görsel yüklendiyse → `pendingMedia` önizlenir.
 * - Yoksa ve entity'de mevcut görsel varsa → `initialUrl` önizlenir.
 * - İkisi de yoksa → kesikli "upload" kutusu gösterilir.
 */
type MediaUploadFieldProps = {
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
};

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
        <div className="border-border relative overflow-hidden rounded-md border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt=""
            className={`w-full ${aspectClassName} ${contain ? 'bg-background object-contain p-2' : 'object-cover'}`}
          />
          <button
            type="button"
            onClick={() => {
              if (pendingMedia) onRemovePending();
              else fileInputRef?.current?.click();
            }}
            className="bg-ink/70 hover:bg-ink absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full text-white"
            aria-label={pendingMedia ? 'Remove uploaded image' : 'Replace image'}
          >
            {pendingMedia ? <X size={14} /> : <ImagePlus size={14} />}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef?.current?.click()}
          disabled={isUploading}
          className={`border-border text-muted-foreground hover:border-ink/30 flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed disabled:opacity-50 ${aspectClassName}`}
        >
          <ImagePlus size={20} strokeWidth={1.5} />
          <span className="text-sm">{isUploading ? 'Uploading…' : 'Click to upload'}</span>
        </button>
      )}

      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}