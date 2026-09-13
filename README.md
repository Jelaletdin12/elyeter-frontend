# Marketplace Frontend — İskelet

`FRONTEND_STANDARDS.md` ve `FRONTEND_AGENTS.md`'deki kurallara birebir uyacak şekilde kurulmuş
Next.js (App Router) + TypeScript + TanStack Query + Zustand + shadcn/Tailwind iskeleti.
Backend şeması `schema.prisma`'dan çıkarıldı (Role/OrderStatus enum'ları, varyant bazlı
ürün/stok, locale-bazlı SEO slug, dual invalidation vb.).

## Kurulum

```bash
pnpm install
cp .env.example .env.local   # değerleri kendi backend'ine göre doldur
pnpm generate:types          # backend AYAKTAYKEN çalıştır — types/generated/api.ts'i üretir
pnpm dev
```

> **Önemli:** `types/generated/api.ts` şu an bir **placeholder**. Bu ortamda backend'e
> (`localhost:3000/docs-json`) ağ erişimim olmadığı için gerçek OpenAPI şemasını çekemedim.
> `pnpm generate:types` çalıştırıldıktan sonra `features/*/types/index.ts` dosyalarındaki
> `components['schemas']['...']` referanslarını gerçek DTO isimleriyle eşleştirmen gerekecek
> (oradaki isimler tahminidir — `CreateProductDto`, `ProductResponseDto` vb.).

## Neyin nerede olduğu

| Ne | Nerede | Neden |
|---|---|---|
| Backend `{success,data}` unwrap | `lib/api/client.ts` (`apiFetch`) | Tek nokta, FRONTEND_AGENTS.md #3 |
| Query key convention | `lib/api/query-keys.ts` | `[domain, storeId, ...params]`, #14 |
| Next Data Cache tag convention | `lib/api/query-keys.ts` (`dataCacheTags`) | `{tip}:{locale}:{slug}`, #6 |
| Access token (persist edilmez) | `stores/auth-store.ts` | XSS koruması, #10 |
| UI-only state | `stores/ui-store.ts` | Server state karışmaz, #1 |
| Rol bazlı UI | `features/auth/hooks/useAuth.ts` (`can()`) | Tek merkezi hook, #9 |
| 401 → refresh → retry | `lib/auth/authorized-fetch.ts` | Interceptor, STANDARDS #8.3 |
| httpOnly cookie login/refresh | `app/api/auth/{login,refresh}/route.ts` | STANDARDS #8 |
| Dual invalidation | `features/products/api/mutations.ts` + `app/api/revalidate/route.ts` | **En kritik kural**, #7 |
| Medya "önce yükle sonra bağla" | `features/media/hooks/useMediaUpload.ts` | Tek shared hook, #11 |
| ISR sayfa örnekleri | `app/[locale]/page.tsx`, `[categorySlug]/page.tsx`, `products/[slug]/page.tsx` | STANDARDS #4 tablosu |
| force-dynamic private sayfalar | `app/[locale]/{cart,checkout,account}` | STANDARDS #4 |
| Admin CSR + guard | `app/admin/layout.tsx` + `features/auth/components/AdminGuard.tsx` | STANDARDS #4, #9 |

## Bilinçli olarak eksik bırakılanlar (sıradaki adımlar)

- `components/ui/*` (shadcn primitives) — `npx shadcn@latest init` ile projeye özel kurulmalı,
  burada elle taklit edilmedi.
- `app/admin/categories|banners|orders|users` — `admin/products` örneğindeki pattern birebir
  kopyalanabilir (DataTable + ConfirmDialog + dual-invalidation mutation).
- `features/orders` admin tarafı (status güncelleme — `OrderStatusHistory` yazan akış).
- Gerçek görsel yükleme UI'ı (`MediaUploader` shared component) — `useMediaUpload` hook'u hazır,
  drag-drop UI'ı eklenmedi.
- `next-intl` middleware'i mevcut `proxy.ts` içine gömülü; ileride locale-bazlı
  yönlendirme kuralları büyürse ayrı bir dosyaya bölünebilir.

## B2B seam'leri (STANDARDS #9)

- `stores/auth-store.ts` → `activeStoreId`
- `lib/api/query-keys.ts` → tüm key'ler storeId ile başlıyor
- `useAuth().can()` → yeni rol eklemek tek dosya değişikliği
