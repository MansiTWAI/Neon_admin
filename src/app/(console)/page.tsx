import { formatINR, type OrderPaymentStatus, type OrderStatus } from '@neon-adda/shared';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { NoAccess } from '@/components/no-access';
import { PageHeader } from '@/components/page-header';
import { Badge, Card, Cell, Stat, Table } from '@/components/ui/data';
import { formatDate, formatDateTime, ORDER_STATUS, PAYMENT_STATUS } from '@/lib/format';
import { FORBIDDEN, load } from '@/lib/load';

interface Dashboard {
  today: { orders: number; collectedPaise: number };
  month: { orders: number; collectedPaise: number };
  queues: Record<string, number>;
  collections: { day: string; amountPaise: number }[];
  recentOrders: {
    orderNo: string;
    status: OrderStatus;
    paymentStatus: OrderPaymentStatus;
    totalPaise: number;
    createdAt: string;
    customer: { name: string | null; phone: string | null };
  }[];
}

/** The day's work, in the order it usually gets done. */
const QUEUES: { key: string; label: string; href: string }[] = [
  { key: 'needs-proof', label: 'Proofs to send', href: '/orders?queue=needs-proof' },
  { key: 'with-customer', label: 'Proofs with customers', href: '/orders?queue=with-customer' },
  { key: 'production', label: 'In production', href: '/orders?queue=production' },
  { key: 'dispatch', label: 'To dispatch or in transit', href: '/orders?queue=dispatch' },
  { key: 'installation', label: 'Installations to finish', href: '/orders?queue=installation' },
  { key: 'cash-to-collect', label: 'Cash to collect', href: '/orders?queue=cash-to-collect' },
  { key: 'quotesToPrepare', label: 'Quotations to prepare', href: '/quotations' },
  { key: 'openTickets', label: 'Open help requests', href: '/orders?queue=support' },
  { key: 'newLeads', label: 'New leads', href: '/leads?status=NEW' },
];

export default async function DashboardPage() {
  const data = await load<Dashboard>('/admin/dashboard');
  if (data === FORBIDDEN) return <NoAccess title="Dashboard" permission="dashboard.read" />;

  const peak = Math.max(...data.collections.map((d) => d.amountPaise), 1);
  const fortnight = data.collections.reduce((sum, d) => sum + d.amountPaise, 0);

  return (
    <>
      <PageHeader title="Dashboard" description="Money in, and the work waiting on each team." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Collected today" value={formatINR(data.today.collectedPaise)} />
        <Stat label="Collected this month" value={formatINR(data.month.collectedPaise)} />
        <Stat label="Orders today" value={data.today.orders} />
        <Stat label="Orders this month" value={data.month.orders} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card
          title="Collections, last 14 days"
          action={<span className="text-xs text-gray-500">{formatINR(fortnight)}</span>}
        >
          <div
            className="flex h-40 items-end gap-1.5"
            role="img"
            aria-label="Daily collections for the last 14 days"
          >
            {data.collections.map((day) => (
              <div key={day.day} className="group relative flex h-full flex-1 flex-col justify-end">
                <div
                  className="rounded-t bg-brand/80 transition group-hover:bg-brand"
                  style={{ height: `${Math.max(2, (day.amountPaise / peak) * 100)}%` }}
                />
                <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded bg-gray-900 px-1.5 py-0.5 text-[11px] whitespace-nowrap text-white group-hover:block">
                  {formatINR(day.amountPaise)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-gray-400">
            <span>{data.collections[0] && formatDate(data.collections[0].day)}</span>
            <span>Today</span>
          </div>
        </Card>

        <Card title="Waiting on us">
          <ul className="-my-1 divide-y divide-gray-100">
            {QUEUES.map((queue) => (
              <li key={queue.key}>
                <Link href={queue.href} className="group flex items-center justify-between py-2 text-sm">
                  <span className="text-gray-700 group-hover:text-gray-900">{queue.label}</span>
                  <span className="flex items-center gap-2">
                    <span
                      className={`font-semibold tabular-nums ${data.queues[queue.key] ? 'text-gray-900' : 'text-gray-300'}`}
                    >
                      {data.queues[queue.key] ?? 0}
                    </span>
                    <ArrowRight className="size-3.5 text-gray-300 group-hover:text-gray-500" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Latest orders</h2>
          <Link href="/orders" className="text-sm font-semibold text-brand hover:underline">
            All orders
          </Link>
        </div>
        <Table head={['Order', 'Customer', 'Status', 'Payment', 'Total', 'Placed']}>
          {data.recentOrders.map((order) => (
            <tr key={order.orderNo} className="hover:bg-gray-50">
              <Cell>
                <Link
                  href={`/orders/${order.orderNo}`}
                  className="font-semibold text-gray-900 hover:text-brand"
                >
                  {order.orderNo}
                </Link>
              </Cell>
              <Cell className="text-gray-600">{order.customer.name ?? order.customer.phone}</Cell>
              <Cell>
                <Badge tone={ORDER_STATUS[order.status].tone}>{ORDER_STATUS[order.status].label}</Badge>
              </Cell>
              <Cell>
                <Badge tone={PAYMENT_STATUS[order.paymentStatus].tone}>
                  {PAYMENT_STATUS[order.paymentStatus].label}
                </Badge>
              </Cell>
              <Cell className="font-medium tabular-nums">{formatINR(order.totalPaise)}</Cell>
              <Cell className="text-gray-500">{formatDateTime(order.createdAt)}</Cell>
            </tr>
          ))}
        </Table>
      </div>
    </>
  );
}
