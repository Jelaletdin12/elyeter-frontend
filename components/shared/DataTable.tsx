import type { LucideIcon } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { EmptyState } from './EmptyState';

/**
 * Admin ürün/kategori/sipariş/kullanıcı listeleri bu generic tabloyu paylaşır
 * (FRONTEND_AGENTS.md #16). `any` yasak olduğu için generic <T> ile
 * tip güvenliği korunur (bkz. FRONTEND_AGENTS.md #2).
 */
type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  emptyTitle: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  isLoading?: boolean;
};

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  isLoading,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-card bg-paper" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.header}>{col.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={getRowId(row)}>
            {columns.map((col) => (
              <TableCell key={col.header} className={col.className}>
                {col.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
