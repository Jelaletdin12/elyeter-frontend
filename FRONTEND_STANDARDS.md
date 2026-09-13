# Proje Geliştirme Standartları — Frontend (E-Commerce Marketplace)

Bu doküman `BACKEND_STANDARDS.md`'ye paralel yazılmıştır. Backend'deki sözleşmeyi (response format, i18n key, rol matrisi, locale-bazlı SEO slug, "önce yükle sonra bağla" pattern'i) değiştirmez, frontend tarafında nasıl tüketileceğini tanımlar. **Kesinlikle** uyulmalıdır.

---

## 1. Temel Teknoloji Yığını

| Katman | Teknoloji | Neden |
|---|---|---|
| Framework | **Next.js (App Router)** | Public sayfalar için SSR/ISR + SEO, admin/private sayfalar için CSR — ikisi aynı framework içinde route group ile ayrışır |
| Server state | **TanStack Query** | Backend'in `{ success, data }` sözleşmesini cache/invalidation/retry ile sarmalar |
| Client state | **Zustand** | Sadece UI state + oturumun client yansıması; server state için kullanılmaz (bkz. bölüm 3) |
| Form/validasyon | **react-hook-form + zod** | Backend `class-validator` DTO'larıyla aynı kısıtları client'ta erken doğrular |
| UI | **Tailwind + shadcn/ui** | Kendi `components/shared/` katmanının üzerine oturur |
| i18n | **next-intl** | Backend'in `en/ru/tk` desteğiyle birebir, locale-bazlı routing (`[locale]` segment) destekler |
| Tip üretimi | **openapi-typescript** | Backend `@nestjs/swagger` şemasından otomatik tip, elle senkronizasyon yok |
| Auth | Next.js Route Handler (proxy) + httpOnly cookie | Access token XSS'e karşı localStorage'da tutulmaz |

---

## 2. Klasör Yapısı

```text
frontend/
├── app/
│   ├── [locale]/                        # PUBLIC — SEO gerektiren her şey burada
│   │   ├── layout.tsx                   # next-intl provider, global layout
│   │   ├── page.tsx                     # anasayfa (ISR)
│   │   ├── [categorySlug]/
│   │   │   └── page.tsx                 # kategori listeleme (ISR)
│   │   ├── products/[slug]/
│   │   │   └── page.tsx                 # ürün detay (ISR)
│   │   ├── search/
│   │   │   └── page.tsx                 # CSR shell, içerik client component
│   │   ├── cart/
│   │   │   └── page.tsx                 # force-dynamic, CSR
│   │   ├── checkout/
│   │   │   └── page.tsx                 # force-dynamic, CSR
│   │   └── account/                     # sipariş geçmişi, wishlist, profil — private, CSR
│   │
│   ├── admin/                            # PRIVATE — tamamen CSR, force-dynamic root layout
│   │   ├── layout.tsx
│   │   ├── products/
│   │   ├── categories/
│   │   ├── banners/
│   │   ├── orders/
│   │   └── users/
│   │
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts           # backend'e proxy + httpOnly refresh cookie set eder
│       │   └── refresh/route.ts         # silent refresh
│       └── revalidate/route.ts          # admin mutation sonrası tag-based on-demand revalidation
│
├── features/                             # backend'in src/modules/ ile simetrik
│   ├── products/
│   │   ├── api/                          # queries.ts, mutations.ts (TanStack)
│   │   ├── components/
│   │   ├── types/                        # openapi-typescript çıktısına ince wrapper'lar
│   │   └── hooks/
│   ├── categories/
│   ├── orders/
│   ├── cart/
│   ├── wishlist/
│   ├── auth/
│   └── media/                             # useMediaUpload() — backend'in PendingMedia pattern'i
│
├── components/
│   ├── ui/                                # shadcn primitives
│   └── shared/                            # DataTable, ConfirmDialog, FormField, EmptyState...
│
├── lib/
│   ├── api/
│   │   ├── client.ts                      # apiFetch<T>() — tek unwrap noktası
│   │   └── query-keys.ts                  # tüm query key'ler tek dosyada tanımlı
│   ├── auth/
│   └── i18n/
│
├── stores/                                # Zustand — sadece client state
│   ├── auth-store.ts                      # user, activeStoreId, isAuthenticated
│   └── ui-store.ts                        # modal, sidebar, wizard step
│
├── types/
│   └── generated/                         # openapi-typescript çıktısı — ELLE DÜZENLENMEZ
│
├── proxy.ts                                # UX-only route guard (bkz. bölüm 6)
└── next.config.ts
```

---

## 3. State Ayrımı — Server State vs Client State

Bu ayrım projedeki en kritik karardır; karıştırılması "stale data senkronizasyon cehennemi"ne yol açar.

**TanStack Query'ye girer (backend'den gelen her şey):**
Ürünler, kategoriler, siparişler, sepet, wishlist, kullanıcı profili, admin listeleri/istatistikler.

