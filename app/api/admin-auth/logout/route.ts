import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL ?? '';
const API_PREFIX = '/api/v1';
const ADMIN_REFRESH_COOKIE_NAME = process.env.ADMIN_REFRESH_COOKIE_NAME ?? 'admin_refresh_token';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(ADMIN_REFRESH_COOKIE_NAME)?.value;

  if (refreshToken) {
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
  response.cookies.delete(ADMIN_REFRESH_COOKIE_NAME);
  return response;
}
