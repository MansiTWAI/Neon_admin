import { formatINR, type OrderPaymentStatus, type OrderStatus } from '@neon-adda/shared';
import { ClipboardList, Wrench } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState } from '@/components/empty-state';
import { NoAccess } from '@/components/no-access';
import { PageHeader } from '@/components/page-header';
import { Badge, Cell, Pagination, QueueTabs, SearchBox, Table } from '@/components/ui/data';
import { formatDateTime, formatPhone, ORDER_STATUS, PAYMENT_STATUS } from '@/lib/format';
import { FORBIDDEN, load, query } from '@/lib/load';

export const metadata: Metadata = { title: 'Orders' };

interface OrderRow {
  orderNo: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  channel: string;
  totalPaise: number;
  duePaise: number;
  installationRequired: boolean;
  createdAt: string;
  signs: number;
  changesRequested: boolean;
  customer: { name: string | null; phone: string | null };
  franchise: { name: string } | null;
}

interface OrderPage {
  items: OrderRow[];
  page: number;
  pages: number;
  total: number;
  counts: Record<string, number>;
}

const QUEUES = [
  ['all', 'All'],
  ['cash-to-collect', 'Cash to collect'],
  ['needs-proof', 'Proofs to send'],
  ['with-customer', 'With customer'],
  ['production', 'Production'],
  ['dispatch', 'Dispatch'],
  ['installation', 'Installation'],
  ['support', 'Help requests'],
  ['on-hold', 'On hold'],
  ['closed', 'Closed'],
] as const;

interface OrdersPageProps {
  searchParams: Promise<{ queue?: string; q?: string; page?: string; franchiseId?: string }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const { queue = 'all', q, page, franchiseId } = await searchParams;
  const data = await load<OrderPage>(`/admin/orders${query({ queue, q, page, franchiseId })}`);
  if (data === FORBIDDEN) return <NoAccess title="Orders" permission="orders.read" />;

  const href = (params: { queue?: string; page?: number }) =>
    `/orders${query({ queue: params.queue ?? queue, q, franchiseId, page: params.page })}`;

  return (
    <>
      <PageHeader
        title="Orders"
        description="Every order, from confirmation to installation and cash collection."
      >
        <SearchBox
          action="/orders"
          defaultValue={q}
          placeholder="Order number, name or mobile"
          hidden={{ queue }}
        />
      </PageHeader>

      {franchiseId && (
        <p className="mb-3 text-sm text-gray-500">
          Showing one franchise’s orders.{' '}
          <Link href={`/orders${query({ queue })}`} className="font-semibold text-brand hover:underline">
            Show all
          </Link>
        </p>
      )}
      <QueueTabs
        active={queue}
        tabs={QUEUES.map(([key, label]) => ({
          key,
          label,
          href: href({ queue: key }),
          count: data.counts[key],
        }))}
      />

      {data.items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={q ? `No orders match “${q}”` : 'Nothing in this queue'}
          body="Orders appear here as soon as customers place them."
        />
      ) : (
        <>
          <Table head={['Order', 'Customer', 'Status', 'Payment', 'Total', 'Franchise', 'Placed']}>
            {data.items.map((order) => (
              <tr key={order.orderNo} className="hover:bg-gray-50">
                <Cell>
                  <Link
                    href={`/orders/${order.orderNo}`}
                    className="font-semibold text-gray-900 hover:text-brand"
                  >
                    {order.orderNo}
                  </Link>
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                    {order.signs} {order.signs === 1 ? 'sign' : 'signs'}
                    {order.installationRequired && <Wrench className="size-3" aria-label="Installation" />}
                  </span>
                </Cell>
                <Cell>
                  <span className="block text-gray-900">{order.customer.name ?? 'No name'}</span>
                  <span className="text-xs text-gray-500">{formatPhone(order.customer.phone)}</span>
                </Cell>
                <Cell>
                  <Badge tone={order.changesRequested ? 'amber' : ORDER_STATUS[order.status].tone}>
                    {order.changesRequested ? 'Changes asked' : ORDER_STATUS[order.status].label}
                  </Badge>
                </Cell>
                <Cell>
                  <Badge tone={PAYMENT_STATUS[order.paymentStatus].tone}>
                    {PAYMENT_STATUS[order.paymentStatus].label}
                  </Badge>
                </Cell>
                <Cell className="tabular-nums">
                  <span className="font-medium">{formatINR(order.totalPaise)}</span>
                  {order.duePaise > 0 && order.duePaise < order.totalPaise && (
                    <span className="block text-xs text-amber-700">{formatINR(order.duePaise)} due</span>
                  )}
                </Cell>
                <Cell className="text-gray-600">
                  {order.franchise?.name ?? <span className="text-gray-300">Direct</span>}
                </Cell>
                <Cell className="whitespace-nowrap text-gray-500">{formatDateTime(order.createdAt)}</Cell>
              </tr>
            ))}
          </Table>
          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            href={(p) => href({ page: p })}
          />
        </>
      )}
    </>
  );
}