**Zustand'a girer (sadece client-only state):**
Modal/drawer açık-kapalı durumu, checkout wizard'ın hangi adımda olduğu, filtre panelinin açık olup olmadığı, `activeStoreId` (bkz. bölüm 9), auth'un client yansıması (`user`, `isAuthenticated` — kaynak değil, login/refresh response'undan yazılan bir cache).

**Kural:** Bir veri backend'den `fetch`/query ile geliyorsa, Zustand'a elle set edilmez. Zustand içinde `products: Product[]` gibi bir alan görülmesi mimari ihlaldir.

---

## 4. Rendering Stratejisi — Sayfa Tipine Göre

Backend'in verdiği somut sinyaller (locale-bazlı SEO slug `@@unique([locale, slug])`, `CLIENT` rolüyle kişisel sepet/sipariş/wishlist, canlı fiyat/stok kontrolü) rendering kararını belirler:

| Sayfa | Strateji | Next Data Cache | Gerekçe |
|---|---|---|---|
| Anasayfa `/[locale]` | ISR | `tags: ['home', 'banners']`, `revalidate: 300` | SEO kritik, sık değişmiyor |
| Kategori listeleme `/[locale]/[categorySlug]` | ISR (temel liste) + filtreler client'ta | `tags: ['category:{locale}:{slug}', 'products']`, `revalidate: 300` | Crawl edilmeli; filtre/sıralama URL search param ile client-side yönetilir, cache'i şişirmez |
| Ürün detay `/[locale]/products/[slug]` | ISR | `tags: ['product:{locale}:{slug}']`, `revalidate: 600` | `Product.viewCount`, SEO meta (`metaTitle`/`metaDescription`) crawler için server'da render edilmeli |
| Arama `/[locale]/search?q=` | CSR (Client Component, TanStack Query) | **yok** (`cache: 'no-store'`) | Query param kombinasyonu sonsuz → Next cache anlamsız; backend `pg_trgm` sonucu debounce edilerek client'tan çekilir |
| Sepet `/[locale]/cart` | CSR, `force-dynamic` | **yok** | Kişisel veri, `availableQuantity` her seferinde canlı okunmalı |
| Checkout `/[locale]/checkout` | CSR, `force-dynamic` | **yok** | `priceChanged`/`inStock` bayrakları anlık, cache asla kullanıcıya yanlış fiyat göstermemeli |
| Hesap/Sipariş geçmişi/Wishlist `/[locale]/account/*` | CSR | **yok** | Kişisel veri, auth gerektirir |
| Admin panel `/admin/*` | CSR (tüm ağaç), root layout `force-dynamic` | **yok, hiçbir zaman** | Private, SEO'ya ihtiyaç yok, `RolesGuard` zaten backend'de |
| Auth sayfaları (login/register) | `force-dynamic` | **yok** | — |

**Genel kural:** Next.js Data Cache (`fetch` cache) **sadece** public/anonim/SEO gerektiren sayfalar için kullanılır. Bir sayfa `cookies()`/`headers()` okuyorsa veya kullanıcıya özelse, o segment açıkça dynamic işaretlenir (`export const dynamic = 'force-dynamic'`) — aksi halde Next.js'in Full Route Cache'i o sayfayı yanlışlıkla statik render etmeye çalışır ve bir kullanıcının verisi başka bir kullanıcıya sızabilir. Bu, App Router'da en sık yapılan güvenlik hatalarından biridir.

---

## 5. Cache Katmanları ve Aralarındaki Sınır

Next.js + TanStack Query birlikte kullanıldığında **dört farklı cache katmanı** vardır, hangisinin hangi veri için sorumlu olduğu net olmalı:

1. **Next.js Data Cache** (server, `fetch()` cache) — sadece public/ISR sayfalarda, `next: { revalidate, tags }` ile. Bölüm 4'teki tabloya uyar.
2. **Full Route Cache** (server, statik HTML/RSC payload) — ISR sayfalarda otomatik oluşur; dynamic sayfalarda devre dışıdır.
3. **Router Cache** (client, session-bazlı, sekme içinde gezinme) — Next.js ziyaret edilen route'ların RSC payload'ını bellekte tutar. Bir mutation'dan sonra kullanıcı geri/ileri gittiğinde eski veri görünebilir. **Çözüm:** mutation sonrası ilgili public sayfa açıksa `router.refresh()` çağrılır.
4. **TanStack Query cache** (client) — private/kişisel/sık değişen her şey. `staleTime` veri tipine göre ayarlanır:
   - Sepet/stok gibi hızlı değişen veri: `staleTime: 0`, `refetchOnWindowFocus: true`
   - Kullanıcı profili gibi nadiren değişen veri: `staleTime: 5 * 60 * 1000`
   - Admin liste sayfaları: `staleTime: 30_000` + manuel `invalidateQueries` mutation sonrası

**Asla:** Aynı veri hem Next Data Cache'te hem TanStack Query'de "kaynak" olarak tutulmaz. Bir Server Component sayfası SEO için ürünü server'da fetch'ler; aynı sayfadaki interaktif kısım (örn. wishlist kalp butonu) client component olarak ayrılır ve **kendi** TanStack query'siyle (`staleTime` kısa) çalışır — server'dan gelen prop'u state'e kopyalayıp elle senkronize etmeye çalışmaz.

---

## 6. Dual Invalidation — En Kritik Operasyonel Kural

Admin panel tamamen CSR olduğu için `revalidateTag()` (server-only API) admin tarafından **doğrudan çağrılamaz**. Bu yüzden şu akış zorunludur:

```
Admin: PATCH /products/:id (backend'e TanStack mutation ile istek)
  → başarılı response
  → 1) queryClient.invalidateQueries(['admin-products', ...])   // admin'in kendi listesi
  → 2) fetch('/api/revalidate', { method: 'POST', body: { tags: ['product:en:slug', 'products'] } })
       → bu route handler backend değil, Next.js'in kendi route'u
       → içeride revalidateTag() çağrılır (server-only, sadece burada çalışabilir)
```

`app/api/revalidate/route.ts` bir secret header/token ile korunur (env'den, backend'in `@Throttle()` sabit-değer prensibiyle aynı mantık — runtime'da gevşetilebilir olmamalı). Bu adım atlanırsa: admin'de ürün güncellenir, admin kendi listesinde günceli görür, ama public ürün detay sayfası `revalidate: 600` süresi dolana kadar (10 dakika) eski veriyi göstermeye devam eder — kullanıcıya yanlış fiyat/stok gösterilmiş olur.

---

## 7. API Client ve Tip Üretimi

Backend `@nestjs/swagger` ile OpenAPI şeması üretiyor. Frontend bunu build/dev script'iyle çeker:

```json
// package.json
"scripts": {
  "generate:types": "openapi-typescript http://localhost:3000/docs-json -o types/generated/api.ts"
}
```

`types/generated/api.ts` **elle düzenlenmez**, `.gitignore`'a değil ama "generated" olarak işaretlenir, backend DTO değiştiğinde script yeniden çalıştırılır (CI'da da bir adım olarak eklenmesi önerilir — şema drift olursa build kırılır, sessizce yanlış tip kalmaz).

```ts
// lib/api/client.ts
type ApiSuccess<T> = { success: true; data: T; message?: string };
type ApiError = { success: false; message: string; timestamp: string };

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { next?: NextFetchRequestConfig } = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
  });
  const json: ApiSuccess<T> | ApiError = await res.json();
  if (!json.success) {
    throw new ApiClientError(json.message, res.status); // message = i18n key
  }
  return json.data;
}
```

Server Component'ler (ISR sayfalar) bu fonksiyonu `next: { revalidate, tags }` parametresiyle çağırır; Client Component'ler (TanStack Query `queryFn` içinde) `cache: 'no-store'` ile çağırır. İkisi de aynı `apiFetch`'i kullanır, tek fark çağrı yerinde geçirilen cache opsiyonudur — iki ayrı client yazılmaz.

`ApiClientError.message` (i18n key), TanStack'in global `QueryCache`/`MutationCache` `onError`'ında yakalanır ve `react-i18next` ile çözülüp tek bir `ToastProvider` üzerinden gösterilir. Component içinde `try/catch` + manuel toast tekrarı yazılmaz.

---

## 8. Auth Akışı (Frontend Tarafı)

Backend access (kısa ömürlü) + refresh (uzun ömürlü, DB'de hash'li) token çifti döner. Frontend tarafı:

1. **Login:** İstek doğrudan backend'e değil, `app/api/auth/login/route.ts`'e gider. Bu route backend'e proxy yapar, dönen refresh token'ı **httpOnly, secure, sameSite=strict** cookie olarak set eder, access token'ı response body'de client'a döner (Zustand'a yazılır, **persist edilmez**).
2. **İstekler:** Access token bellekte (Zustand) tutulur, `Authorization` header'ında gönderilir. Sayfa yenilenince bellek sıfırlanır → `app/api/auth/refresh/route.ts` httpOnly cookie'yi okuyup backend'in refresh endpoint'ini çağırır, yeni access token döner (silent refresh, uygulama açılışında bir kere).
3. **401:** `apiFetch` içinde merkezi bir interceptor mantığı — 401 alınca bir kere refresh dener, başarılıysa orijinal isteği tekrar eder, başarısızsa logout akışını tetikler (Zustand `auth-store` temizlenir, login'e yönlendirilir).
4. **403:** Kullanıcı sayfada tutulur, sadece toast gösterilir (backend'in kuralıyla birebir aynı: `RolesGuard` frontend'i sayfadan atmaz).

**Neden localStorage değil:** Access token localStorage'da olsaydı XSS ile çalınabilirdi. Refresh token zaten httpOnly cookie'de (JS erişemez). Access token bellekte kalması, sayfa yenilendiğinde kısa bir "silent refresh" maliyeti karşılığında XSS yüzeyini kapatır.

---

## 9. B2B Geçişi İçin Bırakılan Seam'ler

Şu an tek mağaza, ileride çok mağazalı B2B olacağı için **şimdiden mimari kurulmaz** (over-engineering), ama şu 4 nokta bedava/ucuz seam olarak bugünden bırakılır:

- `stores/auth-store.ts` içinde `activeStoreId: string | null` alanı bugünden vardır (backend tek mağaza döndürse bile).
- Query key convention'ı `[domain, storeId, ...params]` şeklindedir (`lib/api/query-keys.ts` tek merkezi dosya).
- URL yapısı `[locale]/products/[slug]` bugünden store-agnostic bırakılır; ileride `[locale]/[storeSlug]/products/[slug]` olacağı düşünülerek route parametreleri component prop'u olarak (path'ten değil) geçirilir, component'ler store bağımsız kalır.
- Rol/yetki kontrolü tek bir `useAuth().can(action)` hook'undan geçer — `STORE_OWNER` gibi yeni bir rol eklendiğinde tek dosya değişir.

