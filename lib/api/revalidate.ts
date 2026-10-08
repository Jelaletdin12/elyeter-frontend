/**
 * FRONTEND_AGENTS.md #7 — revalidatePublicTags'ın TEK kaynağı.
 *
 * Admin mutation'ları başarılı olduktan sonra public Next Data Cache tag'lerini
 * kırmak için çağrılır (products/home/categories/banners vb.). İki ayrı yerde
 * aynı fetch'i beslemek yerine (products/categories/banners/brands mutation dosyaları
 * eskiden kopyala-yapıştır 4 ayrı helper barındırıyordu) hepsi buradan import eder.
 *
 * Secret akışı: sunucu route'u (app/api/revalidate/route.ts) `x-revalidate-secret`
 * header'ını `REVALIDATE_SECRET` ile karşılaştırır. Client bundle'ından gönderilen
 * değer NEXT_PUBLIC_REVALIDATE_SECRET env'inden okunur ve iki değer birebir aynı
 * olmak zorundadır (.env / .env.example — üç yerde aynı değer).
 *
 * Neden header? Tarayıcı CSRF'sine karşı: başka bir origin'den gelen basit
 * (preflight'sız) POST, özel bir header taşıyamaz — secret header'ı olmayan
 * istekler 401 alır ve public cache'i üçüncü taraf siteler sildiremez.
 */

const REVALIDATE_SECRET = process.env.NEXT_PUBLIC_REVALIDATE_SECRET ?? '';

export async function revalidatePublicTags(tags: string[]) {
  if (!REVALIDATE_SECRET) {
    console.error(
      'revalidatePublicTags: NEXT_PUBLIC_REVALIDATE_SECRET tanımlı değil — public cache kırılamıyor.',
    );
    return;
  }

  try {
    const res = await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': REVALIDATE_SECRET,
      },
      body: JSON.stringify({ tags }),
    });

    if (!res.ok) {
      console.error('revalidatePublicTags failed', res.status, await res.text());
    }
  } catch (error) {
    console.error('revalidatePublicTags request error', error);
  }
}
