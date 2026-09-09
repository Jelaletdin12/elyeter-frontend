import { NextRequest, NextResponse } from 'next/server';

/**
 * FRONTEND_STANDARDS.md #8: Sayfa yenilendiğinde bellek (Zustand) sıfırlanır.
 * Bu route httpOnly cookie'yi okuyup backend'in refresh endpoint'ini çağırır.
 *
 * ✅ DOĞRULANDI (gerçek backend response'u): POST /auth/refresh SADECE
 * { accessToken, refreshToken } döner — user bilgisi YOK.
 *
 * 🔴 KRİTİK: Backend her refresh'te YENİ bir refreshToken üretiyor (rotation) —
 * eski refresh token artık geçersiz. Bu yüzden dönen yeni refreshToken'ı
 * MUTLAKA cookie'ye tekrar yazmamız lazım, yoksa bir sonraki refresh
 * denemesi "invalid refresh token" ile patlar (eski/kullanılmış token'ı
 * tekrar göndermiş oluruz).
 */

const API_BASE_URL = process.env.API_BASE_URL ?? '';
const API_PREFIX = '/api/v1';
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME ?? 'refresh_token';

type RefreshBackendResponse = {
  success: true;
  data: { accessToken: string; refreshToken: string };
};

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    // Bu bir HATA değil — "henüz giriş yapılmamış" durumu. 200 dönüyoruz ki
    // AuthHydrator'ın console'da anlamsız bir "failed to load resource"
    // görünmesine gerek kalmasın; client success:false'a bakarak karar verir.
    return NextResponse.json({
      success: false,
      message: 'errors.no_refresh_token',
      timestamp: new Date().toISOString(),
    });
  }

  const backendRes = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const json: unknown = await backendRes.json();

  const isSuccess =
    backendRes.ok &&
    typeof json === 'object' &&
    json !== null &&
    (json as { success?: unknown }).success === true;

  if (!isSuccess) {
    // Refresh token geçersiz/revoked — cookie'yi temizle, client logout akışını tetiklesin.
    const response = NextResponse.json(json, { status: backendRes.status || 401 });
    response.cookies.delete(REFRESH_COOKIE_NAME);
    return response;
  }

  const { accessToken, refreshToken: newRefreshToken } = (json as RefreshBackendResponse).data;

  const response = NextResponse.json({ success: true, data: { accessToken } });

  // Rotation: backend'in verdiği YENİ refresh token'ı yaz, eskisi artık ölü.
  response.cookies.set(REFRESH_COOKIE_NAME, newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
