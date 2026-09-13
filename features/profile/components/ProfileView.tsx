'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, Loader2, MapPin, Plus, Star, Trash2, User } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { toast } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';
import { profileOptions } from '@/features/profile/api/queries';
import {
  useAddAddressMutation,
  useRemoveAddressMutation,
  useUpdateAddressMutation,
  useUpdateProfileMutation,
} from '@/features/profile/api/mutations';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import type { ClientAddress, Profile, ProfileAddressInput } from '../types';

/**
 * Hesap > Profil — GET/PATCH /profile + adres CRUD'unu bağlar (bkz.
 * backend modules/profile). Client tarafı customer session kullanır
 * (lib/auth/authorized-fetch). Kişisel bilgiler formu profil geldikten sonra
 * mount olur (state başlangıcı hazır), kayıt sonrası query invalidation +
 * header ismi store'dan güncellenir.
 */

function ProfileInfoForm({ profile }: { profile: Profile }) {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const updateProfile = useUpdateProfileMutation(storeId);

  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const isSaving = updateProfile.isPending;

  async function handleSaveProfile() {
    try {
      await updateProfile.mutateAsync({ fullName, phone: phone || undefined });
      toast.success('Profil güncellendi.');
    } catch {
      toast.error('Profil güncellenemedi, tekrar deneyin.');
    }
  }

  return (
    <section className="border-border bg-card rounded-md border p-5">
      <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
        <User size={15} className="text-muted-foreground" />
        Kişisel bilgiler
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="profile-name">Ad soyad</Label>
          <Input
            id="profile-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isSaving}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-email">E-posta</Label>
          <Input id="profile-email" value={profile.email} disabled />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="profile-phone">Telefon</Label>
          <Input
            id="profile-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+993 …"
            disabled={isSaving}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={handleSaveProfile} disabled={isSaving}>
          {isSaving && <Loader2 size={14} className="animate-spin" />}
          Kaydet
        </Button>
      </div>
    </section>
  );
}

function AddressCard({
  address,
  onDelete,
  onMakeDefault,
  isMutating,
}: {
  address: ClientAddress;
  onDelete: (id: string) => void;
  onMakeDefault: (address: ClientAddress) => void;
  isMutating: boolean;
}) {
  return (
    <li className="border-border bg-card rounded-md border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-foreground text-sm font-medium">
              {address.label ?? address.recipientName}
            </p>
            {address.isDefault && (
              <span className="bg-primary/10 text-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium">
                <Star size={10} className="fill-current" />
                Varsayılan
              </span>
            )}
          </div>
          <p className="text-foreground mt-1 text-sm">{address.addressLine}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {address.recipientName} · {address.recipientPhone}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!address.isDefault && (
            <button
              type="button"
              onClick={() => onMakeDefault(address)}
              disabled={isMutating}
              className="text-muted-foreground hover:text-foreground text-xs transition-colors disabled:opacity-50"
            >
              Varsayılan yap
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(address.id)}
            disabled={isMutating}
            aria-label="Adresi sil"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md p-1.5 transition-colors disabled:opacity-50"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </li>
  );
}

