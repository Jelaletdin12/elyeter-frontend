import { NextRequest, NextResponse } from 'next/server';

/**
 * 🔴 KRİTİK: Bu route'un app/api/auth/login/route.ts'den TEK farkı — farklı
 * bir cookie adı (admin_refresh_token) kullanması. Neden ayrı: aynı tarayıcıda
 * biri admin panelde giriş yapıp diğer sekmede müşteri sitesini kullanıyorsa,
 * TEK bir paylaşılan refresh_token cookie'si olsaydı müşteri tarafı da
 * yanlışlıkla admin'in oturumunu "görürdü" (AuthHydrator o cookie'yi okuyup
 * admin kullanıcısını client-side state'e yazardı). Admin ve müşteri
 * oturumları backend'de aynı /auth/login endpoint'ini kullansa bile,
 * frontend'de birbirinden TAMAMEN bağımsız iki cookie/oturum olarak tutuluyor.
 *
 * Not: cookie path'i '/' — '/admin' ile sınırlamadık çünkü bu route'un
 * kendisi (/api/admin-auth/refresh) '/admin' altında DEĞİL (middleware'in
 * admin guard'ına takılmaması için bilerek dışarıda, bkz. middleware.ts).
 * İzolasyonu sağlayan şey path değil, FARKLI COOKIE ADI — customer
 * refresh route'u sadece REFRESH_COOKIE_NAME'i okur, bunu asla görmez.
 */

const API_BASE_URL = process.env.API_BASE_URL ?? '';
const API_PREFIX = '/api/v1';
const ADMIN_REFRESH_COOKIE_NAME = process.env.ADMIN_REFRESH_COOKIE_NAME ?? 'admin_refresh_token';

type LoginBackendResponse = {
  success: true;
  data: {
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; fullName: string; role: string };
  };
};

type BackendErrorResponse = { success: false; message: string; timestamp: string };

export async function POST(request: NextRequest) {
  const body: unknown = await request.json();

  const backendRes = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = (await backendRes.json()) as LoginBackendResponse | BackendErrorResponse;

  if (!json.success) {
    return NextResponse.json(json, { status: backendRes.status });
  }

  const { refreshToken, accessToken, user } = json.data;

  const response = NextResponse.json({ success: true, data: { accessToken, user } });

  response.cookies.set(ADMIN_REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
