'use client';

import { useState } from 'react';
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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { StockAdjustmentInput } from '../types';

const TYPES: StockAdjustmentInput['type'][] = ['IN', 'OUT', 'ADJUSTMENT', 'RETURN'];
// RESERVE/RELEASE bilerek listede yok — bunlar sipariş akışının kendi
// tetiklediği hareketler, admin'in elle seçmesi anlamlı değil.

export function StockAdjustmentDialog({
  open,
  sku,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  sku: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (input: StockAdjustmentInput) => void;
}) {
  const [type, setType] = useState<StockAdjustmentInput['type']>('IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ type, quantity: Number(quantity), reason: reason.trim() || undefined });
    setQuantity('');
    setReason('');
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock — {sku}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as StockAdjustmentInput['type'])}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <p className="text-xs text-ink-muted">Always positive — direction comes from the type above.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              placeholder="e.g. New shipment received"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !quantity}>
              {isSubmitting ? 'Saving…' : 'Apply'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
