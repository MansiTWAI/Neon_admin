import { formatINR } from '@neon-adda/shared';
import { Ticket } from 'lucide-react';
import type { Metadata } from 'next';
import { EmptyState } from '@/components/empty-state';
import { NoAccess } from '@/components/no-access';
import { CouponDialog, type Coupon } from '@/components/pricing/coupon-dialog';
import { Badge, Cell, Table } from '@/components/ui/data';
import { formatDate } from '@/lib/format';
import { FORBIDDEN, load } from '@/lib/load';

export const metadata: Metadata = { title: 'Coupons' };

function state(coupon: Coupon): { label: string; tone: 'green' | 'gray' | 'amber' | 'blue' } {
  const now = Date.now();
  if (!coupon.isActive) return { label: 'Off', tone: 'gray' };
  if (new Date(coupon.startsAt).getTime() > now) return { label: 'Scheduled', tone: 'blue' };
  if (coupon.endsAt && new Date(coupon.endsAt).getTime() < now) return { label: 'Ended', tone: 'gray' };
  if (coupon.usageLimit && coupon.used >= coupon.usageLimit) return { label: 'Used up', tone: 'amber' };
  return { label: 'Live', tone: 'green' };
}

export default async function CouponsPage() {
  const coupons = await load<Coupon[]>('/admin/pricing/coupons');
  if (coupons === FORBIDDEN) return <NoAccess title="Coupons" permission="pricing.read" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500">Discounts apply to signs and installation, never to delivery.</p>
        <CouponDialog coupon={null} />
      </div>

      {coupons.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No coupons"
          body="Create one for a festival or a partner campaign."
        />
      ) : (
        <Table head={['Code', 'Discount', 'Conditions', 'Runs', 'Used', 'Status', '']}>
          {coupons.map((coupon) => {
            const s = state(coupon);
            return (
              <tr key={coupon.id}>
                <Cell className="font-mono font-semibold">{coupon.code}</Cell>
                <Cell>
                  {coupon.type === 'PERCENT' ? `${coupon.value}% off` : `${formatINR(coupon.value)} off`}
                  {coupon.maxDiscountPaise !== null && (
                    <span className="block text-xs text-gray-500">
                      up to {formatINR(coupon.maxDiscountPaise)}
                    </span>
                  )}
                </Cell>
                <Cell className="text-xs text-gray-500">
                  {[
                    coupon.minOrderPaise !== null && `orders from ${formatINR(coupon.minOrderPaise)}`,
                    coupon.perUserLimit && `${coupon.perUserLimit} per customer`,
                    coupon.firstOrderOnly && 'first order only',
                  ]
                    .filter(Boolean)
                    .join(', ') || 'None'}
                </Cell>
                <Cell className="whitespace-nowrap text-gray-500">
                  {formatDate(coupon.startsAt)}
                  {coupon.endsAt ? ` to ${formatDate(coupon.endsAt)}` : ' onwards'}
                </Cell>
                <Cell className="tabular-nums">
                  {coupon.used}
                  {coupon.usageLimit && <span className="text-gray-400"> / {coupon.usageLimit}</span>}
                </Cell>
                <Cell>
                  <Badge tone={s.tone}>{s.label}</Badge>
                </Cell>
                <Cell>
                  <CouponDialog coupon={coupon} />
                </Cell>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}
