'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, Loader2, LogOut, MapPin, Plus, Star, Trash2, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useLogoutMutation } from '@/features/auth/api/mutations';
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
import { LocationInput } from '@/features/locations/components/LocationInput';
import type { LocationPoint } from '@/features/locations/types';
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
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');

  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const isSaving = updateProfile.isPending;

  async function handleSaveProfile() {
    try {
      await updateProfile.mutateAsync({ fullName, phone: phone || undefined });
      toast.success(t('profileUpdated'));
    } catch {
      toast.error(t('profileUpdateFailed'));
    }
  }

  return (
    <section className="border-border bg-card rounded-md border p-5">
      <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
        <User size={15} className="text-muted-foreground" />
        {t('personalInfo')}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="profile-name">{t('fullName')}</Label>
          <Input
            id="profile-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isSaving}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-email">{t('email')}</Label>
          <Input id="profile-email" value={profile.email} disabled />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="profile-phone">{t('phone')}</Label>
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
          {tCommon('save')}
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
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');

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
                {tCommon('default')}
              </span>
            )}
          </div>
          <p className="text-foreground mt-1 text-sm">{address.addressLine}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {address.recipientName} · {address.recipientPhone}
          </p>
          {address.latitude != null && (
            <p className="text-muted-foreground mt-1 inline-flex items-center gap-1 text-[11px]">
              <MapPin size={11} className="text-primary" />
              {t('locationSaved')}
              {address.locationAccuracy != null ? ` · ±${address.locationAccuracy} m` : ''}
            </p>
          )}
          {address.deliveryNote && (
            <p className="text-muted-foreground mt-0.5 text-[11px]">
              {t('note', { note: address.deliveryNote })}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!address.isDefault && (
            <button
              type="button"
              onClick={() => onMakeDefault(address)}
              disabled={isMutating}
              className="text-muted-foreground hover:text-foreground text-xs transition-colors disabled:opacity-50"
            >
              {t('makeDefault')}
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(address.id)}
            disabled={isMutating}
            aria-label={t('deleteAddress')}
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
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const storeId = useAuthStore((s) => s.activeStoreId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openAuthDialog = useUiStore((s) => s.openAuthDialog);
  const router = useRouter();
  const logout = useLogoutMutation();

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

  // Formdaki seçili konum — LocationInput'a `value` olarak verilir.
  const locationPoint: LocationPoint | null =
    typeof addressForm.latitude === 'number' && typeof addressForm.longitude === 'number'
      ? {
          latitude: addressForm.latitude,
          longitude: addressForm.longitude,
          source: addressForm.locationSource ?? 'MANUAL',
          accuracy: addressForm.locationAccuracy,
        }
      : null;

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={User}
        title={t('signInTitle')}
        action={
          <button
            type="button"
            onClick={() => openAuthDialog('login')}
            className="text-sm underline"
          >
            {t('signIn')}
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
      <EmptyState icon={User} title={t('notFoundTitle')} description={t('notFoundDescription')} />
    );
  }

  async function handleAddAddress() {
    if (!addressForm.recipientName || !addressForm.recipientPhone || !addressForm.addressLine) {
      toast.error(t('addressRequired'));
      return;
    }
    try {
      await addAddress.mutateAsync(addressForm);
      setAddressForm(emptyAddress);
      toast.success(t('addressAdded'));
    } catch {
      toast.error(t('addressAddFailed'));
    }
  }

  async function handleRemoveAddress(addressId: string) {
    try {
      await removeAddress.mutateAsync(addressId);
      toast.success(t('addressDeleted'));
    } catch {
      toast.error(t('addressDeleteFailed'));
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
        // Koordinatları olduğu gibi koru — geçirilmezse update backend'de
        // koordinatları SİLER (null = MANUAL + coords temizlenir).
        latitude: address.latitude != null ? Number(address.latitude) : undefined,
        longitude: address.longitude != null ? Number(address.longitude) : undefined,
        locationSource: address.locationSource ?? undefined,
        locationAccuracy: address.locationAccuracy ?? undefined,
        deliveryNote: address.deliveryNote ?? undefined,
      });
      toast.success(t('defaultUpdated'));
    } catch {
      toast.error(t('updateFailed'));
    }
  }

  const isAddressMutating =
    addAddress.isPending || removeAddress.isPending || updateAddress.isPending;

  async function handleLogout() {
    try {
      await logout.mutateAsync();
      router.push('/');
    } catch {
      toast.error(tCommon('logoutFailed'));
    }
  }

  return (
    <div className="space-y-6">
      <ProfileInfoForm profile={profile} />

      {/* Oturum — çıkış işlemi; sekme çubuğundakinin yanında profile sayfasında
          bariz görünür olması için ayrı bir karttır. */}
      <section className="border-border bg-card rounded-md border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
              <LogOut size={15} className="text-muted-foreground" />
              {t('session')}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">{profile.email}</p>
          </div>
          <Button
            type="button"
            variant="destructive"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            {logout.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <LogOut size={14} />
            )}
            {tCommon('logout')}
          </Button>
        </div>
      </section>

      {/* Adresler */}
      <section className="border-border bg-card rounded-md border p-5">
        <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
          <MapPin size={15} className="text-muted-foreground" />
          {t('addresses')}
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="addr-label">{t('label')}</Label>
            <Input
              id="addr-label"
              value={addressForm.label ?? ''}
              onChange={(e) => setAddressForm((f) => ({ ...f, label: e.target.value }))}
              placeholder={t('labelPlaceholder')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="addr-recipient">{t('recipientName')}</Label>
            <Input
              id="addr-recipient"
              value={addressForm.recipientName}
              onChange={(e) => setAddressForm((f) => ({ ...f, recipientName: e.target.value }))}
              placeholder={t('recipientNamePlaceholder')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="addr-phone">{t('recipientPhone')}</Label>
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
              {t('makeDefault')}
            </label>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="addr-line">{t('addressLine')}</Label>
            <Input
              id="addr-line"
              value={addressForm.addressLine}
              onChange={(event) =>
                setAddressForm((f) => ({ ...f, addressLine: event.target.value }))
              }
              placeholder={t('addressLinePlaceholder')}
            />
          </div>

          {/* Konum: harita / adres arama / mevcut konum (spec bölüm 5) */}
          <div className="rounded-lg sm:col-span-2">
            <LocationInput
              value={locationPoint}
              onResolvedAddress={(addressLine) => setAddressForm((f) => ({ ...f, addressLine }))}
              onChange={(point) =>
                setAddressForm((f) => ({
                  ...f,
                  latitude: point?.latitude,
                  longitude: point?.longitude,
                  locationSource: point?.source,
                  locationAccuracy: point?.accuracy,
                }))
              }
              note={addressForm.deliveryNote}
              onNoteChange={(deliveryNote) => setAddressForm((f) => ({ ...f, deliveryNote }))}
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
            {t('addAddress')}
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
        {t.rich('wishlistHint', {
          link: (chunks) => (
            <Link href={`/${locale}/account/wishlist`} className="underline">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}
