import { formatINR } from '@neon-adda/shared';
import { ExternalLink, MessageSquare, Star } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { NoAccess } from '@/components/no-access';
import { InstallationForm } from '@/components/orders/installation-form';
import { RecordPayment, StatusActions } from '@/components/orders/order-actions';
import { ProofUpload } from '@/components/orders/proof-upload';
import { TicketActions } from '@/components/orders/ticket-actions';
import { SignPreview } from '@/components/sign-preview';
import { Badge, Card, DefinitionList } from '@/components/ui/data';
import {
  ACTIVITY,
  formatDate,
  formatDateTime,
  formatPhone,
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  stateName,
  TICKET_TYPE,
} from '@/lib/format';
import { FORBIDDEN, load } from '@/lib/load';
import type { AddressSnapshot, AdminOrder } from '@/lib/types';

interface OrderPageProps {
  params: Promise<{ orderNo: string }>;
}

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  return { title: (await params).orderNo };
}

const PROOF_TONE = {
  PENDING: 'violet',
  APPROVED: 'green',
  CHANGES_REQUESTED: 'amber',
  SUPERSEDED: 'gray',
} as const;
const PROOF_LABEL = {
  PENDING: 'Waiting for customer',
  APPROVED: 'Approved',
  CHANGES_REQUESTED: 'Changes asked',
  SUPERSEDED: 'Replaced',
};

