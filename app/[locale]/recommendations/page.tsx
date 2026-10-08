import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { RecommendedProductsBrowser } from '@/features/recommendations/components/RecommendedProductsBrowser';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'recommendations' });
  return {
    title: t('title'),
  };
}

export default async function RecommendationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <RecommendedProductsBrowser locale={locale} />;
}
