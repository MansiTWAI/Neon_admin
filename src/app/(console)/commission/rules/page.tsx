import { formatINR } from '@neon-adda/shared';
import type { Metadata } from 'next';
import { CommissionSettingsForm, EndRule, NewRule } from '@/components/commission/rule-forms';
import { NoAccess } from '@/components/no-access';
import { Badge, Card, Cell, Table } from '@/components/ui/data';
import { formatDate } from '@/lib/format';
import { FORBIDDEN, load } from '@/lib/load';

export const metadata: Metadata = { title: 'Commission rules' };

interface Rule {
  id: string;
  scope: 'DEFAULT' | 'TIER' | 'FRANCHISE';
  tier: string | null;
  franchise: string | null;
  category: string | null;
  source: 'SELF_SOURCED' | 'ASSIGNED' | 'ANY';
  type: 'PERCENT' | 'FLAT';
  value: number;
  maxPerOrderPaise: number | null;
  priority: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  live: boolean;
}

const SOURCE = { SELF_SOURCED: 'Their customers', ASSIGNED: 'Assigned by pincode', ANY: 'All orders' };

export default async function RulesPage() {
  const [rules, settings, tiers, franchises, categories] = await Promise.all([
    load<Rule[]>('/admin/commission/rules'),
    load<{ eligibilityDays: number; includeInstallation: boolean; tdsPct: number }>(
      '/admin/commission/settings',
    ),
    load<{ id: string; name: string }[]>('/admin/franchises/tiers'),
    load<{ id: string; name: string }[]>('/admin/franchises'),
    load<{ id: string; name: string }[]>('/admin/catalog/categories'),
  ]);
  if (rules === FORBIDDEN || settings === FORBIDDEN)
    return <NoAccess title="Commission rules" permission="commission.read" />;
  const list = <T,>(value: T[] | typeof FORBIDDEN) => (value === FORBIDDEN ? [] : value);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-gray-500">
          When several rules fit an order, the most specific wins: one franchise over a tier over every
          franchise, then a product category, then the order source.
        </p>
        <NewRule tiers={list(tiers)} franchises={list(franchises)} categories={list(categories)} />
      </div>

      <Table head={['Applies to', 'Orders', 'Products', 'Rate', 'Runs', '']}>
        {rules.map((rule) => (
          <tr key={rule.id} className={rule.live ? '' : 'text-gray-400'}>
            <Cell className="font-medium">
              {rule.scope === 'FRANCHISE'
                ? rule.franchise
                : rule.scope === 'TIER'
                  ? `${rule.tier} tier`
                  : 'Every franchise'}
              {!rule.live && (
                <span className="ml-2">
                  <Badge>Ended</Badge>
                </span>
              )}
            </Cell>
            <Cell>{SOURCE[rule.source]}</Cell>
            <Cell>{rule.category ?? 'All'}</Cell>
            <Cell className="font-semibold tabular-nums">
              {rule.type === 'PERCENT' ? `${rule.value}%` : `${formatINR(rule.value)} per order`}
              {rule.maxPerOrderPaise !== null && (
                <span className="block text-xs font-normal text-gray-500">
                  up to {formatINR(rule.maxPerOrderPaise)}
                </span>
              )}
            </Cell>
            <Cell className="whitespace-nowrap text-gray-500">
              {formatDate(rule.effectiveFrom)}
              {rule.effectiveTo ? ` to ${formatDate(rule.effectiveTo)}` : ' onwards'}
            </Cell>
            <Cell>{rule.live && <EndRule ruleId={rule.id} />}</Cell>
          </tr>
        ))}
      </Table>

      <Card title="Payment terms">
        <CommissionSettingsForm settings={settings} />
      </Card>
    </div>
  );
}
