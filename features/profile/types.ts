/**
 * ⚠️ Backend'de bu endpoint'lerin response şeması geçmişte Swagger'a
 * yansımıyordu (ProfileController'da @ApiOkResponse/DTO yoktu) — tipler
 * backend kaynak kodundan (profile.service.ts + schema.prisma ClientAddress)
 * elle çıkarıldı (2026-09-10). Backend'e response DTO'ları eklendi; bir
 * sonraki generate:types sonrası bu dosya <generated> şemalarına ince bir
 * alias'a indirgenecek. (bkz. FRONTEND_AGENTS.md #2)
 */
export type LocationSource = 'MANUAL' | 'MAP' | 'SEARCH' | 'CURRENT_LOCATION';

export type ClientAddress = {
  id: string;
  clientId: string;
  label: string | null;
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  isDefault: boolean;
  // Konum (opsiyonel) — backend ClientAddress geo alanları. latitude/longitude
  // string (Prisma Decimal) gelir; null = koordinatsız manuel adres.
  latitude: string | null;
  longitude: string | null;
  locationSource: LocationSource | null;
  locationAccuracy: number | null;
  deliveryNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  addresses: ClientAddress[];
};

export type ProfileAddressInput = {
  label?: string;
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  isDefault?: boolean;
  // Konum alanları — LocationInput'tan dolar; boş bırakılınca koordinatlar
  // silinir (backend update: null = MANUAL'a düşer, coords temizlenir).
  latitude?: number;
  longitude?: number;
  locationSource?: LocationSource;
  locationAccuracy?: number;
  deliveryNote?: string;
};
