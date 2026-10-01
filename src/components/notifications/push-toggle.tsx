'use client';

import { enablePushNotifications, pushSupport, type PushOutcome } from '@neon-adda/shared/web/client';
import { BellRing } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/browser-api';
import { FIREBASE_CONFIG } from '@/lib/firebase';

type State = PushOutcome | 'available' | 'checking' | 'working' | 'failed';

const LABELS: Partial<Record<State, string>> = {
  enabled: 'Alerts on',
  denied: 'Blocked in browser',
  unsupported: 'Not supported here',
  failed: 'Could not turn on',
};

/** Offers browser push notifications through Firebase Cloud Messaging. Hidden when Firebase is not configured. */
export function PushToggle({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<State>('checking');

  useEffect(() => {
    void pushSupport(FIREBASE_CONFIG).then(setState);
  }, []);

  if (state === 'checking' || state === 'unconfigured') return null;

  async function enable() {
    setState('working');
    try {
      setState(
        await enablePushNotifications(FIREBASE_CONFIG, (token) =>
          api.request('/notifications/admin/devices', { method: 'POST', body: JSON.stringify({ token }) }),
        ),
      );
    } catch {
      setState('failed');
    }
  }

  if (state === 'available' || state === 'working') {
    return (
      <button
        onClick={enable}
        disabled={state === 'working'}
        className={`inline-flex items-center gap-1.5 font-semibold text-brand hover:underline disabled:opacity-60 ${compact ? 'text-xs' : 'text-sm'}`}
      >
        <BellRing className="size-3.5" /> Turn on alerts
      </button>
    );
  }

  return <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>{LABELS[state]}</span>;
}