export function ProfileView() {
  const locale = useLocale();
  const storeId = useAuthStore((s) => s.activeStoreId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openAuthDialog = useUiStore((s) => s.openAuthDialog);

  const { data: profile, isLoading } = useQuery({
    ...profileOptions(storeId),
    enabled: isAuthenticated,
  });

  const addAddress = useAddAddressMutation(storeId);
  const removeAddress = useRemoveAddressMutation(storeId);
  const updateAddress = useUpdateAddressMutation(storeId);

  const emptyAddress: ProfileAddressInput = {
    label: '',
    recipientName: '',
    recipientPhone: '',
    addressLine: '',
    isDefault: false,
  };
  const [addressForm, setAddressForm] = useState<ProfileAddressInput>(emptyAddress);

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={User}
        title="Profilinizi görmek için giriş yapın"
        action={
          <button
            type="button"
            onClick={() => openAuthDialog('login')}
            className="text-sm underline"
          >
            Giriş yap
          </button>
        }
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-md" />
        <Skeleton className="h-32 w-full rounded-md" />
      </div>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        icon={User}
        title="Profil bulunamadı"
        description="Oturumunuzla ilgili bir sorun oluştu. Çıkış yapıp tekrar girmeyi deneyin."
      />
    );
  }

  async function handleAddAddress() {
    if (!addressForm.recipientName || !addressForm.recipientPhone || !addressForm.addressLine) {
      toast.error('Alıcı adı, telefon ve adres satırı gereklidir.');
      return;
    }
    try {
      await addAddress.mutateAsync(addressForm);
      setAddressForm(emptyAddress);
      toast.success('Adres eklendi.');
    } catch {
      toast.error('Adres eklenemedi, tekrar deneyin.');
    }
  }

  async function handleRemoveAddress(addressId: string) {
    try {
      await removeAddress.mutateAsync(addressId);
      toast.success('Adres silindi.');
    } catch {
      toast.error('Adres silinemedi, tekrar deneyin.');
    }
  }

  async function handleMakeDefault(address: ClientAddress) {
    try {
      await updateAddress.mutateAsync({
        addressId: address.id,
        label: address.label ?? '',
        recipientName: address.recipientName,
        recipientPhone: address.recipientPhone,
        addressLine: address.addressLine,
        isDefault: true,
      });
      toast.success('Varsayılan adres güncellendi.');
    } catch {
      toast.error('Güncellenemedi, tekrar deneyin.');
    }
  }

  const isAddressMutating =
    addAddress.isPending || removeAddress.isPending || updateAddress.isPending;

  return (
    <div className="space-y-6">
      <ProfileInfoForm profile={profile} />

      {/* Adresler */}
      <section className="border-border bg-card rounded-md border p-5">
        <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
          <MapPin size={15} className="text-muted-foreground" />
          Adresler
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="addr-label">Etiket</Label>
            <Input
              id="addr-label"
              value={addressForm.label ?? ''}
              onChange={(e) => setAddressForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Ev / İş"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="addr-recipient">Alıcı adı</Label>
            <Input
              id="addr-recipient"
              value={addressForm.recipientName}
              onChange={(e) => setAddressForm((f) => ({ ...f, recipientName: e.target.value }))}
              placeholder="Ad Soyad"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="addr-phone">Alıcı telefon</Label>
            <Input
              id="addr-phone"
              value={addressForm.recipientPhone}
              onChange={(e) => setAddressForm((f) => ({ ...f, recipientPhone: e.target.value }))}
              placeholder="+993 …"
            />
          </div>
          <div className="flex items-end">
            <label className="text-foreground flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={addressForm.isDefault ?? false}
                onChange={(e) => setAddressForm((f) => ({ ...f, isDefault: e.target.checked }))}
                className="accent-teal h-4 w-4 cursor-pointer"
              />
              Varsayılan yap
            </label>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="addr-line">Adres satırı</Label>
            <Input
              id="addr-line"
              value={addressForm.addressLine}
              onChange={(e) => setAddressForm((f) => ({ ...f, addressLine: e.target.value }))}
              placeholder="Mahalle, sokak, no, ilçe, şehir"
            />
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <Button onClick={handleAddAddress} disabled={isAddressMutating}>
            {addAddress.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            Adres ekle
          </Button>
        </div>

        {profile.addresses.length > 0 && (
          <ul className="mt-4 space-y-2.5">
            {profile.addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onDelete={handleRemoveAddress}
                onMakeDefault={handleMakeDefault}
                isMutating={isAddressMutating}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Referans: wishlist içine link */}
      <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <Heart size={14} />
        Favorileriniz için{' '}
        <Link href={`/${locale}/account/wishlist`} className="underline">
          favori listenize
        </Link>{' '}
        göz atın.
      </p>
    </div>
  );
}
