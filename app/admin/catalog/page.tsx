'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Download,
  FileSpreadsheet,
  ShieldAlert,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileUp,
  Database,
  Trash2,
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { importCatalogFile } from '@/features/catalog/api/import';
import { cleanupOrphanedMedia } from '@/features/catalog/api/cleanup';
import {
  downloadCatalogFile,
  resolveDownloadError,
  type CatalogFormat,
} from '@/features/catalog/api/download';
import {
  resolveCatalogMessage,
  type CatalogImportResult,
  type MediaCleanupResult,
  MEDIA_CONTEXT_LABELS,
} from '@/features/catalog/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';

/**
 * Katalog CSV/XLSX import & export — backend CatalogIoController
 * (GET /catalog/export, GET /catalog/template, POST /catalog/import),
 * @Roles(SUPER_ADMIN, ADMIN, OPERATOR) → sidebar "Catalog" + bu render
 * aynı yetkiyle açılır; gerçek sınır backend (FRONTEND_AGENTS.md #9).
 *
 * - Export/template indirmesi /api/admin/catalog/download proxy'si üzerinden
 *   (apiFetch JSON unwrap ettiği için binary alamaz; route handler da backend
 *   refresh token rotasyonunu cookie'ye yazar).
 * - Import FormData multipart (medya upload deseni), backend max 5 MB,
 *   500 satır; satır hataları `errors: [{ row, message }]` döner — message
 *   i18n key'i resolveCatalogMessage ile okunura çevrilir.
 */
