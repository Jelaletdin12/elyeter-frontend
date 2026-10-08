'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
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
import type { CreateProductVariantInput } from '../types';

interface AddVariantDialogProps {
  open: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateProductVariantInput) => void;
}

/** attributes freeform key-value pairs (color/size etc). */
export function AddVariantDialog({
  open,
  isSubmitting,
  onCancel,
  onSubmit,
}: AddVariantDialogProps) {
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [attributePairs, setAttributePairs] = useState<{ key: string; value: string }[]>([
    { key: '', value: '' },
  ]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const attributes: Record<string, string> = {};
    for (const { key, value } of attributePairs) {
      if (key.trim()) attributes[key.trim()] = value.trim();
    }

    onSubmit({
      sku: sku.trim(),
      price: Number(price),
      compareAtPrice: compareAtPrice !== '' ? Number(compareAtPrice) : undefined,
      initialStock: Number(initialStock),
      lowStockThreshold: 5,
      isActive: true,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
    });

    setSku('');
    setPrice('');
    setCompareAtPrice('');
    setInitialStock('');
    setAttributePairs([{ key: '', value: '' }]);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">New variant</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="variant-sku">SKU *</Label>
            <Input
              id="variant-sku"
              required
              placeholder="e.g. PRD-BLK-M"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="variant-price">Price *</Label>
              <Input
                id="variant-price"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="variant-compare-price">
                Compare-at price <span className="text-muted-foreground text-xs">(opt)</span>
              </Label>
              <Input
                id="variant-compare-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 349.99"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="variant-stock">Initial stock *</Label>
            <Input
              id="variant-stock"
              type="number"
              min="0"
              required
              placeholder="0"
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Attributes
            </Label>
            <div className="space-y-2">
              {attributePairs.map((pair, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Attribute (e.g. Color)"
                    value={pair.key}
                    onChange={(e) =>
                      setAttributePairs((prev) =>
                        prev.map((p, idx) => (idx === i ? { ...p, key: e.target.value } : p)),
                      )
                    }
                  />
                  <Input
                    placeholder="Value (e.g. Red)"
                    value={pair.value}
                    onChange={(e) =>
                      setAttributePairs((prev) =>
                        prev.map((p, idx) => (idx === i ? { ...p, value: e.target.value } : p)),
                      )
                    }
                  />
                  {attributePairs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setAttributePairs((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      aria-label="Remove attribute"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAttributePairs((prev) => [...prev, { key: '', value: '' }])}
              className="mt-1 gap-1 text-xs"
            >
              <Plus className="size-3.5" /> Add attribute
            </Button>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !sku || !price || !initialStock}>
              {isSubmitting ? 'Saving…' : 'Add variant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
