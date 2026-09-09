import { EmptyState } from './EmptyState';

/**
 * categories/banners/orders admin sayfaları için ortak "henüz hazır değil"
 * paneli — üç ayrı sayfada aynı markup'ı tekrar etmemek için
 * (FRONTEND_AGENTS.md #16). Bu sayfalar için gerçek API request/response
 * örnekleri geldiğinde bu component kaldırılıp users/products'taki gibi
 * gerçek DataTable + mutation'lar yazılacak.
 */
export function ComingSoonPanel({ feature }: { feature: string }) {
  return (
    <EmptyState
      title={`${feature} management is not wired up yet`}
      description="Waiting on confirmed API request/response shapes for this endpoint group before building the real CRUD flow."
    />
  );
}
