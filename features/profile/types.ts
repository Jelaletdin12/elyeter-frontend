/**
 * ⚠️ Backend'de bu endpoint'lerin response şeması geçmişte Swagger'a
 * yansımıyordu (ProfileController'da @ApiOkResponse/DTO yoktu) — tipler
 * backend kaynak kodundan (profile.service.ts + schema.prisma ClientAddress)
 * elle çıkarıldı (2026-09-10). Backend'e response DTO'ları eklendi; bir
 * sonraki generate:types sonrası bu dosya <generated> şemalarına ince bir
 * alias'a indirgenecek. (bkz. FRONTEND_AGENTS.md #2)
 */
export type ClientAddress = {
  id: string;
  clientId: string;
  label: string | null;
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  isDefault: boolean;
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
};
