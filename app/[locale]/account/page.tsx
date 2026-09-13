import { ProfileView } from '@/features/profile/components/ProfileView';

/** STANDARDS.md #4: Hesap > Profil — CSR, auth, cache yok. */
export const dynamic = 'force-dynamic';

export default function AccountProfilePage() {
  return <ProfileView />;
}
