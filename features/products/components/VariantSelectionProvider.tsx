'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ProductVariant } from '../types';

interface VariantSelectionContextValue {
  selectedVariant: ProductVariant | null;
  selectedVariantId: string;
  selectVariant: (variantId: string) => void;
}

/**
 * PDP'nin iki ayrı grid hücresindeki client bileşenleri (görsel galerisi solda,
 * varyant seçici sağda) aynı seçim durumunu paylaşır — varyant seçilince galeri
 * o varyantın kendi görsellerine geçer. Server Component'in çocuklarını client
 * provider'a props olarak geçmesi mümkün olduğu için sayfa yapısı değişmez.
 */
const VariantSelectionContext = createContext<VariantSelectionContextValue | null>(null);

export function VariantSelectionProvider({
  variants,
  children,
}: {
  variants: ProductVariant[];
  children: ReactNode;
}) {
  const activeVariants = useMemo(() => variants.filter((variant) => variant.isActive), [variants]);

  const [selectedVariantId, setSelectedVariantId] = useState(activeVariants[0]?.id ?? '');

  const selectedVariant =
    activeVariants.find((variant) => variant.id === selectedVariantId) ?? activeVariants[0] ?? null;

  return (
    <VariantSelectionContext.Provider
      value={{ selectedVariant, selectedVariantId, selectVariant: setSelectedVariantId }}
    >
      {children}
    </VariantSelectionContext.Provider>
  );
}

export function useVariantSelection(): VariantSelectionContextValue {
  const ctx = useContext(VariantSelectionContext);
  if (!ctx) {
    throw new Error('useVariantSelection must be used within a VariantSelectionProvider');
  }
  return ctx;
}
