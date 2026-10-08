'use client';

import { Eye, Pencil, Trash2, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Tablo satır aksiyonları — tbbank-admin'in tableActions.tsx'inden uyarlandı
 * (FRONTEND_AGENTS.md #16). View/Edit/Delete + ekstra ikon aksiyonları tek
 * bileşende toplanır; her admin sayfası aksiyon hücresini elle yazmaz.
 */
export type TableAction = {
  icon: LucideIcon;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
};

type TableActionsProps = {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  editIcon?: LucideIcon;
  extraActions?: TableAction[];
};

export function TableActions({
  onView,
  onEdit,
  onDelete,
  isDeleting,
  editIcon: EditIcon = Pencil,
  extraActions,
}: TableActionsProps) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      {extraActions?.map((action, i) => (
        <Button
          key={i}
          variant="ghost"
          size="icon"
          onClick={action.onClick}
          disabled={action.disabled}
          aria-label={action.title}
          title={action.title}
          className={action.destructive ? 'text-destructive hover:bg-destructive/10' : undefined}
        >
          <action.icon size={15} />
        </Button>
      ))}

      {onView && (
        <Button variant="ghost" size="icon" onClick={onView} aria-label="View" title="View">
          <Eye size={15} />
        </Button>
      )}

      {onEdit && (
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit" title="Edit">
          <EditIcon size={15} />
        </Button>
      )}

      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={isDeleting}
          aria-label="Delete"
          title="Delete"
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 size={15} />
        </Button>
      )}
    </div>
  );
}
