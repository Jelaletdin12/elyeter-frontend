'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { auditLogListOptions } from '@/features/audit-log/api/queries';
import type { AuditLogEntry, AuditLogFilters } from '@/features/audit-log/types';
import { DataTable } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * GET /audit-log — SADECE SUPER_ADMIN (backend @Roles). Sayfalanmış
 * {items, meta} (users/coupons ile AYNI desen), filtreler entity|resourceType,
 * action, actorId (hepsi opsiyonel, backend "contains" ile eşleştiriyor).
 *
 * Detay hücresi: kaydın payload'ı metadata ?? newValue ?? oldValue olarak
 * render edilir — örn. kupon oluşturma `{code,type,value}` (newValue), sipariş
 * durum güncellemesi `{total:"479.98", source:"cart_checkout"}` (metadata).
 *
 * Güvenlik notu: sayfa girişi "enabled" ile engelleniyor (role != SUPER_ADMIN
 * olunca hiç fetch yok) + render tarafında EmptyState gösteriliyor — RolesGuard
 * zaten backend'de son sözü söylüyor.
 */

function formatDetails(row: AuditLogEntry): string {
  const payload = row.metadata ?? row.newValue ?? row.oldValue;
  if (payload === null || payload === undefined) return '—';
  try {
    return typeof payload === 'string' ? payload : JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

export default function AdminAuditLogPage() {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState<AuditLogFilters>({});
  const [applied, setApplied] = useState<AuditLogFilters>({});

  const { data, isLoading } = useQuery({
    ...auditLogListOptions(storeId, page, applied),
    enabled: isSuperAdmin,
  });

  if (!isSuperAdmin) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Admin access required"
        description="Only administrators can view the audit log."
      />
    );
  }

  const entries = data?.items ?? [];
  const meta = data?.meta;

  function applyFilters() {
    setApplied({
      entity: draft.entity?.trim() || undefined,
      action: draft.action?.trim() || undefined,
      actorId: draft.actorId?.trim() || undefined,
    });
    setPage(1);
  }

  return (
    <div>
      <div>
        <h1 className="font-serif text-foreground text-2xl italic">Audit log</h1>
        <p className="text-muted-foreground mt-1 text-sm">{meta?.total ?? 0} recorded actions</p>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="audit-entity" className="text-muted-foreground text-xs">
            Entity
          </label>
          <Input
            id="audit-entity"
            value={draft.entity ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, entity: e.target.value }))}
            placeholder="e.g. Order, Coupon"
            className="w-44"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="audit-action" className="text-muted-foreground text-xs">
            Action
          </label>
          <Input
            id="audit-action"
            value={draft.action ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, action: e.target.value }))}
            placeholder="e.g. updated_status"
            className="w-44"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="audit-actor" className="text-muted-foreground text-xs">
            Actor ID
          </label>
          <Input
            id="audit-actor"
            value={draft.actorId ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, actorId: e.target.value }))}
            placeholder="User id (partial ok)"
            className="w-56"
          />
        </div>
        <Button variant="outline" size="sm" onClick={applyFilters}>
          Apply filters
        </Button>
        {(applied.entity || applied.action || applied.actorId) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft({});
              setApplied({});
              setPage(1);
            }}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="mt-6">
        <DataTable<AuditLogEntry>
          isLoading={isLoading}
          rows={entries}
          getRowId={(row) => row.id}
          emptyTitle="No audit entries"
          emptyDescription="Actions that match your filters will show up here."
          emptyIcon={ScrollText}
          columns={[
            {
              header: 'When',
              cell: (row) => (
                <span className="text-muted-foreground text-sm whitespace-nowrap">
                  {new Date(row.createdAt).toLocaleString()}
                </span>
              ),
            },
            {
              header: 'Actor',
              cell: (row) => (
                <span className="text-muted-foreground font-mono text-xs">{shortId(row.actorId)}</span>
              ),
            },
            {
              header: 'Action',
              cell: (row) => <span className="text-foreground font-mono text-xs">{row.action}</span>,
            },
            {
              header: 'Entity',
              cell: (row) => (
                <div>
                  <p className="text-foreground text-sm font-medium">{row.entity}</p>
                  <p className="text-muted-foreground font-mono text-xs">#{shortId(row.entityId)}</p>
                </div>
              ),
            },
            {
              header: 'Target',
              cell: (row) => (
                <span className="text-muted-foreground font-mono text-xs">
                  {row.newValue !== null && row.newValue !== undefined
                    ? 'New value'
                    : row.oldValue !== null && row.oldValue !== undefined
                      ? 'Old value'
                      : row.metadata !== null && row.metadata !== undefined
                        ? 'Meta'
                        : '—'}
                </span>
              ),
            },
            {
              header: 'Details',
              cell: (row) => {
                const details = formatDetails(row);
                return details === '—' ? (
                  <span className="text-muted-foreground text-sm">—</span>
                ) : (
                  <span
                    title={details}
                    className="text-muted-foreground block max-w-56 truncate font-mono text-xs"
                  >
                    {details}
                  </span>
                );
              },
            },
          ]}
        />
      </div>

      {(meta?.totalPages ?? 0) > 1 && (
        <div className="text-muted-foreground mt-4 flex items-center justify-between text-sm">
          <p>
            Page {meta?.page} of {meta?.totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft size={14} /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= (meta?.totalPages ?? 1)}
            >
              Next <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
