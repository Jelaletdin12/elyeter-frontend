/**
 * JWT'yi İMZASINI DOĞRULAMADAN çözer — bu SADECE client tarafında hızlı UI
 * state'i (id/email/role) için kullanılır. Gerçek yetki kontrolü her zaman
 * backend'de (her istekte Authorization header'ı backend'in kendi
 * doğrulamasından geçer) — burası sadece "sayfa yenilendi, bu kullanıcı kim"
 * sorusuna hızlı cevap vermek için.
 *
 * NEDEN GEREKLİ: POST /auth/refresh response'u sadece { accessToken,
 * refreshToken } döndürüyor — user bilgisi YOK. Backend'de ayrıca bir
 * "GET /users/me" (kendi profilim) endpoint'i de yok, sadece admin'in
 * kullanabileceği GET /users/{id} var. Bu yüzden id/email/role'ü JWT'den
 * çözüyoruz; fullName JWT'de olmadığı için ayrıca bkz. providers/AuthHydrator.tsx.
 */

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'CLIENT';
  iat: number;
  exp: number;
};

export function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) return null;

    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    const parsed: unknown = JSON.parse(json);

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'sub' in parsed &&
      'email' in parsed &&
      'role' in parsed
    ) {
      return parsed as AccessTokenPayload;
    }
    return null;
  } catch {
    return null;
  }
}
