import type { Metadata } from 'next';
import { NoAccess } from '@/components/no-access';
import { NewZone, ZoneCard, type Zone } from '@/components/pricing/zone-editor';
import { FORBIDDEN, load } from '@/lib/load';

export const metadata: Metadata = { title: 'Delivery and installation' };

export default async function ZonesPage() {
  const zones = await load<Zone[]>('/admin/pricing/zones');
  if (zones === FORBIDDEN) return <NoAccess title="Delivery and installation" permission="pricing.read" />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Each pincode belongs to one zone, which sets its delivery charge, delivery time and installation rate.
        Pincodes not listed anywhere use the Rest of India zone.
      </p>
      {zones.map((zone) => (
        <ZoneCard key={zone.id} zone={zone} />
      ))}
      <NewZone />
    </div>
  );
}
