import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

export function Card({
  title,
  action,
  className = '',
  children,
}: {
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-gray-200 bg-white ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const tones = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-sky-50 text-sky-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  pink: 'bg-brand-soft text-brand',
  violet: 'bg-violet-50 text-violet-700',
};

export type Tone = keyof typeof tones;

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs tracking-wide text-gray-500 uppercase">
            {head.map((cell, i) => (
              <th key={i} className="px-4 py-3 font-medium">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Cell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

/** Tabs that are links, so each queue has its own URL and survives a reload. */
export function QueueTabs({
  tabs,
  active,
}: {
  tabs: { key: string; label: string; href: string; count?: number }[];
  active: string;
}) {
  return (
    <nav
      className="-mx-1 mb-4 flex [scrollbar-width:none] gap-1 overflow-x-auto px-1 pb-1"
      aria-label="Queues"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === active ? 'page' : undefined}
          className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            tab.key === active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={`rounded-full px-1.5 text-xs tabular-nums ${
                tab.key === active ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {tab.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

export function Pagination({
  page,
  pages,
  total,
  href,
}: {
  page: number;
  pages: number;
  total: number;
  href: (page: number) => string;
}) {
  if (pages <= 1) return <p className="mt-3 text-xs text-gray-500">{total} total</p>;
  return (
    <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-1">
        <PageLink href={href(page - 1)} disabled={page <= 1} label="Previous page">
          <ChevronLeft className="size-4" />
        </PageLink>
        <PageLink href={href(page + 1)} disabled={page >= pages} label="Next page">
          <ChevronRight className="size-4" />
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: ReactNode;
}) {
  if (disabled)
    return <span className="rounded-lg border border-gray-200 p-1.5 text-gray-300">{children}</span>;
  return (
    <Link
      href={href}
      aria-label={label}
      className="rounded-lg border border-gray-200 bg-white p-1.5 hover:bg-gray-50"
    >
      {children}
    </Link>
  );
}

export function SearchBox({
  action,
  defaultValue,
  placeholder,
  hidden = {},
}: {
  action: string;
  defaultValue?: string;
  placeholder: string;
  hidden?: Record<string, string>;
}) {
  return (
    <form action={action} className="w-full sm:w-72">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
      />
    </form>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 font-display text-xl font-bold break-words text-gray-900 tabular-nums sm:text-2xl">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function DefinitionList({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    <dl className="divide-y divide-gray-100 text-sm">
      {rows.map(([label, value], i) => (
        <div key={i} className="flex justify-between gap-4 py-2 first:pt-0 last:pb-0">
          <dt className="text-gray-500">{label}</dt>
          <dd className="text-right text-gray-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
