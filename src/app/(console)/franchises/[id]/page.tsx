import { formatINR, type OrderStatus } from '@neon-adda/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FranchiseForm, type FranchiseValue } from '@/components/franchises/franchise-form';
import {
  ResetOwnerPassword,
  TechnicianList,
  TerritoryEditor,
} from '@/components/franchises/franchise-panels';
import { NoAccess } from '@/components/no-access';
import { PageHeader } from '@/components/page-header';
import { Badge, Card, DefinitionList, Stat } from '@/components/ui/data';
import { formatDate, formatDateTime, ORDER_STATUS } from '@/lib/format';
import { FORBIDDEN, load } from '@/lib/load';

export const metadata: Metadata = { title: 'Franchise' };

interface Franchise extends FranchiseValue {
  kycVerifiedAt: string | null;
  owner: {
    id: string;
    name: string | null;
    email: string | null;
    lastLoginAt: string | null;
    twoFactorEnabled: boolean;
  } | null;
  pincodes: string[];
  technicians: { id: string; name: string; phone: string; skills: string[]; isActive: boolean }[];
  kioskDevices: { id: string; name: string; lastSeenAt: string | null }[];
  recentOrders: {
    orderNo: string;
    status: OrderStatus;
    totalPaise: number;
    createdAt: string;
    attributionSource: string;
  }[];
  stats: { orders: number; salesPaise: number; commission: Record<string, number> };
}

/** Franchise detail, or the onboarding form when the id is "new". */
export default async function FranchisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [franchise, tiers] = await Promise.all([
    id === 'new' ? null : load<Franchise>(`/admin/franchises/${encodeURIComponent(id)}`),
    load<{ id: string; name: string }[]>('/admin/franchises/tiers'),
  ]);
  if (franchise === FORBIDDEN || tiers === FORBIDDEN)
    return <NoAccess title="Franchise" permission="franchises.read" />;

  if (!franchise) {
    return (
      <>
        <Link href="/franchises" className="text-sm text-gray-500 hover:text-gray-900">
          Franchises
        </Link>
        <PageHeader
          title="Add a franchise"
          description="The owner gets a sign-in for the partner portal. Add pincodes and technicians next."
        />
        <Card>
          <FranchiseForm franchise={null} tiers={tiers} />
        </Card>
      </>
    );
  }

  const owed =
    (franchise.stats.commission.PENDING ?? 0) +
    (franchise.stats.commission.ELIGIBLE ?? 0) +
    (franchise.stats.commission.APPROVED ?? 0);

  return (
    <>
      <Link href="/franchises" className="text-sm text-gray-500 hover:text-gray-900">
        Franchises
      </Link>
      <PageHeader
        title={franchise.name}
        description={`${franchise.code} · ${franchise.city}${franchise.tier ? ` · ${franchise.tier.name} tier` : ''}`}
      >
        <Link
          href={`/orders?franchiseId=${franchise.id}`}
          className="text-sm font-semibold text-brand hover:underline"
        >
          Their orders
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Paid orders" value={franchise.stats.orders} />
        <Stat label="Sales before GST" value={formatINR(franchise.stats.salesPaise)} />
        <Stat
          label="Commission owed"
          value={formatINR(owed)}
          hint={`${formatINR(franchise.stats.commission.PAID ?? 0)} paid so far`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card title="Details">
            <FranchiseForm franchise={franchise} tiers={tiers} />
          </Card>
          <Card title={`Pincodes (${franchise.pincodes.length})`}>
            <TerritoryEditor franchiseId={franchise.id} pincodes={franchise.pincodes} />
          </Card>
          {franchise.recentOrders.length > 0 && (
            <Card title="Recent orders">
              <ul className="divide-y divide-gray-100 text-sm">
                {franchise.recentOrders.map((o) => (
                  <li key={o.orderNo} className="flex items-center justify-between gap-3 py-2">
                    <Link href={`/orders/${o.orderNo}`} className="font-medium hover:text-brand">
                      {o.orderNo}
                    </Link>
                    <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                    <span className="text-xs text-gray-400">
                      {o.attributionSource === 'SELF_SOURCED' ? 'their customer' : 'assigned'}
                    </span>
                    <span className="tabular-nums">{formatINR(o.totalPaise)}</span>
                    <span className="text-gray-400">{formatDate(o.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card title="Owner">
            {franchise.owner ? (
              <>
                <DefinitionList
                  rows={[
                    ['Name', franchise.owner.name ?? '—'],
                    ['Email', franchise.owner.email ?? '—'],
                    ['Last sign-in', formatDateTime(franchise.owner.lastLoginAt) || 'Never'],
                    ['Two-factor', franchise.owner.twoFactorEnabled ? 'On' : 'Off'],
                  ]}
                />
                <div className="mt-4">
                  <ResetOwnerPassword franchiseId={franchise.id} email={franchise.owner.email ?? ''} />
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">No owner account.</p>
            )}
          </Card>
          <Card title={`Technicians (${franchise.technicians.length})`}>
            <TechnicianList franchiseId={franchise.id} technicians={franchise.technicians} />
          </Card>
          <Card title="Kiosk devices">
            {franchise.kioskDevices.length ? (
              <ul className="space-y-1 text-sm">
                {franchise.kioskDevices.map((d) => (
                  <li key={d.id} className="flex justify-between">
                    <span>{d.name}</span>
                    <span className="text-gray-400">
                      {d.lastSeenAt ? formatDateTime(d.lastSeenAt) : 'Not seen'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No kiosks paired.</p>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
