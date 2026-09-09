'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useUiStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { useCheckoutMutation, type CheckoutInput } from '@/features/cart/api/mutations';

/**
 * Backend'in CreateOrderDto/@ValidateIf kısıtını client'ta erken yansıtan
 * zod şeması (FRONTEND_STANDARDS.md #1). Nihai doğrulama backend'dedir —
 * bu sadece kullanıcıya submit ETMEDEN önce hızlı geri bildirim verir.
 */
const checkoutSchema = z
  .object({
    paymentMethod: z.enum(['CASH', 'CARD']),
    fulfillmentType: z.enum(['DELIVERY', 'PICKUP']),
    recipientName: z.string().optional(),
    recipientPhone: z.string().optional(),
    shippingAddress: z.string().optional(),
  })
  .refine(
    (data) =>
      data.fulfillmentType !== 'DELIVERY' ||
      (data.recipientName && data.recipientPhone && data.shippingAddress),
    { message: 'errors.delivery_fields_required', path: ['shippingAddress'] },
  );

export function CheckoutWizard() {
  const router = useRouter();
  const storeId = useAuthStore((s) => s.activeStoreId);
  const step = useUiStore((s) => s.checkoutStep);
  const setStep = useUiStore((s) => s.setCheckoutStep);
  const resetCheckout = useUiStore((s) => s.resetCheckout);

  const checkout = useCheckoutMutation(storeId);

  const { register, handleSubmit, watch } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: 'CASH', fulfillmentType: 'DELIVERY' },
  });

  const fulfillmentType = watch('fulfillmentType');

  async function onSubmit(input: CheckoutInput) {
    const order = await checkout.mutateAsync(input);
    resetCheckout();
    router.push(`/account/orders/${order.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex gap-4 text-sm">
        {(['shipping', 'payment', 'review'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(s)}
            className={s === step ? 'font-semibold underline' : 'text-muted-foreground'}
          >
            {s}
          </button>
        ))}
      </div>

      {step === 'shipping' && (
        <fieldset className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="DELIVERY" {...register('fulfillmentType')} /> Delivery
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="PICKUP" {...register('fulfillmentType')} /> Pickup
          </label>

          {fulfillmentType === 'DELIVERY' && (
            <div className="space-y-2">
              <input
                placeholder="Recipient name"
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
                {...register('recipientName')}
              />
              <input
                placeholder="Recipient phone"
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
                {...register('recipientPhone')}
              />
              <input
                placeholder="Shipping address"
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
                {...register('shippingAddress')}
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setStep('payment')}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Continue
          </button>
        </fieldset>
      )}

      {step === 'payment' && (
        <fieldset className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="CASH" {...register('paymentMethod')} /> Cash on delivery
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="CARD" {...register('paymentMethod')} /> Card on delivery
          </label>
          <button
            type="button"
            onClick={() => setStep('review')}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Continue
          </button>
        </fieldset>
      )}

      {step === 'review' && (
        <div>
          <button
            type="submit"
            disabled={checkout.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {checkout.isPending ? '...' : 'Place order'}
          </button>
        </div>
      )}
    </form>
  );
}
