'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, History } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth-store';
import {
  useAddVariantMutation,
  useStockAdjustmentMutation,
} from '@/features/products/api/mutations';
import { stockMovementsOptions } from '@/features/products/api/queries';
import { availableQuantity, type ProductVariant } from '@/features/products/types';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AddVariantDialog } from './AddVariantDialog';
import { StockAdjustmentDialog } from './StockAdjustmentDialog';

const MOVEMENT_LABEL: Record<string, string> = {
  IN: 'Stock in',
  OUT: 'Stock out',
  RESERVE: 'Reserved',
  RELEASE: 'Released',
  ADJUSTMENT: 'Adjusted',
  RETURN: 'Returned',
};

function StockMovementHistory({ productId, variantId }: { productId: string; variantId: string }) {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const { data, isLoading } = useQuery(stockMovementsOptions(storeId, productId, variantId));

  if (isLoading) return <p className="text-muted-foreground p-3 text-xs">Loading…</p>;
  if (!data || data.items.length === 0)
    return <p className="text-muted-foreground p-3 text-xs">No movements yet.</p>;

  return (
    <ul className="divide-border divide-y">
      {data.items.map((m) => (
        <li key={m.id} className="flex items-center justify-between px-3 py-2 text-xs">
          <div>
            <span className="text-foreground font-medium">{MOVEMENT_LABEL[m.type] ?? m.type}</span>
            <span className="text-muted-foreground ml-2">{m.reason ?? '—'}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-3">
            <span>{new Date(m.createdAt).toLocaleString()}</span>
            <span
              className={
                m.type === 'OUT'
                  ? 'text-destructive font-medium'
                  : 'text-sidebar-primary font-medium'
              }
            >
              {m.type === 'OUT' ? '-' : '+'}
              {m.quantity}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function VariantManager({
  productId,
  variants,
}: {
  productId: string;
  variants: ProductVariant[];
}) {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [adjustingVariant, setAdjustingVariant] = useState<ProductVariant | null>(null);
  const [expandedVariantId, setExpandedVariantId] = useState<string | null>(null);

  const addVariant = useAddVariantMutation(storeId);
  const adjustStock = useStockAdjustmentMutation(storeId);

  return (
    <div className="border-border rounded-md border">
      <div className="border-border flex items-center justify-between border-b p-4">
        <p className="text-foreground text-sm font-medium">Variants</p>
        <Button size="sm" variant="outline" onClick={() => setIsAddOpen(true)}>
          <Plus size={14} /> Add variant
        </Button>
      </div>

      <ul className="divide-border divide-y">
        {variants.map((variant) => {
          const available = availableQuantity(variant);
          const isExpanded = expandedVariantId === variant.id;

          return (
            <li key={variant.id}>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-foreground text-sm font-medium">{variant.sku}</p>
                  <p className="text-muted-foreground text-xs">
                    {Object.entries(variant.attributes)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' · ') || 'No attributes'}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-foreground font-serif text-sm italic">{variant.price}</span>
                  <StatusBadge tone={available > 0 ? 'success' : 'destructive'}>
                    {available} in stock
                  </StatusBadge>
                  <Button variant="outline" size="sm" onClick={() => setAdjustingVariant(variant)}>
                    Adjust
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Stock history"
                    onClick={() => setExpandedVariantId(isExpanded ? null : variant.id)}
                  >
                    <History size={15} />
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-border bg-background border-t">
                  <StockMovementHistory productId={productId} variantId={variant.id} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <AddVariantDialog
        open={isAddOpen}
        isSubmitting={addVariant.isPending}
        onCancel={() => setIsAddOpen(false)}
        onSubmit={(input) =>
          addVariant.mutate(
            { productId, input },
            {
              onSuccess: () => {
                toast.success('Variant added.');
                setIsAddOpen(false);
              },
            },
          )
        }
      />

      {adjustingVariant && (
        <StockAdjustmentDialog
          open
          sku={adjustingVariant.sku}
          isSubmitting={adjustStock.isPending}
          onCancel={() => setAdjustingVariant(null)}
          onSubmit={(input) =>
            adjustStock.mutate(
              { productId, variantId: adjustingVariant.id, input },
              {
                onSuccess: () => {
                  toast.success('Stock updated.');
                  setAdjustingVariant(null);
                },
              },
            )
          }
        />
      )}
    </div>
  );
}
