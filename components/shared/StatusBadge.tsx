import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * `Badge`'in kendi `variant` prop'una "success"/"warning" gibi kendi
 * variant'larımızı eklemek yerine bilerek AYRI bir wrapper yaptık:
 * `npx shadcn add badge` her çalıştırıldığında components/ui/badge.tsx
 * CLI'nin vanilya versiyonuyla değişir ve bizim eklediğimiz custom variant'lar
 * SİLİNİR (tam olarak yaşadığımız bug). Bu component Badge'in üzerine sadece
 * className ile renk bindiriyor — Badge dosyası ne zaman güncellenirse
 * güncellensin, bu hep çalışır.
 */
type StatusTone = 'neutral' | 'success' | 'warning' | 'destructive';

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: 'border-transparent bg-background text-muted-foreground',
  success: 'border-transparent bg-sidebar-primary/10 text-sidebar-primary',
  warning: 'border-transparent bg-saffron/20 text-saffron-dark',
  destructive: 'border-transparent bg-destructive/10 text-destructive',
};

export function StatusBadge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: StatusTone;
  className?: string;
  children: React.ReactNode;
}) {
  return <Badge className={cn(TONE_CLASSES[tone], className)}>{children}</Badge>;
}
