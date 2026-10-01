'use client';

import { formatINR } from '@neon-adda/shared';
import { useState } from 'react';
import { usePermission } from '@/components/can';
import { Dialog } from '@/components/ui/dialog';
import { Button, FormError, TextInput } from '@/components/ui/form';
import { PRODUCT_TYPE } from '@/lib/format';
import { useAction } from '@/lib/use-action';

export interface RateCard {
  id: string;
  versionNo: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  notes: string | null;
  publishedAt: string | null;
  backboards: { code: string; name: string; isActive: boolean }[];
  entries: {
    productType: string;
    backboardCode: string;
    ratePerSqftPaise: number;
    minBillableSqft: number;
  }[];
}

const PRODUCT_TYPES = ['TEXT_NEON', 'LOGO_NEON', 'READYMADE', 'BUSINESS'];

type Cell = { rate: string; min: string };
const key = (type: string, board: string) => `${type}:${board}`;

/** Edits the draft rate card as a grid of product types by backboards. Empty cells mean "by quotation". */
export function RateCardEditor({ draft, live }: { draft: RateCard; live: RateCard | null }) {
  const canPublish = usePermission('pricing.publish');
  const save = useAction();
  const publish = useAction();
  const discard = useAction();
  const [confirming, setConfirming] = useState(false);
  const [notes, setNotes] = useState(draft.notes ?? '');
  const [cells, setCells] = useState<Record<string, Cell>>(() =>
    Object.fromEntries(
      draft.entries.map((e) => [
        key(e.productType, e.backboardCode),
        { rate: String(e.ratePerSqftPaise / 100), min: String(e.minBillableSqft) },
      ]),
    ),
  );
  const [dirty, setDirty] = useState(false);

  const liveRate = (type: string, board: string) =>
    live?.entries.find((e) => e.productType === type && e.backboardCode === board)?.ratePerSqftPaise;

  const setCell = (k: string, patch: Partial<Cell>) => {
    setDirty(true);
    setCells((all) => ({ ...all, [k]: { rate: '', min: '1.5', ...all[k], ...patch } }));
  };

  async function handleSave() {
    const entries = Object.entries(cells)
      .filter(([, cell]) => cell.rate !== '')
      .map(([k, cell]) => {
        const [productType, backboardCode] = k.split(':');
        return {
          productType,
          backboardCode,
          ratePerSqftPaise: Math.round(Number(cell.rate) * 100),
          minBillableSqft: Number(cell.min || 1),
        };
      });
    if (
      await save.run(`/admin/pricing/rate-cards/${draft.id}/entries`, {
        method: 'PUT',
        json: { notes: notes.trim() || null, entries },
      })
    ) {
      setDirty(false);
    }
  }

  const changed = draft.entries.filter(
    (e) => liveRate(e.productType, e.backboardCode) !== e.ratePerSqftPaise,
  ).length;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs tracking-wide text-gray-500 uppercase">
              <th className="px-4 py-3 font-medium">₹ per sq ft · min sq ft</th>
              {draft.backboards.map((b) => (
                <th key={b.code} className="px-3 py-3 font-medium">
                  {b.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {PRODUCT_TYPES.map((type) => (
              <tr key={type}>
                <th scope="row" className="px-4 py-3 text-left font-medium text-gray-900">
                  {PRODUCT_TYPE[type]}
                </th>
                {draft.backboards.map((board) => {
                  const k = key(type, board.code);
                  const cell = cells[k];
                  const was = liveRate(type, board.code);
                  const now = cell?.rate ? Math.round(Number(cell.rate) * 100) : undefined;
                  return (
                    <td key={board.code} className="px-3 py-2">
                      <div className="flex gap-1">
                        <TextInput
                          type="number"
                          min={1}
                          step="1"
                          aria-label={`${PRODUCT_TYPE[type]} on ${board.name}, rupees per sq ft`}
                          placeholder="Quote"
                          value={cell?.rate ?? ''}
                          onChange={(e) => setCell(k, { rate: e.target.value })}
                          className={`w-24 tabular-nums ${now !== was ? 'border-amber-400 bg-amber-50' : ''}`}
                        />
                        <TextInput
                          type="number"
                          min={0.25}
                          step="0.25"
                          aria-label={`${PRODUCT_TYPE[type]} on ${board.name}, minimum sq ft`}
                          value={cell?.min ?? ''}
                          disabled={!cell?.rate}
                          onChange={(e) => setCell(k, { min: e.target.value })}
                          className="w-16 tabular-nums"
                        />
                      </div>
                      {now !== was && (
                        <span className="mt-0.5 block text-[11px] text-amber-700">
                          was {was === undefined ? 'by quotation' : formatINR(was)}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-64 flex-1 text-sm">
          <span className="font-medium text-gray-700">What changed</span>
          <TextInput
            value={notes}
            onChange={(e) => {
              setDirty(true);
              setNotes(e.target.value);
            }}
            placeholder="Festive season rates"
            className="mt-1.5"
          />
        </label>
        <Button onClick={handleSave} pending={save.pending} variant={dirty ? 'primary' : 'secondary'}>
          Save draft
        </Button>
        {canPublish && (
          <Button
            onClick={() => setConfirming(true)}
            disabled={dirty}
            title={dirty ? 'Save the draft first' : undefined}
          >
            Publish v{draft.versionNo}
          </Button>
        )}
        <Button
          variant="ghost"
          className="text-red-600"
          pending={discard.pending}
          onClick={() => discard.run(`/admin/pricing/rate-cards/${draft.id}`, { method: 'DELETE' })}
        >
          Discard draft
        </Button>
      </div>
      <FormError message={save.error ?? discard.error} />

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Publish rate card v${draft.versionNo}?`}
        description={`New prices apply to every cart and checkout from now on. ${changed} ${changed === 1 ? 'rate differs' : 'rates differ'} from the live card. Orders already placed keep their prices.`}
      >
        <FormError message={publish.error} />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            Not yet
          </Button>
          <Button
            pending={publish.pending}
            onClick={async () => {
              if (await publish.run(`/admin/pricing/rate-cards/${draft.id}/publish`)) setConfirming(false);
            }}
          >
            Publish now
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

export function StartDraft() {
  const canWrite = usePermission('pricing.write');
  const action = useAction();
  if (!canWrite) return null;
  return (
    <>
      <Button onClick={() => action.run('/admin/pricing/rate-cards')} pending={action.pending}>
        Change rates
      </Button>
      <FormError message={action.error} />
    </>
  );
}
