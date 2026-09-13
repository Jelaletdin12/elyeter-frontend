'use client';

import { useState } from 'react';
import { QueryCache, MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';
import { ApiClientError } from '@/lib/api/client';
import { resolveErrorMessage } from '@/lib/errors/error-messages';

/**
 * FRONTEND_AGENTS.md #4: Hata mesajları backend'den i18n key olarak gelir.
 * Bu key SADECE burada (global QueryCache/MutationCache onError) çözülür ve
 * tek bir toast mekanizmasıyla (sonner) gösterilir. Component'lerde hardcoded
 * hata metni veya try/catch + manuel toast tekrarı YAZILMAZ — bir mutation'ın
 * kendi onError'ını yazması gerekmiyor, buradaki global handler zaten
 * yakalıyor. Component sadece BAŞARI durumunda kendi toast.success()'unu
 * çağırabilir (her mutation için otomatik başarı mesajı doğru olmayabilir —
 * "Ürün silindi" gibi bağlama özel mesajlar component'te kalır).
 */
function handleGlobalError(error: unknown) {
  if (error instanceof ApiClientError) {
    toast.error(resolveErrorMessage(error.i18nKey));
    return;
  }
  toast.error('Something went wrong. Please try again.');
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: handleGlobalError }),
        mutationCache: new MutationCache({ onError: handleGlobalError }),
        defaultOptions: {
          queries: {
            // Varsayılan; sayfa/feature'a göre queries.ts içinde override edilir
            // (bkz. STANDARDS.md #5 — sepet staleTime:0, profil 5dk, admin 30sn).
            staleTime: 60_000,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
