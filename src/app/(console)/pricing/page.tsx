import { formatINR } from '@neon-adda/shared';
import type { Metadata } from 'next';
import { NoAccess } from '@/components/no-access';
import { RateCardEditor, StartDraft, type RateCard } from '@/components/pricing/rate-card-editor';
import { Badge, Card } from '@/components/ui/data';
import { formatDateTime, PRODUCT_TYPE } from '@/lib/format';
import { FORBIDDEN, load } from '@/lib/load';

export const metadata: Metadata = { title: 'Rate card' };

interface Version {
  id: string;
  versionNo: number;
  status: RateCard['status'];
  notes: string | null;
  effectiveFrom: string;
  publishedAt: string | null;
  entries: number;
}

export default async function RateCardPage() {
  const versions = await load<Version[]>('/admin/pricing/rate-cards');
  if (versions === FORBIDDEN) return <NoAccess title="Rate card" permission="pricing.read" />;

  const draftVersion = versions.find((v) => v.status === 'DRAFT');
  const liveVersion = versions.find((v) => v.status === 'PUBLISHED');
  const [draft, live] = await Promise.all([
    draftVersion ? load<RateCard>(`/admin/pricing/rate-cards/${draftVersion.id}`) : null,
    liveVersion ? load<RateCard>(`/admin/pricing/rate-cards/${liveVersion.id}`) : null,
  ]);
  if (draft === FORBIDDEN || live === FORBIDDEN)
    return <NoAccess title="Rate card" permission="pricing.read" />;

  return (
    <div className="space-y-6">
      {draft ? (
        <Card title={`Draft v${draft.versionNo}`} action={<Badge tone="amber">Not live yet</Badge>}>
          <RateCardEditor draft={draft} live={live} />
        </Card>
      ) : (
        live && (
          <Card
            title={`Live rates, v${live.versionNo}`}
            action={
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">Published {formatDateTime(live.publishedAt)}</span>
                <StartDraft />
              </div>
            }
          >
            <LiveRates card={live} />
          </Card>
        )
      )}

      <Card title="History">
        <ul className="divide-y divide-gray-100 text-sm">
          {versions.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-3 py-2.5">
              <span className="w-10 font-semibold">v{v.versionNo}</span>
              <Badge tone={v.status === 'PUBLISHED' ? 'green' : v.status === 'DRAFT' ? 'amber' : 'gray'}>
                {v.status === 'PUBLISHED' ? 'Live' : v.status.toLowerCase()}
              </Badge>
              <span className="flex-1 text-gray-600">
                {v.notes ?? <span className="text-gray-300">No notes</span>}
              </span>
              <span className="text-gray-400">
                {v.publishedAt ? formatDateTime(v.publishedAt) : 'Not published'}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function LiveRates({ card }: { card: RateCard }) {
  const types = [...new Set(card.entries.map((e) => e.productType))];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="text-left text-xs tracking-wide text-gray-500 uppercase">
            <th className="pb-2 font-medium">Per sq ft, before GST</th>
            {card.backboards.map((b) => (
              <th key={b.code} className="pb-2 text-right font-medium">
                {b.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {types.map((type) => (
            <tr key={type}>
              <th scope="row" className="py-3 text-left font-medium">
                {PRODUCT_TYPE[type]}
              </th>
              {card.backboards.map((b) => {
                const entry = card.entries.find((e) => e.productType === type && e.backboardCode === b.code);
                return (
                  <td key={b.code} className="py-3 text-right tabular-nums">
                    {entry ? (
                      <>
                        <span className="font-semibold">{formatINR(entry.ratePerSqftPaise)}</span>
                        <span className="block text-xs text-gray-400">min {entry.minBillableSqft} sq ft</span>
                      </>
                    ) : (
                      <span className="text-gray-300">Quote</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
