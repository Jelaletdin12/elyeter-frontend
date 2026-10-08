'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ScrollText, Search, ShieldAlert, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { auditLogListOptions } from '@/features/audit-log/api/queries';
import type { AuditLogEntry, AuditLogFilters } from '@/features/audit-log/types';
import { DataTable } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * GET /audit-log — SADECE SUPER_ADMIN (backend @Roles). Sayfalanmış
 * {items, meta}, filtreler entity | action | actorId (backend "contains").
 *
 * Detay hücresi: metadata ?? newValue ?? oldValue payload'ı.
 *
 * Güvenlik: role != SUPER_ADMIN ise fetch yapılmaz (enabled) + EmptyState
 * gösterilir. Son söz backend RolesGuard'ındadır.
 *
 * Tipografi kuralı: ana metin text-sm, ikincil metin text-xs muted,
 * teknik değerler Badge içinde. Tüm kontroller h-9.
 */

const getRowId = (row: AuditLogEntry) => row.id;

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const timeFormatter = new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' });

type Payload = { kind: 'New value' | 'Old value' | 'Meta'; value: unknown } | null;

function getPayload(row: AuditLogEntry): Payload {
  if (row.metadata !== null && row.metadata !== undefined) {
    return { kind: 'Meta', value: row.metadata };
  }
  if (row.newValue !== null && row.newValue !== undefined) {
    return { kind: 'New value', value: row.newValue };
  }
  if (row.oldValue !== null && row.oldValue !== undefined) {
    return { kind: 'Old value', value: row.oldValue };
  }
  return null;
}

function stringify(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function FilterField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-muted-foreground text-xs font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}

export default function AdminAuditLogPage() {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState<AuditLogFilters>({});
  const [applied, setApplied] = useState<AuditLogFilters>({});

  // Store değişince 1. sayfaya dön.
  useEffect(() => {
    setPage(1);
  }, [storeId]);

  const { data, isLoading, isFetching } = useQuery({
    ...auditLogListOptions(storeId, page, applied),
    enabled: isSuperAdmin,
    placeholderData: keepPreviousData,
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
  const hasFilters = Boolean(applied.entity || applied.action || applied.actorId);

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    setApplied({
      entity: draft.entity?.trim() || undefined,
      action: draft.action?.trim() || undefined,
      actorId: draft.actorId?.trim() || undefined,
    });
    setPage(1);
  }

  function clearFilters() {
    setDraft({});
    setApplied({});
    setPage(1);
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div>
        <div>
          <h1 className="text-foreground font-serif text-2xl italic">Audit log</h1>
          <p className="text-muted-foreground mt-1 text-sm">{meta?.total ?? 0} recorded actions</p>
        </div>

        <form
          onSubmit={applyFilters}
          className="border-border bg-card mt-6 flex flex-wrap items-end gap-4 rounded-md border p-4"
        >
          <FilterField id="audit-entity" label="Entity">
            <Input
              id="audit-entity"
              value={draft.entity ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, entity: e.target.value }))}
              placeholder="e.g. Order, Coupon"
              className="h-9 w-48 text-sm"
            />
          </FilterField>

          <FilterField id="audit-action" label="Action">
            <Input
              id="audit-action"
              value={draft.action ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, action: e.target.value }))}
              placeholder="e.g. order.status_update"
              className="h-9 w-56 text-sm"
            />
          </FilterField>

          <FilterField id="audit-actor" label="Actor ID">
            <Input
              id="audit-actor"
              value={draft.actorId ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, actorId: e.target.value }))}
              placeholder="User id (partial ok)"
              className="h-9 w-56 text-sm"
            />
          </FilterField>

          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" className="h-9">
              <Search size={14} /> Apply
            </Button>
            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9"
                onClick={clearFilters}
              >
                <X size={14} /> Clear
              </Button>
            )}
          </div>
        </form>

        <div
          className={`mt-6 transition-opacity ${isFetching && !isLoading ? 'opacity-70' : 'opacity-100'}`}
        >
          <DataTable<AuditLogEntry>
            isLoading={isLoading}
            rows={entries}
            getRowId={getRowId}
            emptyTitle="No audit entries"
            emptyDescription="Actions that match your filters will show up here."
            emptyIcon={ScrollText}
            currentPage={meta?.page ?? page}
            totalPages={meta?.totalPages ?? 1}
            totalCount={meta?.total}
            onPageChange={setPage}
            columns={[
              {
                id: 'when',
                header: 'When',
                sortValue: (row) => new Date(row.createdAt).getTime(),
                cell: (row) => {
                  const d = new Date(row.createdAt);
                  return (
                    <div className="whitespace-nowrap">
                      <p className="text-foreground text-sm">{dateFormatter.format(d)}</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {timeFormatter.format(d)}
                      </p>
                    </div>
                  );
                },
              },
              {
                id: 'actor',
                header: 'Actor',
                cell: (row) => (
                  <Badge variant="outline" className="font-mono text-xs font-normal">
                    {shortId(row.actorId)}
                  </Badge>
                ),
              },
              {
                id: 'action',
                header: 'Action',
                sortValue: (row) => row.action,
                cell: (row) => (
                  <Badge variant="secondary" className="font-mono text-xs font-normal">
                    {row.action}
                  </Badge>
                ),
              },
              {
                id: 'entity',
                header: 'Entity',
                sortValue: (row) => row.entity,
                cell: (row) => (
                  <div>
                    <p className="text-foreground text-sm">{row.entity}</p>
                    <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                      #{shortId(row.entityId)}
                    </p>
                  </div>
                ),
              },
              {
                id: 'target',
                header: 'Target',
                cell: (row) => {
                  const payload = getPayload(row);
                  return payload ? (
                    <Badge variant="outline" className="text-xs font-normal">
                      {payload.kind}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  );
                },
              },
              {
                id: 'details',
                header: 'Details',
                cell: (row) => {
                  const payload = getPayload(row);
                  if (!payload) return <span className="text-muted-foreground text-sm">—</span>;

                  const text = stringify(payload.value);
                  let pretty = text;
                  try {
                    pretty = JSON.stringify(payload.value, null, 2);
                  } catch {
                    /* düz metin kalır */
                  }

                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-muted-foreground block max-w-64 cursor-default truncate font-mono text-xs">
                          {text}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="left"
                        className="max-w-md font-mono text-xs break-all whitespace-pre-wrap"
                      >
                        {pretty}
                      </TooltipContent>
                    </Tooltip>
                  );
                },
              },
            ]}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
