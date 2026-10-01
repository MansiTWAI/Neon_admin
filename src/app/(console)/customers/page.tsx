import { formatINR } from '@neon-adda/shared';
import { Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState } from '@/components/empty-state';
import { NoAccess } from '@/components/no-access';
import { PageHeader } from '@/components/page-header';
import { Cell, Pagination, SearchBox, Table } from '@/components/ui/data';
import { formatDate, formatPhone } from '@/lib/format';
import { FORBIDDEN, load, query } from '@/lib/load';

export const metadata: Metadata = { title: 'Customers' };

interface CustomerPage {
  items: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    createdAt: string;
    lastLoginAt: string | null;
    orders: number;
    paidPaise: number;
  }[];
  page: number;
  pages: number;
  total: number;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const data = await load<CustomerPage>(`/admin/customers${query({ q, page })}`);
  if (data === FORBIDDEN) return <NoAccess title="Customers" permission="customers.read" />;

  return (
    <>
      <PageHeader title="Customers" description="Everyone who has signed in to the store.">
        <SearchBox action="/customers" defaultValue={q} placeholder="Name, email or mobile" />
      </PageHeader>

      {data.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? `No customers match “${q}”` : 'No customers yet'}
          body="Customers appear once they sign in with their mobile number."
        />
      ) : (
        <>
          <Table head={['Customer', 'Mobile', 'Orders', 'Paid', 'Joined', 'Last seen']}>
            {data.items.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <Cell>
                  <Link href={`/customers/${c.id}`} className="font-semibold text-gray-900 hover:text-brand">
                    {c.name ?? 'No name'}
                  </Link>
                  {c.email && <span className="block text-xs text-gray-500">{c.email}</span>}
                </Cell>
                <Cell className="text-gray-600 tabular-nums">{formatPhone(c.phone)}</Cell>
                <Cell className="tabular-nums">{c.orders}</Cell>
                <Cell className="font-medium tabular-nums">{c.paidPaise ? formatINR(c.paidPaise) : '—'}</Cell>
                <Cell className="text-gray-500">{formatDate(c.createdAt)}</Cell>
                <Cell className="text-gray-500">{formatDate(c.lastLoginAt)}</Cell>
              </tr>
            ))}
          </Table>
          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            href={(p) => `/customers${query({ q, page: p })}`}
          />
        </>
      )}
    </>
  );
}
