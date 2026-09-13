import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * FRONTEND_AGENTS.md #7 — EN KRİTİK OPERASYONEL KURAL:
 * Admin panel tamamen CSR olduğu için revalidateTag() (server-only API)
 * admin'den doğrudan çağrılamaz. Zorunlu akış:
 *
 *   1) Admin mutation başarılı olur (örn. PATCH /products/:id)
 *   2) queryClient.invalidateQueries(['admin-products', ...])  → admin'in kendi listesi
 *   3) fetch('/api/revalidate', { tags: [...] })                → BU ROUTE
 *      → içeride revalidateTag() çağrılır → public ISR sayfası artık güncel
 *
 * Bu adım atlanırsa: admin'de değişiklik görünür ama public sitede
 * `revalidate` süresi dolana kadar (örn. ürün detayda 10 dakika) eski veri
 * kalır — kullanıcıya yanlış fiyat/stok gösterilmiş olur.
 *
 * Secret header ile korunur — runtime'da gevşetilebilir olmamalı
 * (backend'in @Throttle() sabit-değer prensibiyle aynı mantık).
 */

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;

type RevalidateBody = { tags: string[] };

function isRevalidateBody(value: unknown): value is RevalidateBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'tags' in value &&
    Array.isArray((value as { tags: unknown }).tags)
  );
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret');

  if (!REVALIDATE_SECRET || secret !== REVALIDATE_SECRET) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await request.json();

  if (!isRevalidateBody(body)) {
    return NextResponse.json(
      { success: false, message: 'tags[] gerekli' },
      { status: 400 },
    );
  }

  for (const tag of body.tags) {
    revalidateTag(tag, 'max');
  }

  return NextResponse.json({ success: true, revalidated: body.tags });
}
