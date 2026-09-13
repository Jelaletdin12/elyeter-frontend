'use client';

import { Eye, Pencil, Trash2, type LucideIcon } from 'lucide-react';

/**
 * Tablo satırı ikon aksiyonları — tbbank-admin'in tableActions.tsx
 * mantığı (FRONTEND_AGENTS.md #16). Icon-only, hover state'li; opsiyonel
 * `extraActions` ekstra ikonlar (örn. görüntüleme) tanımlar. Menü onayı
 * (onDelete -> ConfirmDialog) sayfa tarafında yapılır.
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

const baseClass = 'text-muted-foreground p-1.5 rounded transition-colors disabled:opacity-50';

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
        <button
          key={i}
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          title={action.title}
          aria-label={action.title}
          className={`${baseClass} ${
            action.destructive
              ? 'hover:bg-destructive/10 hover:text-destructive'
              : 'hover:bg-background hover:text-foreground'
          }`}
        >
          <action.icon size={15} />
        </button>
      ))}

      {onView && (
        <button
          type="button"
          onClick={onView}
          title="View"
          aria-label="View"
          className="text-muted-foreground hover:bg-background hover:text-foreground rounded p-1.5 transition-colors"
        >
          <Eye size={15} />
        </button>
      )}

      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          title="Edit"
          aria-label="Edit"
          className="text-muted-foreground hover:bg-background hover:text-foreground rounded p-1.5 transition-colors"
        >
          <EditIcon size={15} />
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          title="Delete"
          aria-label="Delete"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded p-1.5 transition-colors disabled:opacity-50"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
