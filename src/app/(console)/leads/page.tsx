import { Inbox } from 'lucide-react';
import type { Metadata } from 'next';
import { EmptyState } from '@/components/empty-state';
import { LeadRowActions } from '@/components/leads/lead-row-actions';
import { NoAccess } from '@/components/no-access';
import { PageHeader } from '@/components/page-header';
import { Cell, Pagination, QueueTabs, SearchBox, Table } from '@/components/ui/data';
import { formatDateTime, formatPhone } from '@/lib/format';
import { FORBIDDEN, load, query } from '@/lib/load';

export const metadata: Metadata = { title: 'Leads' };

interface LeadPage {
  items: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    pincode: string | null;
    message: string | null;
    source: string;
    status: string;
    franchiseId: string | null;
    createdAt: string;
  }[];
  page: number;
  pages: number;
  total: number;
  counts: Record<string, number>;
}

const SOURCES: Record<string, string> = {
  CONTACT: 'Contact form',
  BUSINESS: 'Business enquiry',
  FRANCHISE_ENQUIRY: 'Wants a franchise',
};

const TABS = [
  ['', 'All'],
  ['NEW', 'New'],
  ['CONTACTED', 'Contacted'],
  ['QUOTED', 'Quoted'],
  ['WON', 'Won'],
  ['LOST', 'Lost'],
] as const;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status = '', q, page } = await searchParams;
  const [data, franchises] = await Promise.all([
    load<LeadPage>(`/admin/leads${query({ status, q, page })}`),
    load<{ id: string; name: string }[]>('/admin/franchises'),
  ]);
  if (data === FORBIDDEN) return <NoAccess title="Leads" permission="customers.read" />;

  const total = Object.values(data.counts).reduce((a, b) => a + b, 0);
  const href = (params: { status?: string; page?: number }) =>
    `/leads${query({ status: params.status ?? status, q, page: params.page })}`;

  return (
    <>
      <PageHeader
        title="Leads"
        description="Enquiries from the contact form. Leads in a franchise’s pincodes go to that franchise."
      >
        <SearchBox
          action="/leads"
          defaultValue={q}
          placeholder="Name, mobile or message"
          hidden={{ status }}
        />
      </PageHeader>

      <QueueTabs
        active={status}
        tabs={TABS.map(([key, label]) => ({
          key,
          label,
          href: href({ status: key }),
          count: key ? data.counts[key] : total,
        }))}
      />

      {data.items.length === 0 ? (
        <EmptyState icon={Inbox} title="No leads here" body="Enquiries from the website appear here." />
      ) : (
        <>
          <Table head={['Enquiry', 'Contact', 'Received', 'Handling']}>
            {data.items.map((lead) => (
              <tr key={lead.id} className="align-top">
                <Cell className="max-w-md">
                  <span className="block font-medium text-gray-900">{lead.name}</span>
                  <span className="text-xs text-gray-400">{SOURCES[lead.source] ?? lead.source}</span>
                  {lead.message && <p className="mt-1 line-clamp-3 text-gray-600">{lead.message}</p>}
                </Cell>
                <Cell className="whitespace-nowrap">
                  <a href={`tel:${lead.phone}`} className="block font-medium hover:text-brand">
                    {formatPhone(lead.phone)}
                  </a>
                  {lead.email && <span className="block text-xs text-gray-500">{lead.email}</span>}
                  {lead.pincode && <span className="block text-xs text-gray-500">{lead.pincode}</span>}
                </Cell>
                <Cell className="whitespace-nowrap text-gray-500">{formatDateTime(lead.createdAt)}</Cell>
                <Cell>
                  <LeadRowActions lead={lead} franchises={franchises === FORBIDDEN ? [] : franchises} />
                </Cell>
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