Gerçek multi-tenant mimarisi (store isolation, per-store tema, store-level izin) backend o noktaya gelmeden frontend'de kurulmaz.

---

## 10. Görsel/Medya Yükleme (Backend Pattern'iyle Birebir)

Backend "önce yükle, sonra bağla" akışını (`POST /media/uploads?context=...` → `PendingMedia.id` → entity body'sinde `mediaId` referansı) zorunlu kılıyor. Frontend:

- Tek bir `useMediaUpload(context: 'PRODUCT_IMAGE' | 'BANNER_IMAGE')` hook'u — drag-drop, progress, preview, hata durumunda temizlik.
- Boyut/preset bilgisi (`PRODUCT_CARD`, `PRODUCT_DETAIL` vb.) frontend'de **tekrar tanımlanmaz** — backend zaten resize edip varyant URL'lerini dönüyor, frontend sadece `cardUrl`/`detailUrl`/`originalUrl` alanlarını `next/image`'e verir.
- Form gönderilmeden vazgeçilirse yüklenen dosya orphan kalır ama backend `MediaCleanupService` bunu otomatik temizliyor (`PENDING_MEDIA_TTL_HOURS`) — frontend tarafında ekstra bir "cleanup" mantığı kurulmaz.
- Ürüne görsel ekleme backend'de ayrı bir endpoint değil, `PATCH /products/:id`'nin parçası — frontend'de de "ürüne resim ekle" diye ayrı bir form/mutation yazılmaz, ürün düzenleme formunun bir parçasıdır. Sadece silme (`DELETE /products/:id/images/:imageId`) ayrı bir mutation'dır.

---

## 11. i18n ve Locale Routing

- Desteklenen diller backend ile birebir: `en`, `ru`, `tk`. `[locale]` App Router segment'i, `next-intl` middleware ile yönetilir.
- SEO slug'lar locale-bazlı benzersiz olduğundan (`/en/electronics` ≠ `/ru/elektronika`), `generateStaticParams` **tüm ürün/kategori slug'larını build-time'da üretmez** (katalog büyüdükçe build süresi patlar) — sadece locale listesini statik üretir, slug'lar ISR ile ilk istekte cache'lenir (`dynamicParams: true`, on-demand ISR).
- Hata/UI metinleri `react-i18next`/`next-intl` key'leriyle yönetilir; backend'in i18n key'leri (`errors.*`) ile frontend'in kendi UI key'leri (`common.*`, `products.*`) aynı namespace'te karışmaz, ayrı dosyalarda tutulur.

---

## 12. Kod Kalitesi Kuralları

- `any` kesinlikle yasak — `unknown` + type guard veya generated tip.
- Server Component'ler veri çeker, business/format mantığı taşımaz; ağır dönüşüm mantığı `lib/` veya `features/*/utils/`'e taşınır.
- Fonksiyon/hook isimleri açıklayıcıdır (`useData` değil `useProductDetailQuery`).
- Bir component/hook 2+ feature'da kullanılıyorsa `components/shared/` veya `lib/`'e taşınır; tek yerde kullanılıyorsa kendi feature klasöründe kalır.
- Yeni bir sayfa eklemeden önce bölüm 4'teki tablo kontrol edilir, rendering stratejisi ad hoc seçilmez.
