'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  Pencil,
  Plus,
  ShieldCheck,
  Store,
  Tag,
  Truck,
  Wallet,
} from 'lucide-react';

import { useAuthStore } from '@/stores/auth-store';
import { cartOptions } from '@/features/cart/api/queries';
import {
  useCheckoutMutation,
  type CheckoutInput,
} from '@/features/cart/api/mutations';
import { profileOptions } from '@/features/profile/api/queries';
import { CouponField } from '@/features/coupons/components/CouponField';
import type { ValidateCouponResponse } from '@/features/coupons/types';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/* Schema                                                                     */
/* -------------------------------------------------------------------------- */

const checkoutSchema = z
  .object({
    paymentMethod: z.enum(['CASH', 'CARD']),
    fulfillmentType: z.enum(['DELIVERY', 'PICKUP']),
    savedAddressId: z.string().optional(),
    recipientName: z.string().optional(),
    recipientPhone: z.string().optional(),
    shippingAddress: z.string().optional(),
  })
  .refine(
    (data) =>
      data.fulfillmentType !== 'DELIVERY' ||
      !!data.savedAddressId ||
      Boolean(
        data.recipientName &&
          data.recipientPhone &&
          data.shippingAddress,
      ),
    {
      message:
        'Kayıtlı bir adres seçin ya da teslimat bilgilerini doldurun.',
      path: ['shippingAddress'],
    },
  );

/* -------------------------------------------------------------------------- */
/* Small UI components                                                        */
/* -------------------------------------------------------------------------- */

