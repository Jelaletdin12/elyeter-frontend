import { NextRequest, NextResponse } from 'next/server';

/**
 * FRONTEND_STANDARDS.md #8, FRONTEND_AGENTS.md #10:
 * Login isteği doğrudan backend'e DEĞİL, bu route'a gider. Bu route backend'e
 * proxy yapar, dönen refresh token'ı httpOnly+secure+sameSite=strict cookie
 * olarak set eder, access token'ı ise response body'de client'a döner
 * (client bunu Zustand'a yazar, persist ETMEZ).
 *
 * ⚠️ VARSAYIM: Backend'in docs-json.json'ındaki POST /api/v1/auth/login için
 * response şeması dokümante edilmemiş (NestJS controller'da @ApiOkResponse
 * eksik olmalı). Aşağıdaki LoginBackendResponse şekli STANDARDS/AGENTS
 * dosyalarındaki genel sözleşmeye ({success,data}) göre TAHMİN edildi —
 * gerçek alan isimleri (accessToken/refreshToken/expiresIn/user) backend
 * kaynağından veya gerçek bir login isteğinin çıktısından doğrulanmalı.
 * Backend'e @ApiOkResponse({ type: ... }) eklenirse `generate:types` bunu
 * otomatik doğru üretir, bu varsayım gerek kalmaz.
 */

const API_BASE_URL = process.env.API_BASE_URL ?? '';
const API_PREFIX = '/api/v1';
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME ?? 'refresh_token';

type LoginBackendResponse = {
  success: true;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
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
    // i18n key'i backend'den geldiği gibi client'a aktarılır — çözümleme
    // component'te değil, TanStack global onError'da yapılır.
    return NextResponse.json(json, { status: backendRes.status });
  }

  const { refreshToken, accessToken, expiresIn, user } = json.data;

  const response = NextResponse.json({
    success: true,
    data: { accessToken, expiresIn, user },
  });

  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    // Backend'in refresh token TTL'iyle uyumlu tutulmalı.
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
