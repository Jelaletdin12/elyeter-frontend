/**
 * Backend'in { success, data } / { success: false, message, timestamp } sözleşmesini
 * unwrap eden TEK nokta. FRONTEND_AGENTS.md #3: component içinde manuel res.json()
 * veya if (!success) kontrolü yazılmaz — her API çağrısı bu fonksiyondan geçer.
 *
 * Kullanım:
 * - Server Component / ISR sayfa: apiFetch(path, { next: { revalidate, tags } })
 * - Client Component / TanStack queryFn: apiFetch(path, { cache: 'no-store' })
 * İkisi de aynı fonksiyon; tek fark çağrı yerinde geçirilen cache opsiyonu (bkz.
 * FRONTEND_STANDARDS.md #7) — iki ayrı client yazılmaz.
 */

/**
 * Backend'in Swagger şeması (docs-json.json) tüm endpoint'leri /api/v1 altında
 * yayınlıyor (örn. POST /api/v1/auth/login) — bu prefix burada TEK yerde
 * tanımlanır, feature dosyaları '/auth/login' gibi kısa path yazmaya devam eder.
 */
export const API_PREFIX = '/api/v1';

type ApiSuccess<T> = { success: true; data: T; message?: string };
type ApiError = { success: false; message: string; timestamp: string };
type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * message alanı backend'den i18n key olarak gelir (örn. "errors.product_not_found").
 * Bu key component içinde çözülmez — TanStack'in global onError'ında
 * (bkz. providers/QueryProvider.tsx + lib/errors/error-messages.ts) çözülüp
 * tek bir toast (sonner) ile gösterilir.
 */
export class ApiClientError extends Error {
  readonly status: number;
  readonly i18nKey: string;

  constructor(i18nKey: string, status: number) {
    super(i18nKey);
    this.name = 'ApiClientError';
    this.i18nKey = i18nKey;
    this.status = status;
  }
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as { success: unknown }).success === 'boolean'
  );
}

interface ApiFetchOptions extends Omit<RequestInit, 'cache'> {
  /** Server Component ISR sayfaları için: { revalidate, tags } */
  next?: NextFetchRequestConfig;
  /** Client tarafı / private sayfalar için: 'no-store' (bkz. FRONTEND_STANDARDS.md #4) */
  cache?: RequestCache;
  /** Access token'ı elle geçirmek için (interceptor 401 retry akışında kullanır) */
  accessToken?: string;
}

function resolveBaseUrl(): string {
  // Server tarafında (RSC/route handler) API_BASE_URL, client tarafında
  // NEXT_PUBLIC_API_BASE_URL kullanılır — ikisi genelde aynı backend'i işaret eder.
  if (typeof window === 'undefined') {
    return process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { next, cache, accessToken, headers, body, ...rest } = options;

  const baseUrl = resolveBaseUrl();

  if (!baseUrl) {
    // Node'un fetch'i (Server Component/route handler tarafı) relative URL kabul
    // etmez ve "Failed to parse URL" gibi anlamsız bir hata fırlatır — bu guard
    // sorunun gerçek kaynağını (.env.local eksik) net şekilde gösterir.
    throw new Error(
      'API base URL tanımlı değil. .env.local dosyasında API_BASE_URL ve ' +
        "NEXT_PUBLIC_API_BASE_URL ayarlandığından ve dev server'ın yeniden " +
        'başlatıldığından emin ol (bkz. .env.example).',
    );
  }

  // FormData (örn. useMediaUpload) için Content-Type'ı tarayıcının kendi
  // boundary'siyle set etmesine izin ver — elle 'application/json' yazılırsa
  // multipart isteği bozulur.
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const res = await fetch(`${baseUrl}${API_PREFIX}${path}`, {
    ...rest,
    body,
    next,
    cache,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  // 204 No Content gibi body'siz yanıtlar (örn. DELETE) — unwrap edilecek bir şey yok.
  if (res.status === 204) {
    return undefined as T;
  }

  const json: unknown = await res.json();

  if (!isApiResponse(json)) {
    throw new ApiClientError('errors.unexpected_response', res.status);
  }

  if (!json.success) {
    throw new ApiClientError(json.message, res.status);
  }

  return json.data as T;
}
