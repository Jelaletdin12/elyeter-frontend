'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/ui/sonner';
import { useCart } from './useCart';

interface UseCartItemQuantityOptions {
  variantId: string;
  availableQuantity: number;
  debounceMs?: number;
  onAuthRequired?: () => void;
}

/**
 * Ürün kartı ve sepet satırları için debounce'lu ve optimistik miktar yöneticisi:
 * - Butonlara tıklandığında UI anında (0ms gecikme ile) güncellenir.
 * - Hızlıca arka arkaya tıklansa bile her tıklamada istek gitmez.
 * - Belirlenen süre (varsayılan 450ms) kullanıcı durduğunda tek bir istek atılır.
 * - Sayfadan ayrılma (unmount) durumunda bekleyen değişiklik anında gönderilir.
 */
export function useCartItemQuantity({
  variantId,
  availableQuantity,
  debounceMs = 450,
  onAuthRequired,
}: UseCartItemQuantityOptions) {
  const { getItem, addMutation, updateMutation, removeMutation, isAuthenticated } = useCart();
  const tCommon = useTranslations('common');
  const tCart = useTranslations('cart');

  // Mutasyonları ref'te tut — obje referansları her render'da değişse de
  // effect/callback'leri yeniden tetiklemesin.
  const mutationsRef = useRef({ addMutation, updateMutation, removeMutation });

  const cartItem = getItem(variantId);
  const serverQuantity = cartItem?.quantity ?? 0;

  const [quantity, setQuantity] = useState(serverQuantity);
  const [isPending, setIsPending] = useState(false);

  const serverQuantityRef = useRef(serverQuantity);
  const cartItemRef = useRef(cartItem);

  // Render sırasında ref güncellemesi yasak — commit sonrası effect'te yaz.
  useEffect(() => {
    mutationsRef.current = { addMutation, updateMutation, removeMutation };
    serverQuantityRef.current = serverQuantity;
    cartItemRef.current = cartItem;
  });

  const targetQuantityRef = useRef(serverQuantity);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current === null && !isPending) {
      setQuantity(serverQuantity);
      targetQuantityRef.current = serverQuantity;
    }
  }, [serverQuantity, isPending]);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const targetQty = targetQuantityRef.current;
    const currentServerQty = serverQuantityRef.current;
    const currentItem = cartItemRef.current;
    const { addMutation, updateMutation, removeMutation } = mutationsRef.current;

    if (targetQty === currentServerQty) return;

    setIsPending(true);
    try {
      if (targetQty <= 0) {
        if (currentItem) await removeMutation.mutateAsync(currentItem.id);
      } else if (currentServerQty === 0 || !currentItem) {
        await addMutation.mutateAsync({ productVariantId: variantId, quantity: targetQty });
      } else {
        await updateMutation.mutateAsync({ cartItemId: currentItem.id, quantity: targetQty });
      }
    } catch {
      toast.error(tCart('updateFailed'));
      setQuantity(serverQuantityRef.current);
      targetQuantityRef.current = serverQuantityRef.current;
    } finally {
      setIsPending(false);
    }
  }, [variantId, tCart]); // ← sadece variantId

  // Unmount'ta flush — artık her render'da değil, gerçekten sadece unmount'ta
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        const targetQty = targetQuantityRef.current;
        const currentServerQty = serverQuantityRef.current;
        const currentItem = cartItemRef.current;
        const { addMutation, updateMutation, removeMutation } = mutationsRef.current;

        if (targetQty !== currentServerQty) {
          if (targetQty <= 0 && currentItem) {
            removeMutation.mutate(currentItem.id);
          } else if (currentServerQty === 0 || !currentItem) {
            addMutation.mutate({ productVariantId: variantId, quantity: targetQty });
          } else {
            updateMutation.mutate({ cartItemId: currentItem.id, quantity: targetQty });
          }
        }
      }
    };
  }, [variantId]); // ← sadece variantId, artık gerçek unmount'ta çalışır

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      flush();
    }, debounceMs);
  }, [debounceMs, flush]);

  const increment = useCallback(() => {
    if (!isAuthenticated) {
      onAuthRequired?.() ?? toast.error(tCommon('signInToCart'));
      return;
    }
    if (targetQuantityRef.current >= availableQuantity) return;
    const next = targetQuantityRef.current + 1;
    targetQuantityRef.current = next;
    setQuantity(next);
    scheduleFlush();
  }, [isAuthenticated, availableQuantity, onAuthRequired, scheduleFlush, tCommon]);

  const decrement = useCallback(() => {
    if (!isAuthenticated) {
      onAuthRequired?.() ?? toast.error(tCommon('signInToManageCart'));
      return;
    }
    if (targetQuantityRef.current <= 0) return;
    const next = targetQuantityRef.current - 1;
    targetQuantityRef.current = next;
    setQuantity(next);
    scheduleFlush();
  }, [isAuthenticated, onAuthRequired, scheduleFlush, tCommon]);

  return {
    quantity,
    increment,
    decrement,
    isPending,
    inStock: availableQuantity > 0,
    canIncrement: quantity < availableQuantity,
    canDecrement: quantity > 0,
  };
}
