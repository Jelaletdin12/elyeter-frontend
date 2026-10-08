'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Crosshair, Loader2, Map, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationMap } from './LocationMap';
import { locationSearchQuery, reverseGeocodeQuery } from '../api/queries';
import type { LocationPoint, LocationSource } from '../types';

/**
 * Konum giriş bloğu — 3 yöntem: haritadan iğne, adres arama, mevcut GPS konumu.
 * Hem checkout (yeni teslimat adresi) hem profil (adres formu) bunu paylaşır —
 * adres metni dışarıya onResolvedAddress ile bildirilir, koordinatlar value ile.
 *
 * Fail-soft (spec Madde 51): reverse-geocode başarısız olursa koordinat yine
 * onChange'e geçer (null DEĞİL) — sadece adres metni otomatik dolmaz;
 * kullanıcı zaten varsa elle yazdığı metni kaybettirmeyiz.
 */

type Mode = 'map' | 'search';

type LocationInputProps = {
  value: LocationPoint | null;
  onChange: (point: LocationPoint | null) => void;
  /** Reverse-geocode sonucu / arama sonucu adresi — üst formun addressLine alanına doldurulur. */
  onResolvedAddress: (addressLine: string) => void;
  note?: string;
  onNoteChange?: (note: string) => void;
  disabled?: boolean;
};

export function LocationInput({
  value,
  onChange,
  onResolvedAddress,
  note,
  onNoteChange,
  disabled,
}: LocationInputProps) {
  const t = useTranslations('location');
  const [mode, setMode] = useState<Mode>('map');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [locating, setLocating] = useState(false);

  const sourceLabels: Record<LocationSource, string> = {
    MANUAL: t('sourceManual'),
    MAP: t('sourceMap'),
    SEARCH: t('sourceSearch'),
    CURRENT_LOCATION: t('sourceCurrent'),
  };

  // Arama debounce'u — her tuş vuruşunda Nominatim'a istek gitmez.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const searchQuery = useQuery(locationSearchQuery(debouncedQuery));

  // Harita/GPS pin'i → reverse-geocode. Sonuç gelince koordinat onChange + adres
  // onResolvedAddress aracılığıyla üst forma döner.
  const [pendingPoint, setPendingPoint] = useState<{
    latitude: number;
    longitude: number;
    source: LocationSource;
    accuracy?: number;
  } | null>(null);

  const reverseQuery = useQuery({
    ...reverseGeocodeQuery(pendingPoint?.latitude ?? 0, pendingPoint?.longitude ?? 0),
    enabled: pendingPoint !== null,
  });

  useEffect(() => {
    if (!pendingPoint || reverseQuery.data === undefined) return;

    onChange({
      latitude: pendingPoint.latitude,
      longitude: pendingPoint.longitude,
      source: pendingPoint.source,
      accuracy: pendingPoint.accuracy,
    });

    const resolved = reverseQuery.data.result?.addressLine ?? null;
    if (resolved) onResolvedAddress(resolved);

    setPendingPoint(null);
    // onChange/onResolvedAddress aşırı yeniden mount eden proplar — sadece
    // reverseQuery verisi gelince çalıştırılır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reverseQuery.data]);

  function selectFromSearch(addressLine: string, latitude: number, longitude: number) {
    onChange({ latitude, longitude, source: 'SEARCH' });
    onResolvedAddress(addressLine);
  }

  function locateFromGps() {
    if (disabled || typeof navigator === 'undefined' || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setPendingPoint({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          source: 'CURRENT_LOCATION',
          accuracy: Math.round(position.coords.accuracy),
        });
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  const marker: [number, number] | null = pendingPoint
    ? // Reverse-geocode beklerken bile pin haritada görünsün — adres çözülünce
      // onChange ile üst form güncellenir (value), pendingPoint temizlenir.
      [pendingPoint.latitude, pendingPoint.longitude]
    : value
      ? [value.latitude, value.longitude]
      : null;

  return (
    <div className="space-y-3">
      {/* Yöntem seçici */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="border-border flex items-center rounded-lg border p-0.5">
          <button
            type="button"
            onClick={() => setMode('map')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
              mode === 'map' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
            )}
          >
            <Map size={13} />
            {t('modeMap')}
          </button>
          <button
            type="button"
            onClick={() => setMode('search')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
              mode === 'search' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
            )}
          >
            <Search size={13} />
            {t('modeSearch')}
          </button>
        </div>

        <button
          type="button"
          onClick={locateFromGps}
          disabled={disabled || locating}
          className="text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
        >
          {locating ? <Loader2 size={13} className="animate-spin" /> : <Crosshair size={13} />}
          {t('useMyLocation')}
        </button>
      </div>

      {/* Harita */}
      {mode === 'map' ? (
        <LocationMap
          marker={marker}
          onSelect={(lat, lng) => setPendingPoint({ latitude: lat, longitude: lng, source: 'MAP' })}
        />
      ) : (
        <div className="relative">
          <Search size={14} className="text-muted-foreground absolute top-3 left-3" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={disabled}
            placeholder={t('searchPlaceholder')}
            className="border-border bg-card focus:border-primary h-9 w-full rounded-lg border pr-3 pl-9 text-sm transition-colors outline-none placeholder:text-xs"
          />

          {debouncedQuery.trim().length >= 2 && (
            <ul className="border-border bg-card absolute z-20 mt-1 w-full overflow-hidden rounded-lg border shadow-md">
              {searchQuery.isFetching && (
                <li className="text-muted-foreground px-3 py-2.5 text-xs">
                  <Loader2 size={12} className="mr-1.5 inline animate-spin" />
                  {t('searching')}
                </li>
              )}

              {!searchQuery.isFetching &&
                (searchQuery.data?.results ?? []).map((result, index) => (
                  <li key={`${result.latitude}-${result.longitude}-${index}`}>
                    <button
                      type="button"
                      onClick={() =>
                        selectFromSearch(result.addressLine, result.latitude, result.longitude)
                      }
                      className="hover:bg-muted text-foreground w-full px-3 py-2 text-left text-xs transition-colors"
                    >
                      {result.addressLine}
                    </button>
                  </li>
                ))}

              {!searchQuery.isFetching && (searchQuery.data?.results ?? []).length === 0 && (
                <li className="text-muted-foreground px-3 py-2.5 text-xs">{t('noResults')}</li>
              )}
            </ul>
          )}
        </div>
      )}

      {/* Seçilen konum özeti */}
      {pendingPoint && (
        <p className="flex items-center gap-1.5 text-xs">
          <Loader2 size={12} className="text-primary animate-spin" />
          <span className="text-muted-foreground">{t('resolving')}</span>
        </p>
      )}

      {value && !pendingPoint && (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Map size={12} className="text-primary" />
          {t('selected', {
            source:
              value.accuracy != null
                ? `${sourceLabels[value.source]}, ±${value.accuracy} m`
                : sourceLabels[value.source],
          })}
        </p>
      )}

      {/* Teslimat notu */}
      {onNoteChange && (
        <div>
          <label className="text-foreground mb-1.5 block text-xs font-medium">
            {t('deliveryNote')}{' '}
            <span className="text-muted-foreground font-normal">{t('optional')}</span>
          </label>
          <input
            type="text"
            value={note ?? ''}
            onChange={(event) => onNoteChange(event.target.value)}
            disabled={disabled}
            placeholder={t('notePlaceholder')}
            className="border-border bg-card focus:border-primary h-9 w-full rounded-lg border px-3 text-sm transition-colors outline-none placeholder:text-xs"
          />
        </div>
      )}
    </div>
  );
}
