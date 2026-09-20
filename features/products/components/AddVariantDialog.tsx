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

/** attributes serbest key-value (renk/beden gibi sabit alan isimleri hardcode edilmiyor). */
export function AddVariantDialog({
  open,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateProductVariantInput) => void;
}) {
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
      sku,
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New variant</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="variant-sku">SKU</Label>
            <Input id="variant-sku" required value={sku} onChange={(e) => setSku(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="variant-price">Price</Label>
              <Input
                id="variant-price"
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="variant-compare-price">
                Compare-at price <span className="text-muted-foreground">(optional)</span>
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
            <Label htmlFor="variant-stock">Initial stock</Label>
            <Input
              id="variant-stock"
              type="number"
              min="0"
              required
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Attributes</Label>
            {attributePairs.map((pair, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="color"
                  value={pair.key}
                  onChange={(e) =>
                    setAttributePairs((prev) =>
                      prev.map((p, idx) => (idx === i ? { ...p, key: e.target.value } : p)),
                    )
                  }
                />
                <Input
                  placeholder="Red"
                  value={pair.value}
                  onChange={(e) =>
                    setAttributePairs((prev) =>
                      prev.map((p, idx) => (idx === i ? { ...p, value: e.target.value } : p)),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setAttributePairs((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label="Remove attribute"
                >
                  <X size={14} />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAttributePairs((prev) => [...prev, { key: '', value: '' }])}
            >
              <Plus size={14} /> Add attribute
            </Button>
          </div>

          <DialogFooter>
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
