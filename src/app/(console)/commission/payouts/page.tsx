import { formatINR } from '@neon-adda/shared';
import { Banknote } from 'lucide-react';
import type { Metadata } from 'next';
import { CreatePayout, PayoutActions } from '@/components/commission/payout-actions';
import { EmptyState } from '@/components/empty-state';
import { NoAccess } from '@/components/no-access';
import { Badge, Card, Cell, Table } from '@/components/ui/data';
import { formatDate, formatDateTime } from '@/lib/format';
import { FORBIDDEN, load } from '@/lib/load';

export const metadata: Metadata = { title: 'Payouts' };

interface Payouts {
  ready: { franchiseId: string; franchise: string; commissions: number; amountPaise: number }[];
  payouts: {
    id: string;
    franchise: string;
    bank: string | null;
    periodStart: string;
    periodEnd: string;
    commissions: number;
    grossPaise: number;
    tdsPaise: number;
    netPaise: number;
    status: 'DRAFT' | 'PAID' | 'CANCELLED';
    mode: string | null;
    utr: string | null;
    paidAt: string | null;
  }[];
}

export default async function PayoutsPage() {
  const data = await load<Payouts>('/admin/commission/payouts');
  if (data === FORBIDDEN) return <NoAccess title="Payouts" permission="commission.read" />;

  return (
    <div className="space-y-6">
      <Card title="Approved and not yet paid">
        {data.ready.length ? (
          <ul className="divide-y divide-gray-100">
            {data.ready.map((r) => (
              <li key={r.franchiseId} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <span className="flex-1 font-medium">{r.franchise}</span>
                <span className="text-gray-500">{r.commissions} orders</span>
                <span className="w-28 text-right font-semibold tabular-nums">
                  {formatINR(r.amountPaise, { paise: true })}
                </span>
                <CreatePayout franchiseId={r.franchiseId} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            Approve commission in the ledger and it gathers here, one payout per franchise.
          </p>
        )}
      </Card>

      {data.payouts.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="No payouts yet"
          body="Payouts you prepare appear here until they are paid."
        />
      ) : (
        <Table head={['Franchise', 'Orders from', 'Gross', 'TDS', 'Net', 'Status', '']}>
          {data.payouts.map((p) => (
            <tr key={p.id}>
              <Cell className="font-medium">{p.franchise}</Cell>
              <Cell className="whitespace-nowrap text-gray-500">
                {formatDate(p.periodStart)} to {formatDate(p.periodEnd)}
                <span className="block text-xs">{p.commissions} orders</span>
              </Cell>
              <Cell className="tabular-nums">{formatINR(p.grossPaise, { paise: true })}</Cell>
              <Cell className="text-gray-500 tabular-nums">{formatINR(p.tdsPaise, { paise: true })}</Cell>
              <Cell className="font-semibold tabular-nums">{formatINR(p.netPaise, { paise: true })}</Cell>
              <Cell>
                <Badge tone={p.status === 'PAID' ? 'green' : p.status === 'DRAFT' ? 'amber' : 'gray'}>
                  {p.status === 'DRAFT' ? 'To pay' : p.status.toLowerCase()}
                </Badge>
                {p.utr && (
                  <span className="mt-0.5 block text-xs text-gray-400">
                    {p.mode} {p.utr} · {formatDateTime(p.paidAt)}
                  </span>
                )}
              </Cell>
              <Cell>{p.status === 'DRAFT' && <PayoutActions payout={p} />}</Cell>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
