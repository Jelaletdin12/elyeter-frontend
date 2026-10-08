'use client';

import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Leaflet harita tuvali — yalnızca istemcide çalışır (next/dynamic ssr:false
 * ile yüklenir, bkz. LocationMap.tsx). DivIcon kullanılır: varsayılan Leaflet
 * marker'ı webpack ile paketlemede ikon URL'lerini çözemez, custom pin bundan
 * muaftır. OSM tile'ları Nominatim ile aynı sağlayıcı politikasına uyar.
 */

const ASHGABAT_CENTER: [number, number] = [37.9601, 58.3261];

const pinIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:24px;height:24px;background:#0d9488;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.35)"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 20],
});

export type LocationMapProps = {
  /** İlk odak noktası; bakımı yapan component (LocationInput) güncellemez. */
  center?: [number, number];
  /** Aktif iğne konumu (kullanıcı sürükleyebilir). */
  marker: [number, number] | null;
  /** Tıklandığında bile çağrılır; seçimi üst katmana bildirir. */
  onSelect: (latitude: number, longitude: number) => void;
};

function MapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

/**
 * MapContainer'ın center prop'u yalnızca İLK mount'ta uygulanır — pin dışarıdan
 * (GPS/search/çözülen reverse) geldiğinde harita oraya odaklanmaz, marker ekran
 * dışında kalır. Bu bileşen marker değişince haritayı o noktaya uçurur
 * (mevcut zoom korunur, sıçrama olmaz).
 */
function RecenterAutomatically({ latitude, longitude }: { latitude?: number; longitude?: number }) {
  const map = useMap();

  useEffect(() => {
    if (latitude == null || longitude == null) return;
    map.flyTo([latitude, longitude], map.getZoom(), { duration: 0.6 });
  }, [latitude, longitude, map]);

  return null;
}

export function MapCanvas({ center, marker, onSelect }: LocationMapProps) {
  return (
    <div className="relative h-80 w-full overflow-hidden rounded-xl border">
      <MapContainer
        center={marker ?? center ?? ASHGABAT_CENTER}
        zoom={14}
        className="h-full w-full"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {marker && (
          <Marker
            position={marker}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const markerInstance = event.target as L.Marker;
                const position = markerInstance.getLatLng();
                onSelect(position.lat, position.lng);
              },
            }}
          />
        )}

        <MapClickHandler onSelect={onSelect} />

        <RecenterAutomatically latitude={marker?.[0]} longitude={marker?.[1]} />
      </MapContainer>
    </div>
  );
}
