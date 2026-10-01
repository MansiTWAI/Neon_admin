import type { Metadata } from 'next';
import { NoAccess } from '@/components/no-access';
import {
  AddonsEditor,
  RulesForm,
  type AddonValue,
  type PricingRulesValue,
} from '@/components/pricing/rules-form';
import { Card } from '@/components/ui/data';
import { FORBIDDEN, load } from '@/lib/load';

export const metadata: Metadata = { title: 'Pricing rules' };

export default async function RulesPage() {
  const data = await load<{ rules: PricingRulesValue | null; addons: AddonValue[] }>('/admin/pricing/rules');
  if (data === FORBIDDEN) return <NoAccess title="Pricing rules" permission="pricing.read" />;

  return (
    <div className="space-y-6">
      <Card title="Rules">
        <p className="mb-4 text-sm text-gray-500">
          These apply to every price straight away, unlike the rate card, which is drafted and published.
        </p>
        {data.rules && <RulesForm rules={data.rules} />}
      </Card>
      <Card title="Extras">
        <p className="mb-4 text-sm text-gray-500">
          Options customers can add in the studio. Extras taken off sale stay on past orders.
        </p>
        <AddonsEditor addons={data.addons} />
      </Card>
    </div>
  );
}
