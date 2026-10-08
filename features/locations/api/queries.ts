import { queryOptions } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { GeocodingResult } from '../types';

/**
 * Public geocoding endpoint'leri (backend @Public + @Throttle — auth'suz).
 * authorizedFetch yerine apiFetch kullanılır: locations hiçbir kullanıcı
 * oturumu gerektirmez ve public isteklere auth header eklemek anlamsızdır.
 */

/**
 * POST /locations/reverse-geocode — koordinatlardan adres dizesi üretir.
 * Sunucu cache'i bu veriyi zaten saklıyor (Nominatim tekrar istek yapmaz);
 * istemcide de uzun staleTime verilir — pin kaydırmanın her adımında yeni
 * istek atmak anlamsız, pin bırakıldığında son istek dogru adresi döner.
 */
export function reverseGeocodeQuery(latitude: number, longitude: number) {
  return queryOptions({
    queryKey: queryKeys.locations.reverse(latitude, longitude),
    queryFn: () =>
      apiFetch<{ result: GeocodingResult | null }>('/locations/reverse-geocode', {
        method: 'POST',
        body: JSON.stringify({ latitude, longitude }),
        cache: 'no-store',
      }),
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 gün (sunucudaki cache TTL'ine paralel)
  });
}

/**
 * GET /locations/search?q= — adres arama (Nominatim). Debounce'u çağıran
 * component yönetir (LocationInput); burada sadece >= 2 karakter iken
 * enabled olur (backend errors.location_search_too_short).
 */
export function locationSearchQuery(term: string) {
  const normalized = term.trim();
  return queryOptions({
    queryKey: queryKeys.locations.search(normalized),
    queryFn: () =>
      apiFetch<{ results: GeocodingResult[] }>(
        `/locations/search?q=${encodeURIComponent(normalized)}`,
        { cache: 'no-store' },
      ),
    enabled: normalized.length >= 2,
    staleTime: 1000 * 60 * 60 * 24 * 7,
  });
}
