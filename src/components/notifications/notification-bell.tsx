'use client';

import { Bell } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/browser-api';
import { PushToggle } from './push-toggle';

interface Inbox {
  unread: number;
  items: { id: string; title: string; body: string; readAt: string | null; createdAt: string }[];
}

const POLL_MS = 60_000;

const timeAgo = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24
    ? `${hours} h ago`
    : new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export function NotificationBell() {
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    api
      .request<Inbox>('/notifications/admin')
      .then(setInbox)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  async function toggle() {
    const opening = !open;
    setOpen(opening);
    if (opening && inbox?.unread) {
      await api.request('/notifications/admin/read-all', { method: 'POST' }).catch(() => undefined);
      setInbox((current) => current && { ...current, unread: 0 });
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={toggle}
        aria-expanded={open}
        aria-label={inbox?.unread ? `Notifications, ${inbox.unread} unread` : 'Notifications'}
        className="relative rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
      >
        <Bell className="size-5" />
        {Boolean(inbox?.unread) && (
          <span className="absolute top-1 right-1 size-2 rounded-full bg-brand ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            <PushToggle compact />
          </div>
          {inbox?.items.length ? (
            <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
              {inbox.items.map((item) => (
                <li key={item.id} className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="mt-0.5 text-sm text-gray-500">{item.body}</p>
                  <p className="mt-1 text-xs text-gray-400">{timeAgo(item.createdAt)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-gray-500">You’re all caught up.</p>
          )}
        </div>
      )}
    </div>
  );
}
