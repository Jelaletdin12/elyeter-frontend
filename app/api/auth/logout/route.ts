import { NextRequest, NextResponse } from 'next/server';

/**
 * docs-json.json: POST /api/v1/auth/logout, body: { refreshToken } (RefreshTokenDto).
 * Backend'in kendisi bu refresh token'ı revoke ediyor olmalı (session invalidation).
 * Bu route httpOnly cookie'den refreshToken'ı okuyup backend'e iletir, sonra cookie'yi
 * siler — client tarafında Zustand'daki clearSession() ayrıca çağrılmalı (bu route
 * sadece server tarafını temizler).
 */

const API_BASE_URL = process.env.API_BASE_URL ?? '';
const API_PREFIX = '/api/v1';
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME ?? 'refresh_token';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (refreshToken) {
    // Backend'in logout'u başarısız olsa bile (örn. token zaten expired) cookie'yi
    // yine de temizliyoruz — kullanıcı için "çıkış yapıldı" durumu her zaman kesin olmalı.
    try {
      await fetch(`${API_BASE_URL}${API_PREFIX}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Backend'e ulaşılamasa dahi client tarafı logout akışı devam etmeli.
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(REFRESH_COOKIE_NAME);
  return response;
}
