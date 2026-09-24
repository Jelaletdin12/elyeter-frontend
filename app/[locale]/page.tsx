import { getTranslations } from 'next-intl/server';

import { getPublicBanners } from '@/features/banners/api/queries';
import { getGuestHomeRecommendations } from '@/features/recommendations/api/queries';
import { ForYouSection } from '@/features/recommendations/components/ForYouSection';
import { HeroBanner } from '@/features/home/components/HeroBanner';
import { CategoryRail } from '@/features/home/components/CategoryRail';
import { ProductGrid } from '@/features/home/components/ProductGrid';

/**
 * ✅ GERÇEK veri — banners curl ile doğrulandı.
 * Öneri motoru: kategori şeridi + trending + newArrivals misafir payload'ından
 * SERVER'da (ISR) çekilir; kişisel forYou + marka şeridi ForYouSection ile
 * client'ta (JWT) dolar — anasayfa ISR olduğu için kişisel bölümler Full Route
 * Cache'e giremez (STANDARDS.md #4).
 *
 * KATEGORİ şeridi için ayrı category API çağrısı YAPILMAZ — /recommendations/home
 * zaten `categories` bölümünü (popüler kategoriler, slug'lı) döner.
 *
 * STANDARDS.md #4: ISR, tags:['home','banners','products'], revalidate:300.
 */

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const [banners, guestHome, t] = await Promise.all([
    getPublicBanners(),
    getGuestHomeRecommendations(),
    getTranslations('home'),
  ]);

  return (
    <div>
      {banners.length > 0 && <HeroBanner banners={banners} locale={locale} />}

      <CategoryRail categories={guestHome.categories} locale={locale} />

      {/* Kişisel "Sizin için" (ürünler + marka şeridi) — yalnızca oturumluyken render edilir */}
      <ForYouSection locale={locale} />

      {guestHome.trending.length > 0 && (
        <ProductGrid products={guestHome.trending} locale={locale} title={t('trending')} />
      )}

      {guestHome.newArrivals.length > 0 && (
        <ProductGrid products={guestHome.newArrivals} locale={locale} title={t('newArrivals')} />
      )}
    </div>
  );
}