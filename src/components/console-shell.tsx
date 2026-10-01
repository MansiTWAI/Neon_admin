'use client';

import type { Profile } from '@neon-adda/shared/web/client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { visibleSections } from '@/lib/navigation';
import { NotificationBell } from './notifications/notification-bell';
import { UserMenu } from './user-menu';

export function ConsoleShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const pathname = usePathname();
  const sections = visibleSections(profile.permissions);
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-5">
          <span className="font-display text-base font-bold tracking-wide">
            <span className="text-brand">NEON</span> ADDA
          </span>
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
            Admin
          </span>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Admin">
          {sections.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive(href)
                  ? 'bg-brand-soft text-brand'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-6">
            <span className="font-display font-bold md:hidden">
              <span className="text-brand">NEON</span> ADDA
            </span>
            <div className="ml-auto flex items-center gap-2">
              <NotificationBell />
              <UserMenu profile={profile} />
            </div>
          </div>
          <nav
            className="flex [scrollbar-width:none] gap-1 overflow-x-auto px-4 pb-2 md:hidden"
            aria-label="Admin sections"
          >
            {sections.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
                  isActive(href) ? 'bg-brand-soft text-brand' : 'text-gray-600'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
