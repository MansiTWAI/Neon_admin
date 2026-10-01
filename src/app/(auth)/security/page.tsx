import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { TwoFactorSetup } from '@/components/auth/two-factor-setup';
import { serverApi } from '@/lib/server-api';

export const metadata: Metadata = { title: 'Two-factor authentication' };

export default async function SecurityPage() {
  const profile = await serverApi.profile();
  if (!profile) redirect('/login');
  if (profile.twoFactorEnabled) redirect('/');

  return <TwoFactorSetup required={profile.twoFactorSetupRequired} />;
}
