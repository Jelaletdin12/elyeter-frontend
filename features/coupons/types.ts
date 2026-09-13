/**
 * ✅ Şema doğrulandı — gerçek backend curl çıktılarından (2026-09-10):
 * POST /coupons (CreateCouponDto), GET /coupons (sayfalanmış {items, meta}),
 * PATCH/DELETE /coupons/{id}, POST/DELETE /coupons/{id}/products/{productId}
 * ve /coupons/{id}/categories/{categoryId} (aynı pattern), GET /coupons/{id}/usages.
 *
 * ⚠️ BACKEND NOTU: `value`, `minOrderAmount`, `maxDiscount` response'larda
 * STRING olarak dönüyor (createdBy'nin JSON serialization'ı Decimal'i
 * string yapıyor) — request'te number gönderilir, response'da string okunur.
 * Bu alanlar `string` tipinde tutuluyor; hesap yapılacaksa Number() ile çevrilir.
 *
 * ⚠️ UpdateCouponDto'da `code` YOK — kupon kodu oluşturulduktan sonra
 * değiştirilemiyor (form edit modunda code alanı disabled tutulur).
 */
import type { components } from '@/types/generated/api';

export type CouponType = 'PERCENTAGE' | 'FIXED';

export type CouponPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CouponProductLink = { productId: string };
export type CouponCategoryLink = { categoryId: string };

export type Coupon = {
  id: string;
  code: string;
  type: CouponType;
  value: string;
  minOrderAmount: string;
  maxDiscount: string;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  products: CouponProductLink[];
  categories: CouponCategoryLink[];
  /** ⚠️ Sadece bazı response'larda döner (örn. product/category attach sonrası). */
  _count?: { usages: number; orders: number };
};

export type CouponListResponse = {
  items: Coupon[];
  meta: CouponPaginationMeta;
};

/** CreateCouponDto'dan birebir — productIds/categoryIds CREATE'te geçerli. */
export type CreateCouponInput = components['schemas']['CreateCouponDto'];
/** UpdateCouponDto'dan birebir — code/productIds/categoryIds YOK. */
export type UpdateCouponInput = components['schemas']['UpdateCouponDto'];

export type ValidateCouponInput = components['schemas']['ValidateCouponDto'];

/**
 * ✅ DOĞRULANDI (curl, 2026-09-10): POST /coupons/validate response'u.
 * DİKKAT: burada `value` NUMBER (coupon objesinin aksine string değil).
 * discount/subtotal/newTotal da number.
 *
 * Geçersiz kod senaryosu iki şekilde gelebilir: (a) backend ApiException
 * fırlatıp `{success:false, message:'errors.*'}` döner (→ ApiClientError,
 * global onError'da toast) ya da (b) `{valid:false, ...}` döner — UI ikisini
 * de ayrı ele alır (bkz. CouponField).
 */
export type ValidateCouponResponse = {
  valid: boolean;
  couponId?: string;
  code?: string;
  type?: CouponType;
  value?: number;
  discountAmount?: number;
  subtotal?: number;
  newTotal?: number;
  eligibleItemCount?: number;
};

/**
 * ⚠️ ŞEKLİ DOĞRULANMADI (GET /coupons/{id}/usages boş dizi döndü, örnek yok) —
 * alanlar schema.prisma'daki order coupon usage modelinden tahmin edildi.
 * UI'da şu an SADECE sayı (`_count.usages` / `usedCount`) gösteriliyor;
 * tablo eklenmeden önce backend'den dolu bir kayıt alınıp tip doğrulanmalı.
 */
export type CouponUsage = {
  id: string;
  couponId: string;
  orderId: string;
  discountAmount?: string;
  createdAt: string;
};

export type CouponUsagesResponse = {
  items: CouponUsage[];
  meta: CouponPaginationMeta;
};
