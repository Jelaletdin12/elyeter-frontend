import { NextRequest, NextResponse } from 'next/server';

/**
 * login/route.ts ile birebir aynı pattern — RegisterDto: { email, password,
 * fullName }, response şekli login ile aynı (accessToken/refreshToken/user).
 * Backend register'da da otomatik login yapıyor (token dönüyor), bu yüzden
 * register sonrası ayrıca login çağrısı yapmaya gerek yok.
 */

const API_BASE_URL = process.env.API_BASE_URL ?? '';
const API_PREFIX = '/api/v1';
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME ?? 'refresh_token';

type RegisterBackendResponse = {
  success: true;
  data: {
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; fullName: string; role: string };
  };
};

type BackendErrorResponse = {
  success: false;
  message: string;
  timestamp: string;
};

export async function POST(request: NextRequest) {
  const body: unknown = await request.json();

  const backendRes = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = (await backendRes.json()) as RegisterBackendResponse | BackendErrorResponse;

  if (!json.success) {
    return NextResponse.json(json, { status: backendRes.status });
  }

  const { refreshToken, accessToken, user } = json.data;

  const response = NextResponse.json({
    success: true,
    data: { accessToken, user },
  });

  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
