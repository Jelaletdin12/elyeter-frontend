# API Doğrulama Notları (docs-json.json incelemesi — 2026-09-03)

Bu dosya, backend'in gerçek OpenAPI şemasıyla (`docs-json.json`) frontend kodunu
karşılaştırırken bulduğum her şeyi kaydediyor. Yeni bir endpoint bağlarken önce
buraya bak — aynı hataları (yanlış path, yanlış response şekli) tekrar yapmamak için.

## 🔴 Düzeltilen kritik hatalar

| Sorun | Neydi | Ne oldu | Nerede |
|---|---|---|---|
| Base path | Prefix'siz (`/products`) | `/api/v1` prefix'i merkezi hale getirildi | `lib/api/client.ts` (`API_PREFIX`), `app/api/auth/{login,refresh}/route.ts` |
| Ürün listesi şekli | Düz dizi varsayılmıştı | `{ items: Product[], meta: {page,limit,total,totalPages} }` — sayfalanmış | `features/products/types`, `queries.ts`, anasayfa, kategori sayfası, admin liste |
| Checkout endpoint'i | `/orders/checkout` (yanlış) | `POST /cart/checkout` — items body'de yok, backend kullanıcının sepetini biliyor | `features/cart/api/mutations.ts` (`useCheckoutMutation`) |
| Sepete ekleme | Hiç yazılmamış | `POST /cart/items` eklendi | `features/cart/api/mutations.ts` (`useAddCartItemMutation`) |
| Logout | Route handler yoktu | `POST /auth/logout` (body: `refreshToken`) eklendi | `app/api/auth/logout/route.ts` |
| `?featured=true` | Uydurma param | `schema.prisma`'da böyle bir alan yok, kaldırıldı | `app/[locale]/page.tsx` |
| `types/generated/api.ts` | Placeholder'dı | `npx openapi-typescript` ile GERÇEK şemadan üretildi (2299 satır) | `types/generated/api.ts` |

## 🟡 Doğrulanmış (Swagger'da tam dokümante, güvenle kullanılabilir)

- `ProductResponseDto`, `ProductListResponseDto`, `CreateProductDto`, `UpdateProductDto`, `CreateProductVariantDto`, `StockAdjustmentDto`
- `CheckoutDto`, `AddCartItemDto`, `UpdateCartItemDto`
- `CreateOrderDto`, `UpdateOrderStatusDto` (order status enum: `PENDING | CONFIRMED | PROCESSING | SHIPPED | DELIVERED | CANCELLED | RETURN_REQUESTED | RETURNED`)
- `LoginDto`, `RegisterDto`, `RefreshTokenDto` (sadece **request** body'leri — response'ları değil)
- `CreateCategoryDto`, `UpdateCategoryDto`, `CreateBannerDto`, `UpdateBannerDto`
- Search: `GET /search?q=&locale=&limit=` (q zorunlu, locale/limit opsiyonel — **page yok**, sayfalama desteklenmiyor)
- Wishlist: `GET /wishlist`, `POST/DELETE /wishlist/{productId}` — body'siz, tam kodladığımız gibi

## 🔴 Dokümante EDİLMEMİŞ (backend'de `@ApiOkResponse` eksik — response şekli tahmin edildi, işaretlendi)

Bu endpoint'lerin **response** şeması Swagger'da hiç yok (sadece boş `"200": {"description": ""}`):

- `POST /auth/login`, `/auth/register`, `/auth/refresh` — response şekli (`accessToken`/`refreshToken`/`expiresIn`/`user`) STANDARDS.md'deki genel sözleşmeye göre tahmin edildi
- `GET /categories`, `/categories/{id}`, `/categories/slug/{locale}/{slug}` — "CategoryResponseDto" diye bir şema yok, ProductResponseDto ile aynı translations-array pattern'i varsayıldı
- `GET /banners`, `/banners/{id}` — banner'ın response'ta `image: {cardUrl,detailUrl,originalUrl}` mi yoksa düz `imageUrl` mi döndüğü belirsiz
- `POST /media/uploads` — `PendingMediaResponse` şekli (`id`+`cardUrl`/`detailUrl`/`originalUrl`) `ProductImageResponseDto` pattern'inden tahmin edildi
- `GET /search` — sonuç öğelerinin şekli tamamen bilinmiyor
- `GET /orders`, `/orders/{id}` — sayfalama var mı yok mu belirsiz (products gibi `{items,meta}` mi, yoksa düz dizi mi?)

**Öneri:** Backend'e bu controller'lar için `@ApiOkResponse({ type: XxxResponseDto })` eklenirse `npm run generate:types` bunları otomatik doğru üretir, hiçbir tahmine gerek kalmaz. Bu, tek başına en yüksek etkili düzeltme olur.

## 🟡 Query parametreleri dokümante değil (çalıştığı varsayılıyor, test edilmedi)

`GET /products` için `@ApiQuery` decorator'ları yok — `?locale=&categoryId=&search=&minPrice=&maxPrice=&page=` gönderiyoruz ama backend'in bunları gerçekten okuyup okumadığı Swagger'dan görünmüyor. Backend ayaktayken bir istek atıp filtrelemenin çalıştığını doğrula.

## Önemli mimari notlar (schema.prisma + docs-json.json ortak doğrulaması)

- Her ürünün **en az bir varyantı var**; fiyat/SKU/stok ürün seviyesinde değil, `variants[].price` / `variants[].inventory` altında. Ürün detay sayfasında artık `ProductVariantPicker` bu yüzden var.
- `availableQuantity` backend'de hiçbir zaman ham bir alan değil — her zaman `inventory.quantity - inventory.reservedQuantity` olarak hesaplanmalı.
- `POST /orders` (items body'de elle belirtilir) ile `POST /cart/checkout` (items yok, mevcut sepetten) **iki ayrı akış** — birbirine karıştırılmamalı.
