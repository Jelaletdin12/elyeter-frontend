import { WishlistView } from '@/features/wishlist/components/WishlistView';

/** STANDARDS.md #4: Hesap > Favoriler — CSR, auth gerektirir, cache yok.
 *  Sayfa /account altına taşındı (önceden /wishlist'teydi), shell'i
 *  account/layout sağlar. */
export const dynamic = 'force-dynamic';

export default function AccountWishlistPage() {
  return <WishlistView />;
}
