import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin catalog indirme proxy'si (export/template). Tarayıcı binary'yi
 * apiFetch ile alamaz (apiFetch JSON unwrap eder) — bu route handler;
 *   1) admin_refresh_token cookie'siyle backend'den taze accessToken alır,
 *   2) backend /catalog/{export|template}?format= ü sütlarını döndürür,
 *   3) yeni refresh token'ı cookie'ye yazar (backend ROTATE ediyor — eski
 *      token tekrar kullanılırsa çalışmaz, bkz. auth.service.ts refresh).
 *
 * Role erişimi: backend CatalogIoController zaten @Roles(SUPER_ADMIN, ADMIN,
 * OPERATOR) — burada da UI sadece o rollerin (can('catalog.*')) butonlarına
 * render eder; gerçek sınır backend'de (FRONTEND_AGENTS.md #8).
 */
export const dynamic = 'force-dynamic';

const API_BASE_URL = process.env.API_BASE_URL ?? '';
const API_PREFIX = '/api/v1';
const ADMIN_REFRESH_COOKIE_NAME = process.env.ADMIN_REFRESH_COOKIE_NAME ?? 'admin_refresh_token';

type RefreshBackendResponse = {
  success: true;
  data: { accessToken: string; refreshToken: string };
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type') === 'template' ? 'template' : 'export';
  const format = searchParams.get('format') === 'csv' ? 'csv' : 'xlsx';

  const refreshToken = request.cookies.get(ADMIN_REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) {
    return NextResponse.json(
      { success: false, message: 'errors.no_refresh_token', timestamp: new Date().toISOString() },
      { status: 401 },
    );
  }

  const refreshRes = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const refreshJson: unknown = await refreshRes.json();
  const isOk =
    refreshRes.ok &&
    typeof refreshJson === 'object' &&
    refreshJson !== null &&
    (refreshJson as { success?: unknown }).success === true;

  if (!isOk) {
    const response = NextResponse.json(refreshJson, { status: refreshRes.status || 401 });
    response.cookies.delete(ADMIN_REFRESH_COOKIE_NAME);
    return response;
  }

  const { accessToken, refreshToken: newRefreshToken } = (refreshJson as RefreshBackendResponse).data;

  const fileRes = await fetch(
    `${API_BASE_URL}${API_PREFIX}/catalog/${type}?format=${format}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!fileRes.ok) {
    const response = NextResponse.json(
      { success: false, message: 'errors.catalog_export_failed', timestamp: new Date().toISOString() },
      { status: fileRes.status },
    );
    response.cookies.set(ADMIN_REFRESH_COOKIE_NAME, newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  }

  const contentType =
    fileRes.headers.get('content-type') ??
    (format === 'csv'
      ? 'text/csv'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  const disposition =
    fileRes.headers.get('content-disposition') ?? `attachment; filename="catalog-${type}.${format}"`;
  const headers = new Headers(fileRes.headers);
  headers.set('Content-Type', contentType);
  headers.set('Content-Disposition', disposition);

  const arrayBuffer = await fileRes.arrayBuffer();
  const response = new NextResponse(new Uint8Array(arrayBuffer), { status: 200, headers });

  response.cookies.set(ADMIN_REFRESH_COOKIE_NAME, newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}