export default async function OrderPage({ params }: OrderPageProps) {
  const { orderNo } = await params;
  const order = await load<AdminOrder>(`/admin/orders/${encodeURIComponent(orderNo)}`);
  if (order === FORBIDDEN) return <NoAccess title="Order" permission="orders.read" />;

  const { totals } = order;
  const status = ORDER_STATUS[order.status];
  const proofsOpen = order.status === 'CONFIRMED' || order.status === 'PROOF_PENDING';

  return (
    <>
      <div className="mb-6">
        <Link href="/orders" className="text-sm text-gray-500 hover:text-gray-900">
          Orders
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-gray-900">{order.orderNo}</h1>
          <Badge tone={status.tone}>{status.label}</Badge>
          <Badge tone={PAYMENT_STATUS[order.paymentStatus].tone}>
            {PAYMENT_STATUS[order.paymentStatus].label}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Placed {formatDateTime(order.placedAt)} ·{' '}
          {order.channel === 'QUOTE' ? 'From a quotation' : 'Website'}
          {order.cancelReason && ` · Cancelled: ${order.cancelReason}`}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusActions orderNo={order.orderNo} current={order.status} moves={order.allowedMoves} />
          <RecordPayment
            orderNo={order.orderNo}
            duePaise={totals.duePaise}
            advancePaise={totals.advanceRequiredPaise - totals.paidPaise}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card title={order.items.length === 1 ? 'Sign' : `Signs (${order.items.length})`}>
            <ul className="-my-5 divide-y divide-gray-100">
              {order.items.map((item) => {
                const latest = item.proofs[0];
                return (
                  <li key={item.id} className="py-5">
                    <div className="flex gap-4">
                      <SignPreview
                        previewUrl={item.previewUrl}
                        lettering={item.lettering}
                        className="h-20 w-28"
                      />
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="font-medium text-gray-900">{item.description}</p>
                        <p className="mt-1 text-gray-500">
                          {item.widthIn > 0 &&
                            `${item.widthIn}″ × ${item.heightIn}″ · ${item.billableSqft} sq ft at ${formatINR(item.ratePerSqftPaise)} · `}
                          Qty {item.qty}
                        </p>
                        {item.addons?.length ? (
                          <p className="text-gray-500">{item.addons.map((a) => a.label).join(', ')}</p>
                        ) : null}
                      </div>
                      <p className="text-sm font-semibold tabular-nums">
                        {formatINR(item.amountPaise, { paise: true })}
                      </p>
                    </div>

                    {item.proofs.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {item.proofs.map((proof) => (
                          <div
                            key={proof.id}
                            className={`flex gap-3 text-sm ${proof.status === 'SUPERSEDED' ? 'opacity-60' : ''}`}
                          >
                            {proof.imageUrl && (
                              <a href={proof.imageUrl} target="_blank" rel="noreferrer" className="shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={proof.imageUrl}
                                  alt={`Proof v${proof.version}`}
                                  className="h-14 w-20 rounded-lg border border-gray-200 object-cover"
                                />
                              </a>
                            )}
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">Proof v{proof.version}</span>
                                <Badge tone={PROOF_TONE[proof.status]}>{PROOF_LABEL[proof.status]}</Badge>
                                <span className="text-xs text-gray-400">{formatDateTime(proof.sentAt)}</span>
                              </div>
                              {proof.designerNote && (
                                <p className="mt-0.5 text-gray-500">{proof.designerNote}</p>
                              )}
                              {proof.customerComment && (
                                <p className="mt-1 flex gap-1.5 text-amber-800">
                                  <MessageSquare className="mt-0.5 size-3.5 shrink-0" />{' '}
                                  {proof.customerComment}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {proofsOpen &&
                      item.proofStatus !== 'APPROVED' &&
                      (!latest || latest.status !== 'PENDING') && (
                        <ProofUpload orderNo={order.orderNo} itemId={item.id} revision={Boolean(latest)} />
                      )}
                    {proofsOpen && latest?.status === 'PENDING' && (
                      <p className="mt-3 text-xs text-gray-500">
                        Waiting for the customer. {3 - item.revisionsUsed} free rounds of changes left.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>

          {order.installationRequired && (
            <Card
              title="Installation"
              action={
                order.installation && (
                  <Badge tone={order.installation.completedAt ? 'green' : 'blue'}>
                    {order.installation.status.toLowerCase()}
                  </Badge>
                )
              }
            >
              {order.installation?.completedAt ? (
                <p className="text-sm">
                  Installed {formatDateTime(order.installation.completedAt)}
                  {order.installation.technician && ` by ${order.installation.technician.name}`}.
                </p>
              ) : ['CANCELLED', 'EXPIRED', 'PENDING_PAYMENT'].includes(order.status) ? (
                <p className="text-sm text-gray-500">Scheduled once the order is paid.</p>
              ) : (
                <InstallationForm order={order} />
              )}
            </Card>
          )}

          {order.tickets.length > 0 && (
            <Card title="Help requests">
              <ul className="-my-2 divide-y divide-gray-100">
                {order.tickets.map((ticket) => (
                  <li
                    key={ticket.id}
                    className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{TICKET_TYPE[ticket.type] ?? ticket.type}</span>
                        <Badge
                          tone={
                            ticket.status === 'OPEN'
                              ? 'amber'
                              : ticket.status === 'IN_PROGRESS'
                                ? 'blue'
                                : 'green'
                          }
                        >
                          {ticket.status.replace('_', ' ').toLowerCase()}
                        </Badge>
                        <span className="text-xs text-gray-400">{formatDateTime(ticket.at)}</span>
                      </div>
                      <p className="mt-1 text-gray-600">{ticket.description}</p>
                      {ticket.resolution && <p className="mt-1 text-emerald-700">{ticket.resolution}</p>}
                    </div>
                    <TicketActions orderNo={order.orderNo} ticket={ticket} />
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card title="History">
            <ol className="space-y-2.5 text-sm">
              {[...order.history].reverse().map((entry, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-28 shrink-0 text-xs text-gray-400">{formatDateTime(entry.at)}</span>
                  <span>
                    <span className="font-medium">{ORDER_STATUS[entry.status].label}</span>
                    {entry.note && <span className="text-gray-500"> · {entry.note}</span>}
                    <span className="text-xs text-gray-400"> · {entry.actorType.toLowerCase()}</span>
                  </span>
                </li>
              ))}
              {order.activity
                .filter((a) => a.action !== 'order.status-changed')
                .map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <span className="w-28 shrink-0 text-xs text-gray-400">{formatDateTime(a.at)}</span>
                    <span className="text-gray-600">
                      {a.by} {ACTIVITY[a.action] ?? a.action}
                    </span>
                  </li>
                ))}
            </ol>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Customer">
            <p className="text-sm font-medium">
              <Link href={`/customers/${order.customer.id}`} className="hover:text-brand">
                {order.customer.name ?? 'No name'}
              </Link>
            </p>
            <p className="text-sm text-gray-500">{formatPhone(order.customer.phone)}</p>
            {order.customer.email && <p className="text-sm text-gray-500">{order.customer.email}</p>}
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">Deliver to</p>
              <Address address={order.shippingAddress} />
            </div>
            {order.franchise && (
              <div className="mt-4 border-t border-gray-100 pt-4 text-sm">
                <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">Franchise</p>
                <Link href={`/franchises/${order.franchise.id}`} className="font-medium hover:text-brand">
                  {order.franchise.name}
                </Link>
                <p className="text-gray-500">
                  {order.franchise.source === 'SELF_SOURCED' ? 'Brought in by them' : 'Assigned by pincode'}
                </p>
              </div>
            )}
          </Card>

          <Card title="Money">
            <DefinitionList
              rows={[
                ['Signs', formatINR(totals.itemsPaise, { paise: true })],
                ...(totals.installationPaise
                  ? [
                      ['Installation', formatINR(totals.installationPaise, { paise: true })] as [
                        string,
                        string,
                      ],
                    ]
                  : []),
                [
                  'Delivery',
                  totals.deliveryPaise ? formatINR(totals.deliveryPaise, { paise: true }) : 'Free',
                ],
                ...(totals.discountPaise
                  ? [
                      [
                        `Discount${order.coupon ? ` (${order.coupon})` : ''}`,
                        `−${formatINR(totals.discountPaise, { paise: true })}`,
                      ] as [string, string],
                    ]
                  : []),
                ['Taxable', formatINR(totals.taxablePaise, { paise: true })],
                ...(totals.igstPaise
                  ? [['IGST', formatINR(totals.igstPaise, { paise: true })] as [string, string]]
                  : [
                      ['CGST', formatINR(totals.cgstPaise, { paise: true })] as [string, string],
                      ['SGST', formatINR(totals.sgstPaise, { paise: true })] as [string, string],
                    ]),
                [<strong key="t">Total</strong>, <strong key="v">{formatINR(totals.totalPaise)}</strong>],
                ['Paid', formatINR(totals.paidPaise)],
                [
                  'Due',
                  <span key="d" className={totals.duePaise ? 'font-semibold text-amber-700' : ''}>
                    {formatINR(totals.duePaise)}
                  </span>,
                ],
              ]}
            />
            {order.paymentMode === 'ADVANCE' && (
              <p className="mt-3 text-xs text-gray-500">
                Advance of {formatINR(totals.advanceRequiredPaise)} starts work.
              </p>
            )}
            {order.payments.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
                {order.payments.map((p) => (
                  <li key={p.id} className="flex justify-between gap-3">
                    <span>
                      <span className="block">{PAYMENT_METHOD[p.method] ?? p.method}</span>
                      <span className="text-xs text-gray-400">
                        {formatDateTime(p.at)}
                        {p.reference && ` · ${p.reference}`}
                      </span>
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatINR(p.amountPaise, { paise: true })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {order.invoices.map((invoice) => (
              <p key={invoice.invoiceNo} className="mt-3 text-sm text-gray-600">
                Tax invoice <span className="font-medium text-gray-900">{invoice.invoiceNo}</span>,{' '}
                {formatDate(invoice.issuedAt)}
              </p>
            ))}
          </Card>

          {order.shipment.awbNo && (
            <Card title="Shipment">
              <p className="text-sm">
                {order.shipment.courierName} · {order.shipment.awbNo}
              </p>
              {order.shipment.trackingUrl && (
                <a
                  href={order.shipment.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
                >
                  Track <ExternalLink className="size-3.5" />
                </a>
              )}
            </Card>
          )}

          {order.commissions.length > 0 && (
            <Card title="Commission">
              {order.commissions.map((c) => (
                <div key={c.id} className="flex justify-between text-sm">
                  <span>
                    <span className="block">{c.franchise}</span>
                    <span className="text-xs text-gray-500">
                      on {formatINR(c.basePaise)} · {c.status.toLowerCase()}
                      {c.eligibleAt && c.status === 'PENDING' && `, payable from ${formatDate(c.eligibleAt)}`}
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatINR(c.amountPaise, { paise: true })}
                  </span>
                </div>
              ))}
            </Card>
          )}

          {order.review && (
            <Card title="Review">
              <p
                className="flex items-center gap-1 text-amber-500"
                aria-label={`${order.review.rating} out of 5`}
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`size-4 ${i < order.review!.rating ? 'fill-current' : 'text-gray-200'}`}
                  />
                ))}
              </p>
              {order.review.comment && <p className="mt-2 text-sm text-gray-600">{order.review.comment}</p>}
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}

function Address({ address }: { address: AddressSnapshot }) {
  return (
    <address className="text-sm text-gray-600 not-italic">
      <span className="block text-gray-900">{address.name}</span>
      {[address.line1, address.line2, address.landmark && `Near ${address.landmark}`]
        .filter(Boolean)
        .map((line) => (
          <span key={line as string} className="block">
            {line}
          </span>
        ))}
      <span className="block">
        {address.city}, {stateName(address.stateCode)} {address.pincode}
      </span>
      <span className="block">{formatPhone(address.phone)}</span>
      {address.gstin && (
        <span className="mt-1 block text-xs">
          {address.businessName} · GSTIN {address.gstin}
        </span>
      )}
    </address>
  );
}
