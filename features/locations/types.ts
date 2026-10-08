/** Backend LocationSource enum'ının frontend karşılığı (location-source enum). */
export type LocationSource = 'MANUAL' | 'MAP' | 'SEARCH' | 'CURRENT_LOCATION';

/** Harita/iGPS'ten gelen konum noktası — adres formları ve checkout'a taşınır. */
export type LocationPoint = {
  latitude: number;
  longitude: number;
  /** Noktanın nasıl üretildiği (backend LocationSource). */
  source: LocationSource;
  /** Metre cinsinden GPS doğruluğu — yalnızca CURRENT_LOCATION ile dolar. */
  accuracy?: number;
};

/** Backend GeocodingResultDto (POST /locations/reverse-geocode, GET /locations/search). */
export type GeocodingResult = {
  addressLine: string;
  latitude: number;
  longitude: number;
  city: string | null;
  district: string | null;
  street: string | null;
  building: string | null;
};
