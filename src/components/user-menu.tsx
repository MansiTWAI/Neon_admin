'use client';

import type { Profile } from '@neon-adda/shared/web/client';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/browser-api';

export function UserMenu({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const initials = (profile.name ?? profile.email ?? '?')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function signOut() {
    setSigningOut(true);
    await api.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <div className="grid size-8 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">
        {initials}
      </div>
      <div className="hidden leading-tight sm:block">
        <p className="text-sm font-medium text-gray-900">{profile.name}</p>
        <p className="text-xs text-gray-500">{profile.roles.map((role) => role.name).join(', ')}</p>
      </div>
      <button
        onClick={signOut}
        disabled={signingOut}
        aria-label="Sign out"
        title="Sign out"
        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
