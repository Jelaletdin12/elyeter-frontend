/**
 * ⚠️ GET /audit-log response şeması Swagger'da yok (AuditLogController'da
 * @ApiOkResponse yok) — 2026-09-10 curl çıktısından çıkarıldı. SADECE
 * SUPER_ADMIN erişebilir.
 *
 * Örnek aktörler (curl): oldValue:null, newValue:{code,type,value} (kupon
 * oluşturma), metadata:{total:"479.98", source:"cart_checkout"} (status
 * güncelleme sırasında sipariş toplamı).
 */
export type AuditLogEntry = {
  id: string;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue: unknown | null;
  newValue: unknown | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type AuditLogListResponse = {
  items: AuditLogEntry[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

/**
 * GET /audit-log filtreleri — backend `entity|resourceType`, `actorId`,
 * `action` sorgu parametrelerini destekliyor. Hepsi opsiyonel.
 */
export type AuditLogFilters = {
  entity?: string;
  action?: string;
  actorId?: string;
};
