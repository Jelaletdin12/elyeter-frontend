'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, PackagePlus, Tags } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { productTranslation } from '@/features/products/types';
import { categoryTranslation } from '@/features/categories/types';
import { couponProductScopeOptions, couponCategoryScopeOptions } from '../api/queries';
import {
  useAttachCouponProductMutation,
  useDetachCouponProductMutation,
  useAttachCouponCategoryMutation,
  useDetachCouponCategoryMutation,
} from '../api/mutations';
import type { Coupon } from '../types';

type CouponScopeDialogProps = {
  open: boolean;
  coupon: Coupon | null;
  storeId: string;
  onCancel: () => void;
};

/**
 * Kupon kapsamı yönetimi — ürün/kategori ekleme ve çıkarma.
 * Bağları yöneten 4 mutation (attach/detach × product/category) sadece burada
 * kullanıldığı için parent sayfaya taşınmaz (FRONTEND_AGENTS.md #16).
 *
 * ⚠️ Kupon response'u sadece `productId`/`categoryId` döner (isim değil) —
 * isimleri gösterebilmek için ürün ve kategori listeleri ayrıca çekilip
 * id → isim haritası kurulur.
 */
export function CouponScopeDialog({ open, coupon, storeId, onCancel }: CouponScopeDialogProps) {
  const { data: productsData } = useQuery(couponProductScopeOptions(storeId));
  const { data: categoriesData } = useQuery(couponCategoryScopeOptions(storeId));

  const [productToAdd, setProductToAdd] = useState<string>('');

  const attachProduct = useAttachCouponProductMutation(storeId);
  const detachProduct = useDetachCouponProductMutation(storeId);
  const attachCategory = useAttachCouponCategoryMutation(storeId);
  const detachCategory = useDetachCouponCategoryMutation(storeId);

  const productNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of productsData?.items ?? []) {
      map.set(p.id, productTranslation(p, 'en')?.name ?? p.id);
    }
    return map;
  }, [productsData]);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categoriesData?.items ?? []) {
      map.set(c.id, categoryTranslation(c, 'en')?.name ?? c.id);
    }
    return map;
  }, [categoriesData]);

  // Halihazırda bağlı olmayan ürünler "ekle" select'ine aday.
  const attachableProducts = (productsData?.items ?? []).filter(
    (p) => !coupon?.products.some((link) => link.productId === p.id),
  );
  const attachableCategories = (categoriesData?.items ?? []).filter(
    (c) => !coupon?.categories.some((link) => link.categoryId === c.id),
  );

  async function handleAddProduct() {
    if (!coupon || !productToAdd) return;
    await attachProduct.mutateAsync({ couponId: coupon.id, productId: productToAdd });
    toast.success('Product added to coupon.');
    setProductToAdd('');
  }

  async function handleRemoveProduct(productId: string) {
    if (!coupon) return;
    await detachProduct.mutateAsync({ couponId: coupon.id, productId });
    toast.success('Product removed from coupon.');
  }

  async function handleAddCategory(categoryId: string) {
    if (!coupon) return;
    await attachCategory.mutateAsync({ couponId: coupon.id, categoryId });
    toast.success('Category added to coupon.');
  }

  async function handleRemoveCategory(categoryId: string) {
    if (!coupon) return;
    await detachCategory.mutateAsync({ couponId: coupon.id, categoryId });
    toast.success('Category removed from coupon.');
  }

  const isBusy =
    attachProduct.isPending ||
    detachProduct.isPending ||
    attachCategory.isPending ||
    detachCategory.isPending;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Coupon scope — {coupon?.code}</DialogTitle>
          <DialogDescription>
            Restrict this coupon to specific products or categories. Empty scope means the coupon
            applies to the whole store.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-foreground flex items-center gap-2 text-sm font-medium">
              <PackagePlus size={15} /> Products{' '}
              <StatusBadge tone={coupon?.products.length ? 'success' : 'neutral'}>
                {coupon?.products.length ?? 0}
              </StatusBadge>
            </p>

            {attachableProducts.length > 0 ? (
              <div className="flex gap-2">
                <Select value={productToAdd} onValueChange={setProductToAdd}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add a product…" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {attachableProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {productTranslation(p, 'en')?.name ?? p.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddProduct}
                  disabled={!productToAdd || isBusy}
                >
                  Add
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">No products left to add.</p>
            )}

            {coupon?.products.length ? (
              <ul className="space-y-1.5">
                {coupon.products.map((link) => (
                  <li
                    key={link.productId}
                    className="border-border bg-card flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <span className="text-foreground truncate text-sm">
                      {productNameById.get(link.productId) ?? link.productId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(link.productId)}
                      disabled={isBusy}
                      aria-label="Remove product"
                      className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"
                    >
                      <X size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-foreground flex items-center gap-2 text-sm font-medium">
              <Tags size={15} /> Categories{' '}
              <StatusBadge tone={coupon?.categories.length ? 'success' : 'neutral'}>
                {coupon?.categories.length ?? 0}
              </StatusBadge>
            </p>

            {attachableCategories.length > 0 ? (
              <Select value="" onValueChange={(categoryId) => handleAddCategory(categoryId)}>
                <SelectTrigger
                  className="w-full"
                  // value="" boş iken placeholder görünür; seçim yapıldığında value
                  // resetlenir (uncontrolled Select üzerinden tek-seferlik ekleme).
                >
                  <SelectValue placeholder="Add a category…" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {attachableCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {categoryTranslation(c, 'en')?.name ?? c.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-muted-foreground text-xs">No categories left to add.</p>
            )}

            {coupon?.categories.length ? (
              <ul className="space-y-1.5">
                {coupon.categories.map((link) => (
                  <li
                    key={link.categoryId}
                    className="border-border bg-card flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <span className="text-foreground truncate text-sm">
                      {categoryNameById.get(link.categoryId) ?? link.categoryId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(link.categoryId)}
                      disabled={isBusy}
                      aria-label="Remove category"
                      className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"
                    >
                      <X size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
