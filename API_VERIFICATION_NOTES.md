# API Doğrulama Notları (docs-json.json incelemesi — 2026-09-03)

Bu dosya, backend'in gerçek OpenAPI şemasıyla (`docs-json.json`) frontend kodunu
karşılaştırırken bulduğum her şeyi kaydediyor. Yeni bir endpoint bağlarken önce
buraya bak — aynı hataları (yanlış path, yanlış response şekli) tekrar yapmamak için.

## 🔴 Düzeltilen kritik hatalar

| Sorun                    | Neydi                       | Ne oldu                                                                          | Nerede                                                                           |
| ------------------------ | --------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Base path                | Prefix'siz (`/products`)    | `/api/v1` prefix'i merkezi hale getirildi                                        | `lib/api/client.ts` (`API_PREFIX`), `app/api/auth/{login,refresh}/route.ts`      |
| Ürün listesi şekli       | Düz dizi varsayılmıştı      | `{ items: Product[], meta: {page,limit,total,totalPages} }` — sayfalanmış        | `features/products/types`, `queries.ts`, anasayfa, kategori sayfası, admin liste |
| Checkout endpoint'i      | `/orders/checkout` (yanlış) | `POST /cart/checkout` — items body'de yok, backend kullanıcının sepetini biliyor | `features/cart/api/mutations.ts` (`useCheckoutMutation`)                         |
| Sepete ekleme            | Hiç yazılmamış              | `POST /cart/items` eklendi                                                       | `features/cart/api/mutations.ts` (`useAddCartItemMutation`)                      |
| Logout                   | Route handler yoktu         | `POST /auth/logout` (body: `refreshToken`) eklendi                               | `app/api/auth/logout/route.ts`                                                   |
| `?featured=true`         | Uydurma param               | `schema.prisma`'da böyle bir alan yok, kaldırıldı                                | `app/[locale]/page.tsx`                                                          |
| `types/generated/api.ts` | Placeholder'dı              | `npx openapi-typescript` ile GERÇEK şemadan üretildi (2299 satır)                | `types/generated/api.ts`                                                         |

## 🟡 Doğrulanmış (Swagger'da tam dokümante, güvenle kullanılabilir)

- `ProductResponseDto`, `ProductListResponseDto`, `CreateProductDto`, `UpdateProductDto`, `CreateProductVariantDto`, `StockAdjustmentDto`
- `CheckoutDto`, `AddCartItemDto`, `UpdateCartItemDto` (Doğrulandı: Cart ve Checkout response şekilleri, öğelerin içeriği ve alt toplamlar test edildi)
- `CreateOrderDto`, `UpdateOrderStatusDto` (order status enum: `PENDING | CONFIRMED | PROCESSING | SHIPPED | DELIVERED | CANCELLED | RETURN_REQUESTED | RETURNED`)
- `LoginDto`, `RegisterDto`, `RefreshTokenDto` (sadece **request** body'leri — response'ları değil)
- `CreateCategoryDto`, `UpdateCategoryDto`, `CreateBannerDto`, `UpdateBannerDto`
- Search: `GET /search?q=&locale=&limit=` (q zorunlu, locale/limit opsiyonel — **page yok**, sayfalama desteklenmiyor)
- Wishlist: `GET /wishlist`, `POST/DELETE /wishlist/{productId}` — body'siz, tam kodladığımız gibi
- Ürün Resim Silme: `DELETE /products/{productId}/images/{imageId}` (Doğrulandı: Belirtilen varyant/ürün resmini siliyor)
- Sepet (Cart) İşlemleri:
  - `POST /cart/items` (Doğrulandı: Sepete ürün ekler, response sepeti detaylarıyla `items`, `subtotal`, `itemCount` olarak döner)
  - `PATCH /cart/items/{id}` (Doğrulandı: Sepetteki ürün miktarını günceller)
  - `DELETE /cart/items/{id}` (Doğrulandı: Sepetten tek bir ürünü siler)
  - `DELETE /cart` (Doğrulandı: Tüm sepeti boşaltır)
  - `POST /cart/checkout` (Doğrulandı: Sepeti siparişe dönüştürür. Body: `paymentMethod`, `fulfillmentType`, `recipientName`, `recipientPhone`, `shippingAddress`. Sepet id veya items gönderilmiyor, backend sepeti biliyor.)

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

## 🟢 2026-09-10 — Adres/checkout akışı incelendi (backend modüllerinden doğrulandı)

