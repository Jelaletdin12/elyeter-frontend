'use client';

import { useState, useEffect, useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
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
import type { Banner, CreateBannerInput, UpdateBannerInput } from '../types';

type BannerFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialBanner?: Banner;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmitCreate: (values: CreateBannerInput) => void;
  onSubmitEdit: (values: UpdateBannerInput) => void;
};

/**
 * FRONTEND_AGENTS.md #11 "önce yükle, sonra bağla" akışının ilk gerçek
 * kullanımı: dosya seçilir → hemen POST /media/uploads?context=BANNER_IMAGE
 * → dönen mediaId'yi gösterip önizler → form submit'te SADECE mediaId
 * (imageId) banner body'sine gider, dosyanın kendisi değil.
 *
 * Kullanıcı dialog'u iptal ederse ve bir görsel yüklenmiş ama hiçbir banner'a
 * bağlanmamışsa `discard()` ile hemen siliniyor — 24 saat boyunca askıda
 * kalıp otomatik temizlenmesini beklemeye gerek yok.
 */
export function BannerFormDialog({
  open,
  mode,
  initialBanner,
  isSubmitting,
  onCancel,
  onSubmitCreate,
  onSubmitEdit,
}: BannerFormDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pendingMedia, isUploading, error, upload, discard, reset } = useMediaUpload('BANNER_IMAGE');

  const [linkUrl, setLinkUrl] = useState('');
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (mode === 'edit' && initialBanner) {
      setLinkUrl(initialBanner.linkUrl);
      setOrder(initialBanner.order);
      setIsActive(initialBanner.isActive);
    } else {
      setLinkUrl('');
      setOrder(0);
      setIsActive(true);
    }
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialBanner, open]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await upload(file);
    } catch {
      // Hata zaten useMediaUpload'ın `error` state'inde — burada ekstra bir şey yapmaya gerek yok.
    }
  }

  async function handleCancel() {
    if (pendingMedia) await discard();
    onCancel();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (mode === 'create') {
      if (!pendingMedia) return; // create'de görsel zorunlu (CreateBannerDto.imageId required)
      onSubmitCreate({ imageId: pendingMedia.id, linkUrl, isActive, order });
    } else {
      // edit'te yeni görsel yüklenmediyse imageId hiç gönderilmez, mevcut görsel korunur.
      onSubmitEdit({
        ...(pendingMedia ? { imageId: pendingMedia.id } : {}),
        linkUrl,
        isActive,
        order,
      });
    }
  }

  const previewUrl =
    pendingMedia?.context === 'BANNER_IMAGE'
      ? pendingMedia.urls.BANNER_DESKTOP
      : (initialBanner?.desktopUrl ?? null);

  const canSubmit = mode === 'edit' || pendingMedia !== null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New banner' : 'Edit banner'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Image</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl ? (
              <div className="relative overflow-hidden rounded-md border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="" className="aspect-[16/7] w-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    if (pendingMedia) discard();
                    else fileInputRef.current?.click();
                  }}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-white hover:bg-ink"
                  aria-label={pendingMedia ? 'Remove uploaded image' : 'Replace image'}
                >
                  {pendingMedia ? <X size={14} /> : <ImagePlus size={14} />}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex aspect-[16/7] w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border text-muted-foreground hover:border-ink/30 disabled:opacity-50"
              >
                <ImagePlus size={20} strokeWidth={1.5} />
                <span className="text-sm">{isUploading ? 'Uploading…' : 'Click to upload'}</span>
              </button>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="linkUrl">Link URL</Label>
            <Input
              id="linkUrl"
              type="url"
              placeholder="https://example.com/summer-sale"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="order">Display order</Label>
            <Input
              id="order"
              type="number"
              min={0}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Lower numbers show first.</p>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Active
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading || !canSubmit}>
              {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
