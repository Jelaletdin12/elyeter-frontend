/**
 * ✅ DOĞRULANDI — gerçek backend curl çıktısından (2026-09-08):
 * POST/GET /banners, GET/PATCH/DELETE /banners/{id}.
 *
 * ⚠️ BACKEND ANOMALİSİ: POST /banners response'unda `linkUrl` alanı, request
 * body'de gönderilen "https://example.com/summer-sale" DEĞİL, banner
 * görselinin desktop URL'i olarak dönmüş. Bu muhtemelen backend'de bir bug
 * (linkUrl'ün yanlışlıkla desktopUrl ile eziliyor olması). Frontend response'u
 * olduğu gibi güveniyor — bu satırı backend tarafında da kontrol ettir,
 * düzelmezse "banner'a tıklayınca yanlış yere gidiyor" şikayeti gelir.
 *
 * GET /banners DÜZ DİZİ döner — { items, meta } YOK, ürün/kategori/kullanıcı
 * listelerinden FARKLI (sayfalama yok).
 */
export type Banner = {
  id: string;
  desktopUrl: string;
  mobileUrl: string;
  desktopObjectKey: string;
  mobileObjectKey: string;
  linkUrl: string;
  isActive: boolean;
  order: number;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateBannerInput = {
  imageId: string;
  linkUrl?: string;
  isActive?: boolean;
  order?: number;
};

export type UpdateBannerInput = Partial<CreateBannerInput>;
