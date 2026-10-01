'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Tabs between the pages of one section, e.g. Pricing → Rate card, Zones, Coupons. */
export function SubNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const active = [...links]
    .sort((a, b) => b.href.length - a.href.length)
    .find((l) => pathname.startsWith(l.href));

  return (
    <nav
      className="-mx-1 mb-6 flex [scrollbar-width:none] gap-1 overflow-x-auto border-b border-gray-200 px-1"
      aria-label="Section"
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={link === active ? 'page' : undefined}
          className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition ${
            link === active
              ? 'border-brand text-brand'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