- **`savedAddressId` checkout'ta çalışıyor**: `CheckoutDto` (`order-fulfillment.dto.ts`), `@IsUUID`; `resolveShipping` sahiplik kontrolünden sonra `recipientName/recipientPhone/shippingAddress`'i kayıtlı adresten doldurur. Frontend'de `CheckoutInput.savedAddressId` + `CheckoutWizard` kayıtlı adres seçimi eklendi.
- **ÖNEMLİ:** Checkout'ta kayıtlı adres seçilince manuel alanlar **boş string olarak hiç gönderilmemeli** — `resolveShipping` `?? saved.recipientName` yazdığı için `""` saved değerini ezmez, `errors.delivery_details_required` fırlatır. Aynı şekilde `savedAddressId: ""` gönderilirse `@IsUUID`'ye takılır (400). CheckoutWizard `onSubmit`'te ikisini de siler.
- **Cart item nested `product`**: `CartItemDto.productVariant.product.translations` gerçek response'ta var (curl doğruladı) ama `ProductVariantResponseDto`'da dokümante değil — `CartItemProduct` hafif tipi elle yazıldı, CartView artık "Variant {id}" yerine ürün adı gösteriyor. `images` nested gelmez, Product tipi kullanılmadı.
- **`GET /orders` sayfalanmış**: `{ items: OrderListItem[], meta: {page,limit,total,totalPages} }` — düz dizi DEĞİL. `OrderHistoryList` buna göre düzeltildi.
- **OrderItem response şekli**: `items[].productVariant.product.translations[]` (doğrudan `productName` alanı YOK) — `OrderDetail` tipi + sipariş detay sayfası düzeltildi. Kuponlu siparişte `subtotal`, `discountAmount`, `coupon: {code,type,value}` da geliyor.
- **Profile/address tipleri:** `ProfileController` hiç `@ApiOkResponse` içermiyordu → `features/profile/types.ts` backend kodundan elle çıkartıldı (⚠️). Backend'e `ProfileResponseDto`/`ClientAddressResponseDto` eklendi; bir sonraki `generate:types` sonrası elle tipler generated şemalara alias'lanacak.

## 🟢 2026-09-10 — Search & Wishlist backend'den bağlandı

