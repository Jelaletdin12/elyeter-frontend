import { NextRequest, NextResponse } from 'next/server';

/**
 * FRONTEND_STANDARDS.md #8, FRONTEND_AGENTS.md #10:
 * Login isteği doğrudan backend'e DEĞİL, bu route'a gider. Bu route backend'e
 * proxy yapar, dönen refresh token'ı httpOnly+secure+sameSite=strict cookie
 * olarak set eder, access token'ı ise response body'de client'a döner
 * (client bunu Zustand'a yazar, persist ETMEZ).
 *
 * ✅ DOĞRULANDI (gerçek backend response'u, 2026-09):
 * { success, data: { accessToken, refreshToken, user: { id, email, role, fullName } } }
 * — expiresIn YOK (önceki varsayım yanlıştı, kaldırıldı).
 */

const API_BASE_URL = process.env.API_BASE_URL ?? '';
const API_PREFIX = '/api/v1';
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME ?? 'refresh_token';

type LoginBackendResponse = {
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

  const response = NextResponse.json({
    success: true,
    data: { accessToken, user },
  });

  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    // Backend'in refresh token TTL'i ile uyumlu tutulmalı (JWT exp'e bak).
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
