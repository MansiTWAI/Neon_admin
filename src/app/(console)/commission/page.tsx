import { formatINR } from '@neon-adda/shared';
import { Percent } from 'lucide-react';
import type { Metadata } from 'next';
import { LedgerTable, type LedgerRow } from '@/components/commission/ledger-table';
import { EmptyState } from '@/components/empty-state';
import { NoAccess } from '@/components/no-access';
import { Pagination, QueueTabs } from '@/components/ui/data';
import { COMMISSION_STATUS } from '@/lib/format';
import { FORBIDDEN, load, query } from '@/lib/load';

export const metadata: Metadata = { title: 'Commission' };

interface Ledger {
  items: LedgerRow[];
  page: number;
  pages: number;
  total: number;
  totals: Partial<Record<LedgerRow['status'], { count: number; amountPaise: number }>>;
}

const TABS: [string, string][] = [
  ['ELIGIBLE', 'Ready to approve'],
  ['PENDING', 'Pending'],
  ['APPROVED', 'Approved'],
  ['PAID', 'Paid'],
  ['ON_HOLD', 'On hold'],
  ['REVERSED', 'Reversed'],
  ['', 'All'],
];

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status = 'ELIGIBLE', page } = await searchParams;
  const data = await load<Ledger>(`/admin/commission/ledger${query({ status, page })}`);
  if (data === FORBIDDEN) return <NoAccess title="Commission" permission="commission.read" />;

  return (
    <>
      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        {(['PENDING', 'ELIGIBLE', 'APPROVED', 'PAID'] as const).map((s) => (
          <div key={s} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs text-gray-500">{COMMISSION_STATUS[s].label}</p>
            <p className="font-display text-lg font-bold tabular-nums">
              {formatINR(data.totals[s]?.amountPaise ?? 0)}
            </p>
          </div>
        ))}
      </div>

      <QueueTabs
        active={status}
        tabs={TABS.map(([key, label]) => ({
          key,
          label,
          // An explicit empty status means "all"; leaving it out means the default tab.
          href: `/commission?status=${key}`,
          count: key ? (data.totals[key as LedgerRow['status']]?.count ?? 0) : undefined,
        }))}
      />

      {data.items.length === 0 ? (
        <EmptyState
          icon={Percent}
          title="Nothing here"
          body="Commission is added when a franchise’s customer pays, and becomes ready to approve once the order is complete and the return window has passed."
        />
      ) : (
        <>
          <LedgerTable rows={data.items} />
          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            href={(p) => `/commission?status=${status}&page=${p}`}
          />
        </>
      )}
    </>
  );
}
