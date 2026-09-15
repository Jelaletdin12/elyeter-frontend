/**
 * Backend hata mesajlarını i18n key olarak gönderiyor (örn.
 * "errors.product_not_found"). Bu dosya bilinen key'leri okunabilir mesaja
 * çeviriyor; bilinmeyen bir key gelirse key'i kabaca "insan diline" çevirip
 * (alt çizgileri boşluğa çevir, baş harfi büyült) fallback olarak gösteriyor
 * — hiçbir zaman kullanıcıya çiğ "errors.xyz" string'i görünmez.
 *
 * ⚠️ Şu an SADECE İngilizce. QueryProvider (app/layout.tsx altında, next-intl'in
 * locale sınırının DIŞINDA — hem /admin hem /[locale]/* için tek instance)
 * next-intl'in useLocale()'ini güvenle çağıramıyor. Çoklu dilde hata mesajı
 * gerektiğinde ya QueryProvider locale sınırının altına taşınır (customer/admin
 * için ayrı instance) ya da pathname'den locale okunur — şimdilik bu
 * over-engineering olur, tek dil yeterli.
 */
const KNOWN_ERROR_MESSAGES: Record<string, string> = {
  'errors.product_not_found': 'This product could not be found.',
  'errors.category_not_found': 'This category could not be found.',
  'errors.no_refresh_token': 'You are not signed in.',
  'errors.invalid_credentials': 'Incorrect email or password.',
  'errors.unauthorized': 'You need to sign in to do that.',
  'errors.forbidden': "You don't have permission to do that.",
  'errors.insufficient_stock': 'Not enough stock available.',
  'errors.unexpected_response': 'Something went wrong. Please try again.',
  'errors.image_too_large': 'This image is too large (max 10 MB).',
  'errors.invalid_image_type': 'This image type is not supported.',
  'errors.image_processing_failed': 'This image could not be processed. Try another one.',
  'errors.no_visual_matches': 'No visually similar products were found.',
  'errors.visual_search_unavailable':
    'Visual search is temporarily unavailable. Please try again later.',
  'errors.visual_search_no_embeddings_indexed': 'Visual search is not set up for this catalog yet.',
  'errors.visual_search_model_init_failed':
    'Visual search could not be initialized. Please try again later.',
  'errors.category_parent_not_found': 'The parent category could not be found.',
  'errors.category_has_children': 'This category has subcategories. Delete or move them first.',
  'errors.category_depth_exceeded': 'Maximum category depth is 3 levels (parent > sub > sub).',
  'errors.category_cannot_use_self_as_parent': 'A category cannot be its own parent.',
  'errors.category_cannot_move_under_descendant': 'This would create a circular hierarchy.',
};

function humanizeKey(key: string): string {
  const withoutPrefix = key.replace(/^errors\./, '');
  const words = withoutPrefix.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function resolveErrorMessage(i18nKey: string): string {
  return KNOWN_ERROR_MESSAGES[i18nKey] ?? humanizeKey(i18nKey);
}
