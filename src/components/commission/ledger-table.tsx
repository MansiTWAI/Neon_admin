'use client';

import { formatINR } from '@neon-adda/shared';
import Link from 'next/link';
import { useState } from 'react';
import { usePermission } from '@/components/can';
import { Badge, Cell, Table } from '@/components/ui/data';
import { Button, FormError } from '@/components/ui/form';
import { COMMISSION_STATUS, formatDate, type CommissionStatus } from '@/lib/format';
import { useAction } from '@/lib/use-action';

export interface LedgerRow {
  id: string;
  franchise: { id: string; name: string };
  order: { orderNo: string; status: string; createdAt: string };
  source: string;
  basePaise: number;
  amountPaise: number;
  status: CommissionStatus;
  eligibleAt: string | null;
  approvedAt: string | null;
  payout: { id: string; status: string } | null;
}

export function LedgerTable({ rows }: { rows: LedgerRow[] }) {
  const canApprove = usePermission('commission.approve');
  const approve = useAction();
  const hold = useAction();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectable = rows.filter(
    (r) => ['ELIGIBLE', 'PENDING', 'APPROVED', 'ON_HOLD'].includes(r.status) && !r.payout,
  );
  const chosen = rows.filter((r) => selected.has(r.id));
  const chosenTotal = chosen.reduce((sum, r) => sum + r.amountPaise, 0);

  async function run(kind: 'approve' | 'hold' | 'release') {
    const ids = [...selected];
    const ok =
      kind === 'approve'
        ? await approve.run('/admin/commission/ledger/approve', { json: { ids } })
        : await hold.run('/admin/commission/ledger/hold', { json: { ids, hold: kind === 'hold' } });
    if (ok) setSelected(new Set());
  }

  return (
    <>
      {canApprove && chosen.length > 0 && (
        <div className="sticky top-16 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <span className="text-sm">
            {chosen.length} selected ·{' '}
            <span className="font-semibold tabular-nums">{formatINR(chosenTotal, { paise: true })}</span>
          </span>
          <Button
            size="sm"
            className="ml-auto"
            pending={approve.pending}
            onClick={() => run('approve')}
            disabled={!chosen.some((r) => r.status === 'ELIGIBLE')}
          >
            Approve
          </Button>
          <Button size="sm" variant="secondary" pending={hold.pending} onClick={() => run('hold')}>
            Hold
          </Button>
          {chosen.some((r) => r.status === 'ON_HOLD') && (
            <Button size="sm" variant="secondary" pending={hold.pending} onClick={() => run('release')}>
              Release
            </Button>
          )}
          <FormError message={approve.error ?? hold.error} />
        </div>
      )}
      <Table
        head={[
          canApprove ? (
            <input
              key="all"
              type="checkbox"
              aria-label="Select all"
              className="size-4 accent-brand"
              checked={selectable.length > 0 && selectable.every((r) => selected.has(r.id))}
              onChange={(e) =>
                setSelected(e.target.checked ? new Set(selectable.map((r) => r.id)) : new Set())
              }
            />
          ) : (
            ''
          ),
          'Order',
          'Franchise',
          'On',
          'Commission',
          'Status',
        ]}
      >
        {rows.map((row) => (
          <tr key={row.id} className={selected.has(row.id) ? 'bg-brand-soft/40' : 'hover:bg-gray-50'}>
            <Cell className="w-10">
              {canApprove && selectable.includes(row) && (
                <input
                  type="checkbox"
                  aria-label={`Select ${row.order.orderNo}`}
                  className="size-4 accent-brand"
                  checked={selected.has(row.id)}
                  onChange={() => toggle(row.id)}
                />
              )}
            </Cell>
            <Cell>
              <Link href={`/orders/${row.order.orderNo}`} className="font-semibold hover:text-brand">
                {row.order.orderNo}
              </Link>
              <span className="block text-xs text-gray-400">{formatDate(row.order.createdAt)}</span>
            </Cell>
            <Cell>
              <Link href={`/franchises/${row.franchise.id}`} className="hover:text-brand">
                {row.franchise.name}
              </Link>
              <span className="block text-xs text-gray-400">
                {row.source === 'SELF_SOURCED' ? 'their customer' : 'assigned'}
              </span>
            </Cell>
            <Cell className="text-gray-600 tabular-nums">{formatINR(row.basePaise)}</Cell>
            <Cell className="font-semibold tabular-nums">{formatINR(row.amountPaise, { paise: true })}</Cell>
            <Cell>
              <Badge tone={COMMISSION_STATUS[row.status].tone}>{COMMISSION_STATUS[row.status].label}</Badge>
              {row.status === 'PENDING' && (
                <span className="mt-0.5 block text-xs text-gray-400">
                  {row.eligibleAt ? `from ${formatDate(row.eligibleAt)}` : 'until the order completes'}
                </span>
              )}
              {row.payout && row.status === 'APPROVED' && (
                <span className="mt-0.5 block text-xs text-gray-400">in a payout</span>
              )}
            </Cell>
          </tr>
        ))}
      </Table>
    </>
  );
}