export default function AdminCatalogPage() {
  const { can } = useAuth();
  const [format, setFormat] = useState<CatalogFormat>('xlsx');
  const [templateFormat, setTemplateFormat] = useState<CatalogFormat>('xlsx');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<CatalogImportResult | null>(null);
  const [busy, setBusy] = useState<'export' | 'template' | null>(null);
  const [cleanupResult, setCleanupResult] = useState<MediaCleanupResult | null>(null);
  const [cleanupBusy, setCleanupBusy] = useState(false);
  const [cleanupDeleting, setCleanupDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useMutation({
    mutationFn: importCatalogFile,
    onSuccess: (res) => {
      setResult(res);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (res.applied && res.errors.length === 0) {
        toast.success(`Catalog imported: ${res.created} created, ${res.updated} updated.`);
      } else {
        toast.error(`Import finished with ${res.errors.length} row error(s).`);
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? resolveCatalogMessage(error.message) : 'Import failed.';
      toast.error(message);
    },
  });

  async function handleDownload(type: 'export' | 'template', fmt: CatalogFormat) {
    setBusy(type);
    try {
      await downloadCatalogFile(type, fmt);
    } catch (error) {
      toast.error(resolveDownloadError(error instanceof Error ? error.message : error));
    } finally {
      setBusy(null);
    }
  }

  async function handleScan() {
    setCleanupBusy(true);
    try {
      const res = await cleanupOrphanedMedia(true);
      setCleanupResult(res);
      toast.success(
        res.totalOrphaned === 0
          ? 'No unused images found.'
          : `${res.totalOrphaned} unused image(s) found.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? resolveCatalogMessage(error.message) : 'Scan failed.');
    } finally {
      setCleanupBusy(false);
    }
  }

  async function handleDeleteOrphans() {
    if (!cleanupResult || cleanupResult.totalOrphaned === 0) return;
    setCleanupDeleting(true);
    try {
      const res = await cleanupOrphanedMedia(false);
      setCleanupResult(res);
      toast.success(`${res.totalDeleted} unused image(s) deleted from storage.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? resolveCatalogMessage(error.message) : 'Cleanup failed.',
      );
    } finally {
      setCleanupDeleting(false);
    }
  }

  if (!can('catalog.import')) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Admin access required"
        description="Only administrators and operators can import or export the catalog."
      />
    );
  }

  function formatToggle(key: 'export' | 'template') {
    const value = key === 'export' ? format : templateFormat;
    const onChange = key === 'export' ? setFormat : setTemplateFormat;
    return (
      <div className="has-[[data-state=active]]:grid-cols-2 flex items-center gap-1 rounded-md border p-0.5 text-xs">
        {(['xlsx', 'csv'] as CatalogFormat[]).map((f) => (
          <button
            key={f}
            type="button"
            data-state={value === f ? 'active' : 'idle'}
            onClick={() => onChange(f)}
            className={
              value === f
                ? 'bg-sidebar-primary rounded px-3 py-1.5 font-medium text-white'
                : 'text-muted-foreground hover:text-foreground rounded px-3 py-1.5 uppercase'
            }
          >
            {f}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground font-serif text-2xl italic">Catalog</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Import and export the full product catalog as XLSX or CSV (max 500 rows).
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download size={16} />
              Export
            </CardTitle>
            <CardDescription>
              Downloads the current catalog with all product variants, translations and prices.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            {formatToggle('export')}
            <Button
              size="sm"
              onClick={() => handleDownload('export', format)}
              disabled={busy !== null}
            >
              {busy === 'export' ? 'Exporting…' : 'Export'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet size={16} />
              Template
            </CardTitle>
            <CardDescription>
              Empty file with the exact column order the import endpoint expects.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            {formatToggle('template')}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload('template', templateFormat)}
              disabled={busy !== null}
            >
              {busy === 'template' ? 'Downloading…' : 'Template'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload size={16} />
              Import
            </CardTitle>
            <CardDescription>
              Upload a filled template (.xlsx, .xls or .csv, max 5 MB) to create or update
              products by SKU.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="border-border bg-background hover:border-sidebar-primary flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2.5 text-sm">
              <FileUp size={15} className="text-muted-foreground shrink-0" />
              <span className="text-muted-foreground truncate">
                {file ? file.name : 'Choose file…'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setResult(null);
                }}
              />
            </label>
            <Button
              className="w-full"
              size="sm"
              onClick={() => file && importMutation.mutate(file)}
              disabled={!file || importMutation.isPending}
            >
              {importMutation.isPending ? 'Importing…' : 'Upload & import'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Database size={16} />
              Storage cleanup
            </span>
            <span className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleScan}
                disabled={cleanupBusy || cleanupDeleting}
              >
                {cleanupBusy ? 'Scanning…' : 'Scan for unused images'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteOrphans}
                disabled={!cleanupResult || cleanupResult.totalOrphaned === 0 || cleanupDeleting}
              >
                <Trash2 size={14} />
                {cleanupDeleting
                  ? 'Deleting…'
                  : `Delete ${cleanupResult?.totalOrphaned ?? 0} unused`}
              </Button>
            </span>
          </CardTitle>
          <CardDescription>
            Scans MinIO buckets for objects no longer referenced by any product, banner, brand,
            category or pending upload. Deletes them permanently.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cleanupResult ? (
            <div className="space-y-3">
              <div className="border-border overflow-hidden rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-muted-foreground border-border border-b text-left text-xs tracking-wider uppercase">
                    <tr>
                      <th className="px-3 py-2">Storage</th>
                      <th className="px-3 py-2 text-right">Objects</th>
                      <th className="px-3 py-2 text-right">Referenced</th>
                      <th className="px-3 py-2 text-right">Unused</th>
                      <th className="px-3 py-2 text-right">Deleted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cleanupResult.buckets.map((b) => (
                      <tr key={b.context} className="border-border border-b last:border-b-0">
                        <td className="text-foreground px-3 py-2 font-medium">
                          {MEDIA_CONTEXT_LABELS[b.context]}
                          <span className="text-muted-foreground ml-2 font-mono text-xs">
                            {b.bucket}
                          </span>
                        </td>
                        <td className="text-muted-foreground px-3 py-2 text-right font-mono text-xs">
                          {b.totalObjects}
                        </td>
                        <td className="text-muted-foreground px-3 py-2 text-right font-mono text-xs">
                          {b.referenced}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs">
                          {b.orphaned > 0 ? (
                            <span className="text-destructive font-semibold">{b.orphaned}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="text-muted-foreground px-3 py-2 text-right font-mono text-xs">
                          {b.deleted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-muted-foreground text-xs">
                {cleanupResult.dryRun
                  ? 'Last scan was a dry run — nothing was deleted.'
                  : 'Orphans have been removed from storage.'}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No scan yet — run a scan to see which images are no longer in use.
            </p>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                result.applied && result.errors.length === 0
                  ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium'
                  : 'border-amber-400/40 bg-amber-400/10 text-amber-300 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium'
              }
            >
              {result.applied && result.errors.length === 0 ? (
                <CheckCircle2 size={15} />
              ) : (
                <AlertTriangle size={15} />
              )}
              {result.created} created · {result.updated} updated
            </span>
            {result.errors.length > 0 && (
              <span className="text-muted-foreground text-sm">
                {result.errors.length} invalid row(s) skipped
              </span>
            )}
          </div>

          {result.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Row errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-border overflow-hidden rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60 text-muted-foreground border-border border-b text-left text-xs tracking-wider uppercase">
                      <tr>
                        <th className="px-3 py-2">Row</th>
                        <th className="px-3 py-2">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((err) => (
                        <tr key={err.row} className="border-border border-b last:border-b-0">
                          <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                            {err.row}
                          </td>
                          <td className="text-foreground px-3 py-2">
                            {resolveCatalogMessage(err.message)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}