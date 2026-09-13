import { Inbox, type LucideIcon } from 'lucide-react';

/**
 * FRONTEND_AGENTS.md #16: 2+ route/feature aynı UI parçasını kullanıyorsa
 * components/shared/ altına taşınır. Bu bileşen boş liste durumlarında
 * (admin tabloları, arama sonuçları, sepet, wishlist) ortak kullanılır.
 *
 * İkon varsayılan olarak nötr bir kutu (Inbox) — her çağıran yer kendi
 * bağlamına uygun bir ikon geçebilir (örn. sepet için ShoppingBag).
 */
type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
};

export function EmptyState({ title, description, action, icon: Icon = Inbox }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-card/50 py-16 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-muted-foreground">
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
