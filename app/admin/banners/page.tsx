'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { bannerListOptions } from '@/features/banners/api/queries';
import {
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} from '@/features/banners/api/mutations';
import { BannerFormDialog } from '@/features/banners/components/BannerFormDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import type { Banner } from '@/features/banners/types';

/**
 * ✅ Şema doğrulandı (curl, 2026-09-08): POST/GET /banners, GET/PATCH/DELETE
 * /banners/{id}. GET düz dizi döndüğü için (sayfalama yok) burada DataTable
 * yerine kart grid'i kullanıyoruz — banner görseli tabloda küçük bir
 * thumbnail'den fazlasını hak ediyor.
 */
export default function AdminBannersPage() {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const { can } = useAuth();

  const { data: banners, isLoading } = useQuery(bannerListOptions(storeId));

  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [pendingDeleteBanner, setPendingDeleteBanner] = useState<Banner | null>(null);

  const createBanner = useCreateBannerMutation(storeId);
  const updateBanner = useUpdateBannerMutation(storeId);
  const deleteBanner = useDeleteBannerMutation(storeId);

  function openCreate() {
    setEditingBanner(null);
    setDialogMode('create');
  }

  function openEdit(banner: Banner) {
    setEditingBanner(banner);
    setDialogMode('edit');
  }

  function closeDialog() {
    setDialogMode(null);
    setEditingBanner(null);
  }

  async function confirmDelete() {
    if (!pendingDeleteBanner) return;
    await deleteBanner.mutateAsync(pendingDeleteBanner.id);
    toast.success('Banner deleted.');
    setPendingDeleteBanner(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl italic text-ink">Banners</h1>
          <p className="mt-1 text-sm text-ink-muted">{banners?.length ?? 0} banners</p>
        </div>
        {can('banner.manage') && (
          <Button onClick={openCreate}>
            <Plus size={16} /> New banner
          </Button>
        )}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid animate-pulse grid-cols-2 gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[16/9] rounded-card bg-paper" />
            ))}
          </div>
        ) : !banners || banners.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="No banners yet"
            description="Banners you add will appear at the top of your homepage."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[...banners]
              .sort((a, b) => a.order - b.order)
              .map((banner) => (
                <div key={banner.id} className="overflow-hidden rounded-card border border-line bg-surface">
                  <div className="relative aspect-[16/9]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={banner.desktopUrl} alt="" className="h-full w-full object-cover" />
                    <div className="absolute left-2 top-2">
                      <StatusBadge tone={banner.isActive ? 'success' : 'neutral'}>
                        {banner.isActive ? 'Active' : 'Disabled'}
                      </StatusBadge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <p className="truncate text-xs text-ink-muted">Order {banner.order}</p>
                    {can('banner.manage') && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(banner)} aria-label="Edit">
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPendingDeleteBanner(banner)}
                          aria-label="Delete"
                          className="text-danger hover:bg-danger/10"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <BannerFormDialog
        open={dialogMode !== null}
        mode={dialogMode ?? 'create'}
        initialBanner={editingBanner ?? undefined}
        isSubmitting={createBanner.isPending || updateBanner.isPending}
        onCancel={closeDialog}
        onSubmitCreate={(values) =>
          createBanner.mutate(values, {
            onSuccess: () => {
              toast.success('Banner created.');
              closeDialog();
            },
          })
        }
        onSubmitEdit={(values) => {
          if (!editingBanner) return;
          updateBanner.mutate(
            { bannerId: editingBanner.id, input: values },
            {
              onSuccess: () => {
                toast.success('Banner updated.');
                closeDialog();
              },
            },
          );
        }}
      />

      <ConfirmDialog
        open={pendingDeleteBanner !== null}
        title="Delete this banner?"
        description="It will be removed from the homepage immediately."
        confirmLabel="Delete"
        isDestructive
        isLoading={deleteBanner.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteBanner(null)}
      />
    </div>
  );
}
