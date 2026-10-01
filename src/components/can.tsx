'use client';

import type { Profile } from '@neon-adda/shared/web/client';
import { createContext, useContext, type ReactNode } from 'react';

const PermissionsContext = createContext<string[]>([]);

export function PermissionsProvider({ profile, children }: { profile: Profile; children: ReactNode }) {
  return <PermissionsContext.Provider value={profile.permissions}>{children}</PermissionsContext.Provider>;
}

export function usePermission(permission: string): boolean {
  return useContext(PermissionsContext).includes(permission);
}

/** Hides an action the signed-in person is not allowed to take. The API refuses it regardless. */
export function Can({ permission, children }: { permission: string; children: ReactNode }) {
  return usePermission(permission) ? children : null;
}
