'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus, History } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth-store';
import {
  useAddVariantMutation,
  useStockAdjustmentMutation,
  useUpdateVariantMutation,
  useDeleteVariantImageMutation,
} from '@/features/products/api/mutations';
import { stockMovementsOptions } from '@/features/products/api/queries';
import { availableQuantity, type ProductVariant } from '@/features/products/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AddVariantDialog } from './AddVariantDialog';
import { EditVariantDialog } from './EditVariantDialog';
import { StockAdjustmentDialog } from './StockAdjustmentDialog';

const MOVEMENT_LABEL: Record<string, string> = {
  IN: 'Stock in',
  OUT: 'Stock out',
  RESERVE: 'Reserved',
  RELEASE: 'Released',
  ADJUSTMENT: 'Adjusted',
  RETURN: 'Returned',
};

interface VariantManagerProps {
  productId: string;
  variants: ProductVariant[];
}

function StockMovementHistory({ productId, variantId }: { productId: string; variantId: string }) {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const { data, isLoading } = useQuery(stockMovementsOptions(storeId, productId, variantId));

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return <p className="text-muted-foreground p-4 text-xs">No movements recorded yet.</p>;
  }

  return (
    <ul className="divide-border/60 divide-y text-xs">
      {data.items.map((m) => {
        const isNegative = m.type === 'OUT' || m.type === 'RESERVE';
        return (
          <li key={m.id} className="flex items-center justify-between px-4 py-2.5">
            <div>
              <span className="text-foreground font-medium">
                {MOVEMENT_LABEL[m.type] ?? m.type}
              </span>
              {m.reason && <span className="text-muted-foreground ml-2">— {m.reason}</span>}
            </div>
            <div className="text-muted-foreground flex items-center gap-3">
              <span>{new Date(m.createdAt).toLocaleString()}</span>
              <Badge
                variant={isNegative ? 'destructive' : 'secondary'}
                className="font-mono text-[11px]"
              >
                {isNegative ? '-' : '+'}
                {m.quantity}
              </Badge>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function VariantManager({ productId, variants }: VariantManagerProps) {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [adjustingVariant, setAdjustingVariant] = useState<ProductVariant | null>(null);
  const [expandedVariantId, setExpandedVariantId] = useState<string | null>(null);

  const addVariant = useAddVariantMutation(storeId);
  const updateVariant = useUpdateVariantMutation(storeId);
  const deleteVariantImage = useDeleteVariantImageMutation(storeId);
  const adjustStock = useStockAdjustmentMutation(storeId);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold">Variants & Stock</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setIsAddOpen(true)}>
          <Plus className="size-4" /> Add variant
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <ul className="divide-border divide-y">
          {variants.map((variant) => {
            const available = availableQuantity(variant);
            const isExpanded = expandedVariantId === variant.id;

            return (
              <li key={variant.id}>
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <p className="text-foreground font-mono text-sm font-semibold">{variant.sku}</p>
                    <p className="text-muted-foreground text-xs">
                      {Object.entries(variant.attributes)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ') || 'No attributes'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="text-foreground font-serif text-sm font-medium italic">
                      ${variant.price}
                    </span>
                    <Badge
                      variant={available > 0 ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {available} in stock
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingVariant(variant)}
                      aria-label="Edit variant"
                      className="gap-1.5 px-2.5"
                    >
                      <Pencil className="size-3.5" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAdjustingVariant(variant)}
                    >
                      Adjust
                    </Button>
                    <Button
                      variant={isExpanded ? 'secondary' : 'ghost'}
                      size="icon-sm"
                      aria-label="Stock history"
                      onClick={() => setExpandedVariantId(isExpanded ? null : variant.id)}
                    >
                      <History className="size-4" />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-border bg-muted/20 border-t">
                    <StockMovementHistory productId={productId} variantId={variant.id} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>

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

      {editingVariant && (
        <EditVariantDialog
          open
          variant={editingVariant}
          isSubmitting={updateVariant.isPending}
          isDeletingImage={deleteVariantImage.isPending}
          onCancel={() => setEditingVariant(null)}
          onSubmit={(input) =>
            updateVariant.mutate(
              { productId, variantId: editingVariant.id, input },
              {
                onSuccess: () => {
                  toast.success('Variant updated.');
                  setEditingVariant(null);
                },
              },
            )
          }
          onDeleteImage={(imageId) =>
            deleteVariantImage.mutate(
              { productId, variantId: editingVariant.id, imageId },
              {
                onSuccess: () => toast.success('Image deleted.'),
              },
            )
          }
        />
      )}

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
    </Card>
  );
}