function SectionHeader({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon size={19} strokeWidth={2} />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {number}
          </span>
          <h2 className="text-base font-semibold text-foreground">
            {title}
          </h2>
        </div>

        <p className="mt-0.5 text-xs text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function OptionCard({
  selected,
  icon: Icon,
  title,
  description,
  badge,
  onClick,
}: {
  selected: boolean;
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex w-full flex-col items-start rounded-xl border p-4 text-left transition-all',
        'hover:border-primary/50 hover:bg-muted/30',
        selected
          ? 'border-primary bg-primary/[0.04] shadow-sm'
          : 'border-border bg-card',
      )}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check size={12} strokeWidth={3} />
        </span>
      )}

      <div
        className={cn(
          'mb-3 flex h-9 w-9 items-center justify-center rounded-lg',
          selected
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon size={18} />
      </div>

      <span className="text-sm font-semibold text-foreground">
        {title}
      </span>

      <span className="mt-1 text-xs text-muted-foreground">
        {description}
      </span>

      {badge && (
        <span className="mt-3 rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
          {badge}
        </span>
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

export function CheckoutWizard() {
  const locale = useLocale();
  const router = useRouter();

  const storeId = useAuthStore((s) => s.activeStoreId);

  const checkout = useCheckoutMutation(storeId);

  const { data: cart, isLoading: cartLoading } = useQuery(
    cartOptions(storeId),
  );

  const { data: profile } = useQuery(profileOptions(storeId));

  const addresses = profile?.addresses ?? [];
  const defaultAddress = addresses.find((address) => address.isDefault);

  const [appliedCoupon, setAppliedCoupon] =
    useState<ValidateCouponResponse | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: 'CASH',
      fulfillmentType: 'DELIVERY',
      savedAddressId: '',
    },
  });

  const fulfillmentType = watch('fulfillmentType');
  const savedAddressId = watch('savedAddressId');
  const paymentMethod = watch('paymentMethod');

  const selectedAddress = addresses.find(
    (address) => address.id === savedAddressId,
  );

  useEffect(() => {
    if (defaultAddress && !savedAddressId) {
      setValue('savedAddressId', defaultAddress.id);
    }
  }, [defaultAddress, savedAddressId, setValue]);

  const discount = Number(appliedCoupon?.discountAmount ?? 0);

  const total = useMemo(() => {
    return Math.max(0, Number(cart?.subtotal ?? 0) - discount);
  }, [cart?.subtotal, discount]);

  const hasBlockingIssue =
    cart?.items.some((item) => item.availableQuantity <= 0) ?? false;

  async function onSubmit(input: CheckoutInput) {
    const payload: CheckoutInput = { ...input };

    if (input.savedAddressId) {
      delete payload.recipientName;
      delete payload.recipientPhone;
      delete payload.shippingAddress;
    } else {
      delete payload.savedAddressId;
    }

    const order = await checkout.mutateAsync({
      ...payload,
      ...(appliedCoupon?.code
        ? { couponCode: appliedCoupon.code }
        : {}),
    });

    router.push(`/${locale}/account/orders/${order.id}`);
  }

  if (cartLoading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="h-8 w-64 rounded bg-muted" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <div className="h-80 rounded-2xl bg-muted" />
            <div className="h-48 rounded-2xl bg-muted" />
            <div className="h-64 rounded-2xl bg-muted" />
          </div>
          <div className="h-[500px] rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Package className="text-muted-foreground" size={24} />
        </div>

        <h1 className="mt-4 text-xl font-semibold">
          Sepetiniz boş
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Checkout'a devam etmek için sepetinize ürün ekleyin.
        </p>

        <Button asChild className="mt-6">
          <Link href={`/${locale}`}>
            Alışverişe devam et
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/cart`}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={14} />
            Sepete dön
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Siparişinizi tamamlayın
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Teslimat ve ödeme bilgilerinizi kontrol ederek siparişinizi
            tamamlayın.
          </p>
        </div>

        <div className="hidden items-center gap-2 text-right sm:flex">
          <ShieldCheck
            size={18}
            className="text-muted-foreground"
          />

          <div>
            <p className="text-xs font-medium text-foreground">
              Güvenli ödeme
            </p>
            <p className="text-[11px] text-muted-foreground">
              Bilgileriniz korunur
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Main grid                                                          */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* ================================================================ */}
        {/* LEFT                                                              */}
        {/* ================================================================ */}

        <div className="space-y-6">
          {/* ---------------------------------------------------------------- */}
          {/* Delivery                                                         */}
          {/* ---------------------------------------------------------------- */}

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <SectionHeader
              number="01"
              icon={Truck}
              title="Teslimat"
              description="Siparişinizi nasıl almak istersiniz?"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <OptionCard
                selected={fulfillmentType === 'DELIVERY'}
                icon={Truck}
                title="Teslimat"
                description="Adresinize gönderelim"
                badge="1–3 iş günü"
                onClick={() =>
                  setValue('fulfillmentType', 'DELIVERY', {
                    shouldValidate: true,
                  })
                }
              />

              <OptionCard
                selected={fulfillmentType === 'PICKUP'}
                icon={Store}
                title="Mağazadan al"
                description="Mağazadan teslim alın"
                badge="Aynı gün"
                onClick={() =>
                  setValue('fulfillmentType', 'PICKUP', {
                    shouldValidate: true,
                  })
                }
              />
            </div>

            {fulfillmentType === 'DELIVERY' && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">
                    Teslimat adresi
                  </h3>

                  {addresses.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {addresses.length} kayıtlı adres
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {addresses.map((address) => {
                    const selected = savedAddressId === address.id;

                    return (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() =>
                          setValue('savedAddressId', address.id, {
                            shouldValidate: true,
                          })
                        }
                        className={cn(
                          'relative flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all',
                          'hover:border-primary/50',
                          selected
                            ? 'border-primary bg-primary/[0.03]'
                            : 'border-border',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                            selected
                              ? 'border-primary'
                              : 'border-muted-foreground/40',
                          )}
                        >
                          {selected && (
                            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <MapPin
                              size={14}
                              className="text-muted-foreground"
                            />

                            <span className="text-sm font-semibold text-foreground">
                              {address.label ?? 'Adres'}
                            </span>

                            {address.isDefault && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                Varsayılan
                              </span>
                            )}
                          </span>

                          <span className="mt-2 block text-xs text-muted-foreground">
                            {address.recipientName}
                            {' · '}
                            {address.recipientPhone}
                          </span>

                          <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                            {address.addressLine}
                          </span>
                        </span>

                        {selected && (
                          <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-primary sm:flex">
                            <Check size={14} />
                            Seçildi
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Manual address */}
                  <button
                    type="button"
                    onClick={() =>
                      setValue('savedAddressId', '', {
                        shouldValidate: true,
                      })
                    }
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border border-dashed p-4 text-left transition-all',
                      !savedAddressId
                        ? 'border-primary bg-primary/[0.03]'
                        : 'border-border hover:border-primary/50',
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Plus size={17} />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Yeni teslimat adresi
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Farklı bir adrese gönder
                      </p>
                    </div>
                  </button>
                </div>

                {!savedAddressId && (
                  <div className="mt-4 grid gap-3 rounded-xl border border-border bg-muted/20 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-foreground">
                          Alıcı adı
                        </label>

                        <input
                          {...register('recipientName')}
                          placeholder="Ad Soyad"
                          className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-foreground">
                          Telefon
                        </label>

                        <input
                          {...register('recipientPhone')}
                          placeholder="+993 ..."
                          className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-foreground">
                        Teslimat adresi
                      </label>

                      <input
                        {...register('shippingAddress')}
                        placeholder="Şehir, adres..."
                        className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {errors.shippingAddress && (
                  <p className="mt-3 text-xs font-medium text-destructive">
                    {errors.shippingAddress.message}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Payment                                                          */}
          {/* ---------------------------------------------------------------- */}

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <SectionHeader
              number="02"
              icon={CreditCard}
              title="Ödeme"
              description="Ödeme yönteminizi seçin."
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <OptionCard
                selected={paymentMethod === 'CASH'}
                icon={Wallet}
                title="Kapıda nakit"
                description="Teslimatta nakit ödeme"
                onClick={() =>
                  setValue('paymentMethod', 'CASH')
                }
              />

              <OptionCard
                selected={paymentMethod === 'CARD'}
                icon={CreditCard}
                title="Kapıda kart"
                description="Teslimatta kart ile ödeme"
                onClick={() =>
                  setValue('paymentMethod', 'CARD')
                }
              />
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Confirmation                                                     */}
          {/* ---------------------------------------------------------------- */}

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <SectionHeader
              number="03"
              icon={CheckCircle2}
              title="Sipariş onayı"
              description="Siparişinizi göndermeden önce bilgilerinizi kontrol edin."
            />

            {/* Delivery / Payment summary */}
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="flex items-center justify-between gap-4 border-b border-border bg-muted/20 px-4 py-3">
                <div className="flex items-center gap-3">
                  <MapPin
                    size={16}
                    className="text-muted-foreground"
                  />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Teslimat
                    </p>

                    <p className="mt-0.5 text-sm font-medium text-foreground">
                      {fulfillmentType === 'PICKUP'
                        ? 'Mağazadan al'
                        : selectedAddress?.label ?? 'Teslimat adresi'}
                    </p>
                  </div>
                </div>

                <span className="text-primary">
                  <Pencil size={14} />
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-3">
                  {paymentMethod === 'CASH' ? (
                    <Wallet
                      size={16}
                      className="text-muted-foreground"
                    />
                  ) : (
                    <CreditCard
                      size={16}
                      className="text-muted-foreground"
                    />
                  )}

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Ödeme
                    </p>

                    <p className="mt-0.5 text-sm font-medium text-foreground">
                      {paymentMethod === 'CASH'
                        ? 'Kapıda nakit'
                        : 'Kapıda kart'}
                    </p>
                  </div>
                </div>

                <span className="text-primary">
                  <Pencil size={14} />
                </span>
              </div>
            </div>

            {/* Coupon */}
            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2">
                <Tag size={15} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Kupon kodu
                </span>
              </div>

              <CouponField
                coupon={appliedCoupon}
                onChange={setAppliedCoupon}
              />
            </div>

            {/* Notice */}
            <div className="mt-5 rounded-xl bg-primary/[0.05] p-4">
              <div className="flex gap-3">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-primary"
                />

                <div>
                  <p className="text-xs font-medium text-foreground">
                    Siparişinizi güvenle tamamlayabilirsiniz
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Siparişi onayladığınızda teslimat ve ödeme
                    bilgileriniz siparişinizle birlikte işleme alınır.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                asChild
                type="button"
                variant="outline"
                className="sm:w-auto"
              >
                <Link href={`/${locale}/cart`}>
                  <ArrowLeft size={15} />
                  Sepete dön
                </Link>
              </Button>

              <Button
                type="submit"
                disabled={checkout.isPending || hasBlockingIssue}
                className="h-11 px-6 sm:min-w-[220px]"
              >
                {checkout.isPending ? (
                  'Sipariş veriliyor…'
                ) : (
                  <>
                    <Check size={16} />
                    Siparişi onayla
                  </>
                )}
              </Button>
            </div>

            {hasBlockingIssue && (
              <p className="mt-3 text-center text-xs font-medium text-destructive">
                Stokta olmayan ürünleri sepetinizden kaldırmadan sipariş
                veremezsiniz.
              </p>
            )}
          </section>
        </div>

        {/* ================================================================ */}
        {/* RIGHT — ORDER SUMMARY                                             */}
        {/* ================================================================ */}

        <aside className="lg:sticky lg:top-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Sipariş özeti
                </h2>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {cart.items.length} ürün
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <Package size={17} />
              </div>
            </div>

            <Separator />

            {/* Products */}
            <div className="space-y-1 p-4">
              {cart.items.map((item) => {
                const variant = item.productVariant;

                const name =
                  variant.product.translations[0]?.name ??
                  variant.sku;

                const attributes = Object.entries(
                  variant.attributes ?? {},
                )
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(' · ');

                const priceChanged =
                  item.priceSnapshot !== item.currentPrice;

                const isOutOfStock =
                  item.availableQuantity <= 0;

                return (
                  <div
                    key={item.id}
                    className="rounded-xl p-2 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex gap-3">
                      {/* Product placeholder */}
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Package
                          size={20}
                          className="text-muted-foreground/60"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-foreground">
                              {name}
                            </p>

                            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                              {attributes || variant.sku}
                            </p>
                          </div>

                          <button
                            type="button"
                            className="shrink-0 text-xs text-muted-foreground hover:text-destructive"
                            aria-label="Ürünü kaldır"
                          >
                            ×
                          </button>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center rounded-md border border-border">
                            <span className="px-2 py-1 text-[11px] text-muted-foreground">
                              × {item.quantity}
                            </span>
                          </div>

                          <span className="text-xs font-semibold tabular-nums text-foreground">
                            {(
                              Number(item.currentPrice) *
                              item.quantity
                            ).toFixed(2)}
                          </span>
                        </div>

                        {priceChanged && (
                          <p className="mt-1 text-[10px] font-medium text-destructive">
                            Fiyat güncellendi
                          </p>
                        )}

                        {isOutOfStock && (
                          <p className="mt-1 text-[10px] font-medium text-destructive">
                            Stokta yok
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Ara toplam
                </span>

                <span className="font-medium tabular-nums text-foreground">
                  {Number(cart.subtotal).toFixed(2)}
                </span>
              </div>

              {appliedCoupon && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-primary">
                    <Tag size={13} />
                    Kupon ({appliedCoupon.code})
                  </span>

                  <span className="font-medium tabular-nums text-primary">
                    −{discount.toFixed(2)}
                  </span>
                </div>
              )}

              <Separator />

              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Toplam
                  </p>

                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Vergiler dahil
                  </p>
                </div>

                <span className="text-xl font-semibold tabular-nums tracking-tight text-foreground">
                  {total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Trust */}
            <div className="border-t border-border bg-muted/20 px-5 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  size={15}
                  className="text-muted-foreground"
                />

                <p className="text-[11px] leading-4 text-muted-foreground">
                  Sipariş bilgileriniz güvenli şekilde işlenir.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}