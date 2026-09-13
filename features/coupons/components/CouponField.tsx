'use client';

import { useState } from 'react';
import { BadgePercent, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useValidateCouponMutation } from '../api/mutations';
import type { ValidateCouponResponse } from '../types';

type CouponFieldProps = {
  coupon: ValidateCouponResponse | null;
  onChange: (coupon: ValidateCouponResponse | null) => void;
};

export function CouponField({ coupon, onChange }: CouponFieldProps) {
  const validate = useValidateCouponMutation();
  const [code, setCode] = useState('');
  const [inlineError, setInlineError] = useState<string | null>(null);

  async function handleApply() {
    const trimmed = code.trim();
    if (!trimmed) return;

    setInlineError(null);
    try {
      const result = await validate.mutateAsync({ code: trimmed });
      if (result.valid) {
        onChange(result);
        setCode('');
      } else {
        setInlineError('This code does not apply to your order.');
      }
    } catch {
      // Hata global onError'da toast ile gösterilir (mutation error → mutationCache).
    }
  }

  if (coupon) {
    const discount = coupon.discountAmount ?? 0;
    return (
      <div className="rounded-md border-sidebar-primary/30 bg-sidebar-primary/5 flex items-center justify-between border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <BadgePercent size={16} className="text-sidebar-primary" />
          <div>
            <p className="text-foreground text-sm font-medium">{coupon.code}</p>
            <p className="text-sidebar-primary text-xs">
              {coupon.type === 'PERCENTAGE' && coupon.value
                ? `${coupon.value}% off`
                : coupon.type === 'FIXED' && coupon.value
                  ? `${coupon.value} off`
                  : ''}{' '}
              · −{discount.toFixed(2)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove coupon"
          className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    // Not: <form> DEĞİL — CheckoutWizard'ın dışarıdaki <form>'una iç içe
    // geçmemesi için div. Submit hem Apply butonuna hem Enter tuşuna bağlı.
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleApply();
            }
          }}
          placeholder="Coupon code (e.g. SUMMER20)"
          className="uppercase"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleApply}
          disabled={validate.isPending || !code.trim()}
        >
          {validate.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
        </Button>
      </div>
      {inlineError && <p className="text-destructive text-xs">{inlineError}</p>}
    </div>
  );
}