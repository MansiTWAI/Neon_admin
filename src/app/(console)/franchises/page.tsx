import { formatINR } from '@neon-adda/shared';
import { Building2, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Can } from '@/components/can';
import { EmptyState } from '@/components/empty-state';
import { NoAccess } from '@/components/no-access';
import { PageHeader } from '@/components/page-header';
import { Badge, Cell, SearchBox, Table } from '@/components/ui/data';
import { FRANCHISE_STATUS } from '@/lib/format';
import { FORBIDDEN, load, query } from '@/lib/load';

export const metadata: Metadata = { title: 'Franchises' };

interface FranchiseRow {
  id: string;
  code: string;
  name: string;
  city: string;
  status: 'PENDING_KYC' | 'ACTIVE' | 'SUSPENDED';
  tier: string | null;
  owner: { name: string | null; email: string | null } | null;
  pincodes: number;
  technicians: number;
  orders: number;
  commissionOwedPaise: number;
}

export default async function FranchisesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const franchises = await load<FranchiseRow[]>(`/admin/franchises${query({ q })}`);
  if (franchises === FORBIDDEN) return <NoAccess title="Franchises" permission="franchises.read" />;

  return (
    <>
      <PageHeader
        title="Franchises"
        description="Partners, the pincodes they cover and the technicians who install for them."
      >
        <div className="flex flex-wrap gap-2">
          <SearchBox action="/franchises" defaultValue={q} placeholder="Name, code or city" />
          <Can permission="franchises.write">
            <Link
              href="/franchises/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              <Plus className="size-4" /> Add franchise
            </Link>
          </Can>
        </div>
      </PageHeader>

      {franchises.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No franchises yet"
          body="Add a partner to start routing orders and enquiries by pincode."
        />
      ) : (
        <Table
          head={[
            'Franchise',
            'Owner',
            'Tier',
            'Pincodes',
            'Technicians',
            'Orders',
            'Commission owed',
            'Status',
          ]}
        >
          {franchises.map((f) => (
            <tr key={f.id} className="hover:bg-gray-50">
              <Cell>
                <Link href={`/franchises/${f.id}`} className="font-semibold text-gray-900 hover:text-brand">
                  {f.name}
                </Link>
                <span className="block text-xs text-gray-500">
                  {f.code} · {f.city}
                </span>
              </Cell>
              <Cell className="text-gray-600">
                {f.owner?.name}
                <span className="block text-xs text-gray-400">{f.owner?.email}</span>
              </Cell>
              <Cell className="text-gray-600">{f.tier ?? '—'}</Cell>
              <Cell className="tabular-nums">{f.pincodes}</Cell>
              <Cell className="tabular-nums">{f.technicians}</Cell>
              <Cell className="tabular-nums">{f.orders}</Cell>
              <Cell className="tabular-nums">
                {f.commissionOwedPaise ? formatINR(f.commissionOwedPaise) : '—'}
              </Cell>
              <Cell>
                <Badge tone={FRANCHISE_STATUS[f.status].tone}>{FRANCHISE_STATUS[f.status].label}</Badge>
              </Cell>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
