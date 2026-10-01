import {
  formatINR,
  type OrderPaymentStatus,
  type OrderStatus,
  type QuotationStatus,
} from '@neon-adda/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { NoAccess } from '@/components/no-access';
import { Badge, Card, Cell, DefinitionList, Stat, Table } from '@/components/ui/data';
import {
  formatDate,
  formatDateTime,
  formatPhone,
  ORDER_STATUS,
  PAYMENT_STATUS,
  QUOTE_STATUS,
  stateName,
} from '@/lib/format';
import { FORBIDDEN, load } from '@/lib/load';

export const metadata: Metadata = { title: 'Customer' };

interface Customer {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  paidPaise: number;
  addresses: {
    id: string;
    label: string | null;
    name: string;
    line1: string;
    line2: string | null;
    city: string;
    stateCode: string;
    pincode: string;
    gstin: string | null;
    businessName: string | null;
    isDefault: boolean;
  }[];
  orders: {
    orderNo: string;
    status: OrderStatus;
    paymentStatus: OrderPaymentStatus;
    totalPaise: number;
    amountPaidPaise: number;
    createdAt: string;
  }[];
  quotations: { id: string; quoteNo: string; version: number; status: QuotationStatus; createdAt: string }[];
}

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const customer = await load<Customer>(`/admin/customers/${encodeURIComponent((await params).id)}`);
  if (customer === FORBIDDEN) return <NoAccess title="Customer" permission="customers.read" />;

  return (
    <>
      <div className="mb-6">
        <Link href="/customers" className="text-sm text-gray-500 hover:text-gray-900">
          Customers
        </Link>
        <h1 className="mt-1 font-display text-2xl font-bold text-gray-900">{customer.name ?? 'No name'}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {formatPhone(customer.phone)}
          {customer.email && ` · ${customer.email}`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Orders" value={customer.orders.length} />
        <Stat label="Paid in total" value={formatINR(customer.paidPaise)} />
        <Stat
          label="Customer since"
          value={formatDate(customer.createdAt)}
          hint={`Last signed in ${formatDateTime(customer.lastLoginAt) || 'never'}`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Orders</h2>
            {customer.orders.length ? (
              <Table head={['Order', 'Status', 'Payment', 'Total', 'Placed']}>
                {customer.orders.map((o) => (
                  <tr key={o.orderNo} className="hover:bg-gray-50">
                    <Cell>
                      <Link href={`/orders/${o.orderNo}`} className="font-semibold hover:text-brand">
                        {o.orderNo}
                      </Link>
                    </Cell>
                    <Cell>
                      <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                    </Cell>
                    <Cell>
                      <Badge tone={PAYMENT_STATUS[o.paymentStatus].tone}>
                        {PAYMENT_STATUS[o.paymentStatus].label}
                      </Badge>
                    </Cell>
                    <Cell className="tabular-nums">{formatINR(o.totalPaise)}</Cell>
                    <Cell className="text-gray-500">{formatDate(o.createdAt)}</Cell>
                  </tr>
                ))}
              </Table>
            ) : (
              <p className="text-sm text-gray-500">No orders yet.</p>
            )}
          </section>

          {customer.quotations.length > 0 && (
            <Card title="Quotations">
              <ul className="space-y-2 text-sm">
                {customer.quotations.map((q) => (
                  <li key={q.id} className="flex items-center justify-between gap-3">
                    <Link href={`/quotations/${q.id}`} className="font-medium hover:text-brand">
                      {q.quoteNo} v{q.version}
                    </Link>
                    <Badge tone={QUOTE_STATUS[q.status].tone}>{QUOTE_STATUS[q.status].label}</Badge>
                    <span className="text-gray-500">{formatDate(q.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card title="Account">
            <DefinitionList
              rows={[
                ['Status', customer.status.toLowerCase()],
                ['Mobile', formatPhone(customer.phone)],
                ['Email', customer.email ?? '—'],
              ]}
            />
          </Card>
          <Card title="Addresses">
            {customer.addresses.length ? (
              <ul className="space-y-4 text-sm">
                {customer.addresses.map((a) => (
                  <li key={a.id}>
                    <p className="font-medium">
                      {a.label ?? a.name}
                      {a.isDefault && <span className="ml-2 text-xs text-gray-400">default</span>}
                    </p>
                    <p className="text-gray-500">
                      {[a.line1, a.line2].filter(Boolean).join(', ')}, {a.city}, {stateName(a.stateCode)}{' '}
                      {a.pincode}
                    </p>
                    {a.gstin && (
                      <p className="text-xs text-gray-500">
                        {a.businessName} · {a.gstin}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No saved addresses.</p>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
