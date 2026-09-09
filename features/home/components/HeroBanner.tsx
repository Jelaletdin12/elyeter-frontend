import { SearchBar } from './SearchBar';
import type { Banner } from '@/features/banners/types';

/**
 * ✅ Gerçek Banner tipi (curl ile doğrulandı) — headline/başlık ALANI YOK,
 * sadece görsel + link. Önceki mock versiyonda banner'a bağlı bir başlık
 * metni vardı, o veri modelde karşılığı olmadığı için kaldırıldı; yerine
 * sabit bir site sloganı var (banner içeriğinden bağımsız).
 *
 * Tasarımın tek "cesur" hareketi hâlâ aynı: arama kartı banner'ın alt
 * kenarına taşıyor (negatif margin ile).
 *
 * Şu an sadece SIRALAMASI en küçük (order) aktif banner gösteriliyor —
 * çoklu banner varsa carousel/rotation eklemek ayrı bir iş, over-engineering
 * olmasın diye şimdilik kapsam dışı bırakıldı.
 */
export function HeroBanner({ banner, locale }: { banner: Banner; locale: string }) {
  const image = (
    // eslint-disable-next-line @next/next/no-img-element -- gerçek entegrasyonda next/image + remotePatterns
    <img src={banner.desktopUrl} alt="" className="h-full w-full object-cover opacity-90" />
  );

  return (
    <section className="relative">
      <div className="relative h-[52vh] min-h-[320px] w-full overflow-hidden bg-teal sm:h-[60vh]">
        {banner.linkUrl ? (
          <a href={banner.linkUrl} className="block h-full w-full">
            {image}
          </a>
        ) : (
          image
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
        <h1 className="pointer-events-none absolute bottom-10 left-4 max-w-md font-display text-4xl italic leading-tight text-white sm:left-8 sm:text-5xl">
          Discover something new
        </h1>
      </div>

      <div className="mx-auto max-w-xl px-4">
        <div className="-mt-7 sm:-mt-8">
          <SearchBar locale={locale} />
        </div>
      </div>
    </section>
  );
}
