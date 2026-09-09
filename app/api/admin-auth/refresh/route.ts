import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL ?? '';
const API_PREFIX = '/api/v1';
const ADMIN_REFRESH_COOKIE_NAME = process.env.ADMIN_REFRESH_COOKIE_NAME ?? 'admin_refresh_token';

type RefreshBackendResponse = {
  success: true;
  data: { accessToken: string; refreshToken: string };
};

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(ADMIN_REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
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
    const response = NextResponse.json(json, { status: backendRes.status || 401 });
    response.cookies.delete(ADMIN_REFRESH_COOKIE_NAME);
    return response;
  }

  const { accessToken, refreshToken: newRefreshToken } = (json as RefreshBackendResponse).data;

  const response = NextResponse.json({ success: true, data: { accessToken } });

  response.cookies.set(ADMIN_REFRESH_COOKIE_NAME, newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
