import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// next-intl request config'in gerçek dosya yolu — bkz. lib/i18n/request.ts
const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

const getHostname = (hostOrUrl?: string) => {
  if (!hostOrUrl) return undefined;
  try {
    if (hostOrUrl.includes('://')) {
      return new URL(hostOrUrl).hostname;
    }
    return hostOrUrl.split(':')[0];
  } catch {
    return hostOrUrl;
  }
};

const mediaHost = getHostname(process.env.NEXT_PUBLIC_MEDIA_HOST);

const nextConfig: NextConfig = {
  images: {
    // Backend/MinIO'nun döndürdüğü görsel URL'lerinin host'u.
    // FRONTEND_STANDARDS.md #10: frontend boyut/preset tanımlamaz, sadece
    // backend'in ürettiği cardUrl/detailUrl/originalUrl'leri next/image'e verir.
     dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
       protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/banners/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'https',
        hostname: '127.0.0.1',
      },
      ...(mediaHost && mediaHost !== 'localhost' && mediaHost !== '127.0.0.1'
        ? [
            {
              protocol: 'http' as const,
              hostname: mediaHost,
            },
            {
              protocol: 'https' as const,
              hostname: mediaHost,
            },
          ]
        : []),
    ],
  },
  // Admin ağacı zaten route bazlı force-dynamic olarak işaretleniyor
  // (bkz. app/admin/layout.tsx) — burada global bir ayar yapılmıyor.
};

export default withNextIntl(nextConfig);