- **`GET /search` response şekli** (Swagger'da yok, `search.service.ts`ten çıkarıldı): her zaman `{ products: ProductSearchResult[], categories: CategorySearchResult[] }`. Product: `{ id, sku, price(string, en ucuz aktif varyant — Decimal), slug, name, cardImageUrl(string|null), matchedIn:'name'|'description' }`; Category: `{ id, slug, name }`. Query param: `q` zorunlu, `locale` ('en'|'ru'|'tk'), `limit` (1-50, default 20). `SearchResults.tsx` düz dizi sanıyordu (`data?.length`) — hiçbir şey listelemiyordu, düzeltildi.
- **`GET /wishlist` response şekli** (Swagger'da yok, `wishlist.service.ts` WISHLIST_ITEM_INCLUDE'tan çıkarıldı): `WishlistItem[]`; her item `{ id, wishlistId, productId, createdAt, product: { id, isActive, translations[], images[{cardUrl,isPrimary}], variants[{id,sku,price,isActive}] } }`. `variants`'ta **inventory YOK** — stok bilgisi wishlist'te bir sorgu ile ayrıca alınmak zorunda (şu an hesaplanmıyor, ekleme backend'de doğrulanıyor).
- **Yeni route `/[locale]/wishlist`**: SiteHeader zaten oraya link veriyordu ama route yoktu (ölü link) — `WishlistView` eklendi (ürün adı/görsel/fiyat + add-to-cart + remove). `WishlistItem` tipi `{productId}` idi, gerçek şekle göre genişletildi.

## 🟢 2026-09-10 — Stats & Audit Log bağlandı

- **`GET /stats/overview`** (SUPER_ADMIN/ADMIN): `{ totalActiveProducts, totalStockRemaining, totalOrders, ordersByStatus: Record<OrderStatus,count>, totalUnitsSold }` — `ordersByStatus` 8 status'ta sıfır dahil TÜM anahtarları veriyor. **Revenue/para toplamı YOK** → dashboard'da "Revenue" kartı sahte sayı için değil, "Units sold" olarak kullanıldı.
- **`GET /stats/products-by-operator`**: `[{ operatorId, operatorEmail, operatorFullName, productCount }]` — düz dizi, sayfalama yok.
- **`GET /stats/most-viewed-products?limit=&locale=`**: `[{ id, name, viewCount }]`; `name` locale çevirisi (yoksa 'Unknown'); **locale default 'tk'** — admin ingilizce arayüzü için `locale=en` açıkça gönderildi.
- **`GET /stats/most-searched-terms?limit=`**: `[{ term, searchCount }]`.
- **`GET /audit-log`** (SADECE SUPER_ADMIN; `?page=&limit=&entity=|resourceType=&actorId=&action=`): sayfalanmış `{ items, meta:{page,limit,total,totalPages} }`. Item: `{ id, actorId, action, entity, entityId, oldValue, newValue, ip, userAgent, metadata, createdAt }`. Payload konumu değişken: kupon oluşturma `newValue:{code,type,value}`, sipariş durum güncelleme `metadata:{total:"479.98",source:"cart_checkout"}`, silme `oldValue`. Detay hücresi `metadata ?? newValue ?? oldValue` sırasıyla render ediyor.
- **Yeni route `/admin/audit-log`**: DataTable + sayfalama + entity/action/actorId filtreleri (raw payload `JSON.stringify`, truncate + tooltip). Sidebar'a SADECE rol-katmanı eklenebildi (audit backend'de rol bazlı, frontend'de action kavramı yok) — `requiresRole: 'SUPER_ADMIN'`.
- **Backend notu**: `/stats/*` ve `/audit-log` response'larında da `@ApiOkResponse` yok — tipler controller/service kaynağından elle çıkartıldı (features/stats/types.ts, features/audit-log/types.ts, ⚠️). Backend'e DTO + `@ApiOkResponse` eklenirse `generate:types` gerçek şemaları üretir.

## 🟢 2026-09-10 — Admin Orders bağlandı (backend orders modülü)

- **`GET /orders` admin görünümü**: staff için TÜM siparişler (CLIENT'a göre ownership filtresi yok), `createdAt desc`, paginated `{items, meta}`. Her item'da `items[].productVariant.product.translations`, `coupon`, `statusHistory` dahil (ORDER_INCLUDE). `Order` tipi `features/orders/types.ts`'e tam taşındı (`features/stats/types.ts`'teki duplike `OrderStatus` union'ı yanında durur).
- **`GET /orders?status=` DESTEKLENMİYOR** — `findAll` sadece `PaginationQuery` (page/limit) okur; durum filtreleme `@ApiQuery` + service'e eklenene kadar admin'de listelenmez. (Not: `GET /orders?limit=20` açıkça gönderiliyor, default'a güvenilmiyor.)
- **`PATCH /orders/{id}/status`**: body `{ status, reason? }` (`UpdateOrderStatusDto`). Geçişler `ORDER_STATUS_TRANSITIONS` ile doğrulanır (PENDING→CONFIRMED/CANCELLED, ... terminal: CANCELLED/RETURNED). Stok etkileri: CANCELLED=release, SHIPPED=fulfil, RETURNED=returnToStock — her geçiş bir `OrderStatusHistory` satırı yazar (+audit). Frontend aynı transition haritasını `types.ts`'e yansıtıyor; **backend final**. Sadece staff (SUPER_ADMIN/ADMIN/OPERATOR) — `order.updateStatus` action'ıyla UI'da kısıtlı.
- **Müşteri profili response'ta YOK** — `Order`'da sadece `clientId`; admin liste "Customer" hücresinde kısa clientId gösteriyor (client ad/email istenirse ek `/profile` benzeri join gerekir).
- **`GET /orders/{id}/invoice.pdf`**: binary StreamableFile (TransformInterceptor unwrap etmez) → `apiFetch` JSON unwrap yaptığı için kullanılamaz; `features/orders/api/invoice.ts` `downloadOrderInvoice()` token+Bearer blob indirme helper'ı yazıldı. ⚠️ **curl ile doğrulanmadı** (StreamableFile+disposition beklenir) — ilk manuel testte kontrol edilmeli.
- **Yeni route'lar**: `/admin/orders` (liste: DataTable + pagination, View→detay) + `/admin/orders/[orderId]` (detay: items/totals/delivery/timeline + status picker [sonraki status'lar Select, reason input] + invoice butonu). Status güncelleme sonrası `adminOrders` + `adminStats.overview` (ordersByStatus) invalidation'ı yapılıyor.
