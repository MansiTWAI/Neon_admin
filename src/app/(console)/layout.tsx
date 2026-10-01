import { redirect } from 'next/navigation';
import { PermissionsProvider } from '@/components/can';
import { ConsoleShell } from '@/components/console-shell';
import { serverApi } from '@/lib/server-api';

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const profile = await serverApi.profile();
  if (!profile) redirect('/login');
  if (profile.twoFactorSetupRequired) redirect('/security');

  return (
    <PermissionsProvider profile={profile}>
      <ConsoleShell profile={profile}>{children}</ConsoleShell>
    </PermissionsProvider>
  );
}
