import { formatINR, type PricingRules } from '@neon-adda/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { NoAccess } from '@/components/no-access';
import { QuoteBuilder } from '@/components/quotations/quote-builder';
import { SignPreview } from '@/components/sign-preview';
import { Badge, Card, DefinitionList } from '@/components/ui/data';
import { fetchPublishedRateCard } from '@/lib/api';
import { ACTIVITY, formatDate, formatDateTime, formatPhone, QUOTE_KIND, QUOTE_STATUS } from '@/lib/format';
import { FORBIDDEN, load } from '@/lib/load';
import type { AdminQuote } from '@/lib/types';

export const metadata: Metadata = { title: 'Quotation' };

export default async function QuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [quote, rules] = await Promise.all([
    load<AdminQuote>(`/admin/quotations/${encodeURIComponent(id)}`),
    fetchPublishedRateCard(),
  ]);
  if (quote === FORBIDDEN) return <NoAccess title="Quotation" permission="quotations.read" />;

  const status = QUOTE_STATUS[quote.status];
  const request = quote.request;
  const picture = quote.logoUrl ?? quote.previewUrl ?? quote.referenceUrl;
  const priced = quote.items.length > 0;

  return (
    <>
      <div className="mb-6">
        <Link href="/quotations" className="text-sm text-gray-500 hover:text-gray-900">
          Quotations
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-gray-900">
            {quote.quoteNo}
            <span className="ml-2 text-base font-medium text-gray-400">v{quote.version}</span>
          </h1>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        <p className="mt-1 text-sm text-gray-500">Requested {formatDateTime(quote.requestedAt)}</p>
        {!quote.isLatest && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            This is an older version.{' '}
            <Link href={`/quotations/${quote.versions[0]!.id}`} className="font-semibold underline">
              Open v{quote.versions[0]!.version}
            </Link>
          </p>
        )}
        {quote.orderNo && (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Accepted and placed as{' '}
            <Link href={`/orders/${quote.orderNo}`} className="font-semibold underline">
              {quote.orderNo}
            </Link>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {request && (
            <Card title="What the customer asked for">
              <div className="flex flex-col gap-5 sm:flex-row">
                {picture ? (
                  <a href={picture} target="_blank" rel="noreferrer" className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={picture}
                      alt="Customer's design"
                      className="aspect-[1.6] w-full rounded-xl bg-gray-900 object-contain sm:w-64"
                    />
                  </a>
                ) : (
                  quote.lettering && (
                    <SignPreview
                      previewUrl={null}
                      lettering={quote.lettering}
                      className="aspect-[1.6] w-full sm:w-64"
                    />
                  )
                )}
                <div className="flex-1">
                  <DefinitionList
                    rows={[
                      ['Type', QUOTE_KIND[request.kind] ?? request.kind],
                      ...(request.widthIn && request.heightIn
                        ? [['Size', `${request.widthIn}″ × ${request.heightIn}″`] as [string, string]]
                        : []),
                      ['Quantity', String(request.qty)],
                      ['Delivery', `${request.pincode}${request.installation ? ', with installation' : ''}`],
                      ...(request.estimatePaise
                        ? [
                            ['Rate card estimate', `${formatINR(request.estimatePaise)} incl. GST`] as [
                              string,
                              string,
                            ],
                          ]
                        : []),
                    ]}
                  />
                  {quote.logoUrl && (
                    <a
                      href={quote.logoUrl}
                      download
                      className="mt-3 inline-block text-sm font-semibold text-brand hover:underline"
                    >
                      Download the original logo
                    </a>
                  )}
                  {quote.referenceUrl && (
                    <a
                      href={quote.referenceUrl}
                      download
                      className="mt-3 inline-block text-sm font-semibold text-brand hover:underline"
                    >
                      Download the customer&apos;s design picture
                    </a>
                  )}
                </div>
              </div>
              {request.message && (
                <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm whitespace-pre-line text-gray-700">
                  {request.message}
                </p>
              )}
            </Card>
          )}

          <Card title={priced ? 'Quotation' : 'Price this request'}>
            {quote.status === 'CHANGES_REQUESTED' && quote.notes && (
              <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm whitespace-pre-line text-amber-900">
                {quote.notes}
              </p>
            )}
            <QuoteBuilder quote={quote} gstRatePct={(rules as PricingRules | null)?.gstRatePct ?? 18} />
            {['ACCEPTED', 'REJECTED', 'EXPIRED'].includes(quote.status) && priced && (
              <ReadOnlyQuote quote={quote} />
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Customer">
            <p className="text-sm font-medium">
              <Link href={`/customers/${quote.customer.id}`} className="hover:text-brand">
                {quote.customer.name ?? 'No name'}
              </Link>
            </p>
            <p className="text-sm text-gray-500">{formatPhone(quote.customer.phone)}</p>
            {quote.customer.email && <p className="text-sm text-gray-500">{quote.customer.email}</p>}
            {quote.franchise && (
              <p className="mt-3 text-sm text-gray-500">Area franchise: {quote.franchise}</p>
            )}
          </Card>

          {quote.versions.length > 1 && (
            <Card title="Versions">
              <ul className="space-y-2 text-sm">
                {quote.versions.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-2">
                    <Link
                      href={`/quotations/${v.id}`}
                      className={v.id === quote.id ? 'font-semibold' : 'text-brand hover:underline'}
                    >
                      v{v.version}
                    </Link>
                    <Badge tone={QUOTE_STATUS[v.status].tone}>{QUOTE_STATUS[v.status].label}</Badge>
                    <span className="text-gray-500 tabular-nums">
                      {v.totalPaise !== null ? formatINR(v.totalPaise) : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card title="Activity">
            <ul className="space-y-2 text-sm">
              {quote.sentAt && (
                <li className="text-gray-600">
                  Sent {formatDateTime(quote.sentAt)}, valid until {formatDate(quote.validUntil)}
                </li>
              )}
              {quote.respondedAt && (
                <li className="text-gray-600">Customer answered {formatDateTime(quote.respondedAt)}</li>
              )}
              {quote.activity.map((a) => (
                <li key={a.id} className="text-gray-600">
                  <span className="text-gray-900">{a.by}</span> {ACTIVITY[a.action] ?? a.action}
                  <span className="block text-xs text-gray-400">{formatDateTime(a.at)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </>
  );
}

function ReadOnlyQuote({ quote }: { quote: AdminQuote }) {
  return (
    <div className="text-sm">
      <ul className="divide-y divide-gray-100">
        {quote.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 py-2">
            <span>
              {item.description}
              {item.qty > 1 && <span className="text-gray-500"> × {item.qty}</span>}
            </span>
            <span className="tabular-nums">{formatINR(item.amountPaise, { paise: true })}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 border-t border-gray-100 pt-3">
        <DefinitionList
          rows={[
            ...(quote.totals.discountPaise
              ? [
                  ['Discount', `−${formatINR(quote.totals.discountPaise, { paise: true })}`] as [
                    string,
                    string,
                  ],
                ]
              : []),
            [
              'GST',
              formatINR(quote.totals.cgstPaise + quote.totals.sgstPaise + quote.totals.igstPaise, {
                paise: true,
              }),
            ],
            [<strong key="t">Total</strong>, <strong key="v">{formatINR(quote.totals.totalPaise)}</strong>],
          ]}
        />
      </div>
    </div>
  );
}
