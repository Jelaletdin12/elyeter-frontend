import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// next-intl request config'in gerçek dosya yolu — bkz. lib/i18n/request.ts
const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    // Backend/MinIO'nun döndürdüğü görsel URL'lerinin host'u.
    // FRONTEND_STANDARDS.md #10: frontend boyut/preset tanımlamaz, sadece
    // backend'in ürettiği cardUrl/detailUrl/originalUrl'leri next/image'e verir.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_MEDIA_HOST ?? 'localhost',
      },
    ],
  },
  // Admin ağacı zaten route bazlı force-dynamic olarak işaretleniyor
  // (bkz. app/admin/layout.tsx) — burada global bir ayar yapılmıyor.
};

export default withNextIntl(nextConfig);
