import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AccountLayoutClient } from '@/components/account/account-layout-client';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <AccountLayoutClient user={user}>{children}</AccountLayoutClient>;
}
