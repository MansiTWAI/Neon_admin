import { formatINR, type QuotationStatus } from '@neon-adda/shared';
import { FileText } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState } from '@/components/empty-state';
import { NoAccess } from '@/components/no-access';
import { PageHeader } from '@/components/page-header';
import { Badge, Cell, Pagination, QueueTabs, SearchBox, Table } from '@/components/ui/data';
import { formatDate, formatDateTime, formatPhone, QUOTE_KIND, QUOTE_STATUS } from '@/lib/format';
import { FORBIDDEN, load, query } from '@/lib/load';

export const metadata: Metadata = { title: 'Quotations' };

interface QuoteRow {
  id: string;
  quoteNo: string;
  version: number;
  status: QuotationStatus;
  kind: string;
  customer: { name: string | null; phone: string | null };
  franchise: string | null;
  totalPaise: number | null;
  requestedAt: string;
  validUntil: string | null;
}

interface QuotePage {
  items: QuoteRow[];
  page: number;
  pages: number;
  total: number;
  counts: Record<string, number>;
}

const QUEUES = [
  ['open', 'To prepare'],
  ['sent', 'With customer'],
  ['closed', 'Closed'],
  ['all', 'All'],
] as const;

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ queue?: string; q?: string; page?: string }>;
}) {
  const { queue = 'open', q, page } = await searchParams;
  const data = await load<QuotePage>(`/admin/quotations${query({ queue, q, page })}`);
  if (data === FORBIDDEN) return <NoAccess title="Quotations" permission="quotations.read" />;

  const href = (params: { queue?: string; page?: number }) =>
    `/quotations${query({ queue: params.queue ?? queue, q, page: params.page })}`;

  return (
    <>
      <PageHeader title="Quotations" description="Logo, large and bulk requests, priced by the sales team.">
        <SearchBox
          action="/quotations"
          defaultValue={q}
          placeholder="Quote number, name or mobile"
          hidden={{ queue }}
        />
      </PageHeader>

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
          icon={FileText}
          title="No quotations here"
          body="Customers ask for quotations from the logo studio and the quote form."
        />
      ) : (
        <>
          <Table head={['Quotation', 'Customer', 'Type', 'Status', 'Amount', 'Requested']}>
            {data.items.map((quote) => (
              <tr key={quote.id} className="hover:bg-gray-50">
                <Cell>
                  <Link
                    href={`/quotations/${quote.id}`}
                    className="font-semibold text-gray-900 hover:text-brand"
                  >
                    {quote.quoteNo}
                  </Link>
                  {quote.version > 1 && <span className="ml-1 text-xs text-gray-400">v{quote.version}</span>}
                </Cell>
                <Cell>
                  <span className="block">{quote.customer.name ?? 'No name'}</span>
                  <span className="text-xs text-gray-500">{formatPhone(quote.customer.phone)}</span>
                </Cell>
                <Cell className="text-gray-600">{QUOTE_KIND[quote.kind] ?? quote.kind}</Cell>
                <Cell>
                  <Badge tone={QUOTE_STATUS[quote.status].tone}>{QUOTE_STATUS[quote.status].label}</Badge>
                  {quote.status === 'SENT' && quote.validUntil && (
                    <span className="mt-0.5 block text-xs text-gray-400">
                      until {formatDate(quote.validUntil)}
                    </span>
                  )}
                </Cell>
                <Cell className="font-medium tabular-nums">
                  {quote.totalPaise !== null ? (
                    formatINR(quote.totalPaise)
                  ) : (
                    <span className="text-gray-300">Not priced</span>
                  )}
                </Cell>
                <Cell className="whitespace-nowrap text-gray-500">{formatDateTime(quote.requestedAt)}</Cell>
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
