'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Coupon, CouponType, CreateCouponInput, UpdateCouponInput } from '../types';

type CouponFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialCoupon?: Coupon;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmitCreate: (values: CreateCouponInput) => void;
  onSubmitEdit: (values: UpdateCouponInput) => void;
};

/**
 * ⚠️ UpdateCouponDto'da `code` YOK — kupon kodu oluşturma sonrası değiştirilemez,
 * edit modunda code alanı disabled gösterilir.
 *
 * Sayı alanları formda string tutulur, submit'te boş ise undefined (gönderilmez),
 * dolu ise Number() ile çevrilir. Backend response'ları bu alanları STRING döner
 * (bkz. features/coupons/types.ts notu), o yüzden initialCoupon'dan değer okurken
 * string'e çevrilir.
 */
export function CouponFormDialog({
  open,
  mode,
  initialCoupon,
  isSubmitting,
  onCancel,
  onSubmitCreate,
  onSubmitEdit,
}: CouponFormDialogProps) {
  const [code, setCode] = useState('');
  const [type, setType] = useState<CouponType>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [perUserLimit, setPerUserLimit] = useState('1');
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (mode === 'edit' && initialCoupon) {
      setCode(initialCoupon.code);
      setType(initialCoupon.type);
      setValue(initialCoupon.value);
      setMinOrderAmount(initialCoupon.minOrderAmount);
      setMaxDiscount(initialCoupon.maxDiscount);
      setUsageLimit(String(initialCoupon.usageLimit));
      setPerUserLimit(String(initialCoupon.perUserLimit));
      setStartsAt(toDatetimeLocal(initialCoupon.startsAt));
      setExpiresAt(toDatetimeLocal(initialCoupon.expiresAt));
      setIsActive(initialCoupon.isActive);
    } else {
      setCode('');
      setType('PERCENTAGE');
      setValue('');
      setMinOrderAmount('');
      setMaxDiscount('');
      setUsageLimit('');
      setPerUserLimit('1');
      setStartsAt('');
      setExpiresAt('');
      setIsActive(true);
    }
  }, [mode, initialCoupon, open]);

  function numOrUndefined(raw: string): number | undefined {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function dateOrUndefined(raw: string): string | undefined {
    if (!raw) return undefined;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const valueNum = numOrUndefined(value);

    const common = {
      type,
      value: valueNum,
      minOrderAmount: numOrUndefined(minOrderAmount),
      maxDiscount: numOrUndefined(maxDiscount),
      usageLimit: numOrUndefined(usageLimit),
      perUserLimit: numOrUndefined(perUserLimit) ?? 1,
      startsAt: dateOrUndefined(startsAt),
      expiresAt: dateOrUndefined(expiresAt),
      isActive,
    };

    if (mode === 'create') {
      onSubmitCreate({ ...common, code: code.trim().toUpperCase(), value: valueNum ?? 0 });
    } else {
      onSubmitEdit(common);
    }
  }

  const valueValid = numOrUndefined(value) !== undefined;
  const canSubmit = valueValid && (mode === 'edit' || code.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New coupon' : 'Edit coupon'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER20"
              disabled={mode === 'edit'}
              required={mode === 'create'}
              className={mode === 'edit' ? 'opacity-60' : undefined}
            />
            {mode === 'edit' && (
              <p className="text-muted-foreground text-xs">
                Coupon codes cannot be changed after creation.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as CouponType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                  <SelectItem value="FIXED">Fixed amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                min={0}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === 'PERCENTAGE' ? '20' : '50'}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="minOrderAmount">Min order amount</Label>
              <Input
                id="minOrderAmount"
                type="number"
                step="0.01"
                min={0}
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder="500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maxDiscount">Max discount (percentage only)</Label>
              <Input
                id="maxDiscount"
                type="number"
                step="0.01"
                min={0}
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                placeholder="200"
                disabled={type !== 'PERCENTAGE'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="usageLimit">Usage limit (total)</Label>
              <Input
                id="usageLimit"
                type="number"
                min={0}
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="100"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="perUserLimit">Per-user limit</Label>
              <Input
                id="perUserLimit"
                type="number"
                min={1}
                value={perUserLimit}
                onChange={(e) => setPerUserLimit(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startsAt">Starts at</Label>
              <Input
                id="startsAt"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expiresAt">Expires at</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <label className="text-foreground flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="border-border h-4 w-4 rounded"
            />
            Active
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !canSubmit}>
              {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** yyyy-MM-ddTHH:mm (datetime-local) formatına çevirir — backend ISO döner. */
function toDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}
