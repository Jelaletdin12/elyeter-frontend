import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { ServerToClientEvents } from './events';

export type RealtimeSocket = Socket<ServerToClientEvents>;

/**
 * Canlı bildirim için Socket.IO istemcisi.
 *
 * - URL: REST'teki base URL ile aynı origin (`NEXT_PUBLIC_API_BASE_URL`).
 *   Socket.IO'un default path'i `/socket.io` olduğundan backend'deki global
 *   REST prefix'inin (`/api/v1`) buraya eklenmemesi gerekir.
 * - Auth: handshake `auth` alanındaki access token'ı backend'de
 *   `RealtimeGateway` jwt.accessSecret ile doğrular; başarısızsa sunucu
 *   istemciyi disconnect eder. Token yaşam döngüsü bu yüzden
 *   `providers/RealtimeProvider.tsx`'te yönetilir (refresh'te yeniden bağlanır).
 * - Cookie'ler (`withCredentials`) gönderilmektedir; refresh token zaten
 *   httpOnly cookie'dedir ve socket handshake'i için kullanılmaz.
 */
export function createRealtimeSocket(token: string): RealtimeSocket | null {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    // Backend origin'i tanımlı değilse canlı bildirim sessizce devre dışı
    // kalır (sayfa tarafında polling fallback'i de yok, bkz. AGENTS.md #35).
    console.warn(
      '[realtime] NEXT_PUBLIC_API_BASE_URL tanımlı değil — canlı bildirim bağlantısı kurulamadı.',
    );
    return null;
  }

  return io(baseUrl, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
    withCredentials: true,
  });
}
