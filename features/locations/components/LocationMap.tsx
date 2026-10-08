'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import type { LocationMapProps } from './MapCanvas';

/**
 * Leaflet canvas'ının SSR-safe yükleyicisi — harita yalnızca istemcide
 * çalışır (window gerektirir). next/dynamic ssr:false + ayrı modül ile
 * Leaflet bundle'ı server paketine girmez.
 */
const MapCanvas = dynamic<LocationMapProps>(
  () => import('./MapCanvas').then((mod) => mod.MapCanvas),
  {
    ssr: false,
    loading: () => <MapLoading />,
  },
);

function MapLoading() {
  const t = useTranslations('location');
  return (
    <div className="flex h-80 w-full animate-pulse items-center justify-center rounded-xl border">
      <span className="text-muted-foreground text-xs">{t('mapLoading')}</span>
    </div>
  );
}

export function LocationMap(props: LocationMapProps) {
  return <MapCanvas {...props} />;
}
