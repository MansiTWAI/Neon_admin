'use client';

import { formatINR } from '@neon-adda/shared';
import { useState, type FormEvent } from 'react';
import { usePermission } from '@/components/can';
import { Badge } from '@/components/ui/data';
import {
  Button,
  Checkbox,
  Field,
  FormError,
  MoneyInput,
  paiseToRupees,
  rupeesToPaise,
  Select,
  TextArea,
  TextInput,
} from '@/components/ui/form';
import { useAction } from '@/lib/use-action';

/** The zone used for pincodes that no other zone lists. */
const FALLBACK_ZONE = 'REST_OF_INDIA';

export interface Zone {
  id: string;
  code: string;
  name: string;
  deliveryChargePaise: number;
  freeDeliveryAbovePaise: number | null;
  installAvailable: boolean;
  installType: 'FLAT' | 'PER_SQFT';
  installValuePaise: number;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  isActive: boolean;
  pincodes: string[];
}

export function ZoneCard({ zone }: { zone: Zone }) {
  const canWrite = usePermission('pricing.write');
  const [mode, setMode] = useState<'view' | 'edit' | 'pincodes'>('view');

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">
            {zone.name} <span className="font-mono text-xs font-normal text-gray-400">{zone.code}</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {zone.deliveryChargePaise ? `Delivery ${formatINR(zone.deliveryChargePaise)}` : 'Free delivery'}
            {zone.freeDeliveryAbovePaise !== null &&
              `, free above ${formatINR(zone.freeDeliveryAbovePaise)}`}{' '}
            · {zone.deliveryDaysMin}–{zone.deliveryDaysMax} days ·{' '}
            {zone.installAvailable
              ? `installation ${formatINR(zone.installValuePaise)}${zone.installType === 'PER_SQFT' ? ' per sq ft' : ' flat'}`
              : 'no installation'}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {zone.pincodes.length
              ? `${zone.pincodes.length} pincodes: ${zone.pincodes.slice(0, 8).join(', ')}${zone.pincodes.length > 8 ? '…' : ''}`
              : zone.code === FALLBACK_ZONE
                ? 'Every pincode not in another zone'
                : 'No pincodes yet'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!zone.isActive && <Badge>Off</Badge>}
          {canWrite && mode === 'view' && (
            <>
              <Button size="sm" variant="ghost" onClick={() => setMode('pincodes')}>
                Pincodes
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setMode('edit')}>
                Edit
              </Button>
            </>
          )}
        </div>
      </div>
      {mode === 'edit' && <ZoneForm zone={zone} onDone={() => setMode('view')} />}
      {mode === 'pincodes' && <PincodeForm zone={zone} onDone={() => setMode('view')} />}
    </div>
  );
}

export function ZoneForm({ zone, onDone }: { zone: Zone | null; onDone: () => void }) {
  const action = useAction();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const freeAbove = String(form.get('freeAbove') ?? '');
    const ok = await action.run(zone ? `/admin/pricing/zones/${zone.id}` : '/admin/pricing/zones', {
      method: zone ? 'PUT' : 'POST',
      json: {
        code: String(form.get('code')).toUpperCase(),
        name: form.get('name'),
        deliveryChargePaise: rupeesToPaise(form.get('deliveryCharge')),
        freeDeliveryAbovePaise: freeAbove ? rupeesToPaise(freeAbove) : null,
        installAvailable: form.get('installAvailable') === 'on',
        installType: form.get('installType'),
        installValuePaise: rupeesToPaise(form.get('installValue')),
        deliveryDaysMin: Number(form.get('daysMin')),
        deliveryDaysMax: Number(form.get('daysMax')),
        isActive: form.get('isActive') === 'on',
      },
    });
    if (ok) onDone();
  }

  const error = (field: string) => action.fieldErrors[field];

  return (
    <form
      onSubmit={submit}
      className="mt-4 grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <Field label="Name" error={error('name')}>
        <TextInput name="name" defaultValue={zone?.name} required />
      </Field>
      <Field label="Code" error={error('code')}>
        <TextInput
          name="code"
          defaultValue={zone?.code}
          required
          disabled={Boolean(zone)}
          className="font-mono uppercase"
        />
      </Field>
      <Field label="Delivery charge" error={error('deliveryChargePaise')}>
        <MoneyInput name="deliveryCharge" defaultValue={paiseToRupees(zone?.deliveryChargePaise ?? 0)} />
      </Field>
      <Field label="Free delivery above" optional error={error('freeDeliveryAbovePaise')}>
        <MoneyInput name="freeAbove" defaultValue={paiseToRupees(zone?.freeDeliveryAbovePaise)} />
      </Field>
      <Field label="Delivery days, from" error={error('deliveryDaysMin')}>
        <TextInput name="daysMin" type="number" min={1} defaultValue={zone?.deliveryDaysMin ?? 5} />
      </Field>
      <Field label="to" error={error('deliveryDaysMax')}>
        <TextInput name="daysMax" type="number" min={1} defaultValue={zone?.deliveryDaysMax ?? 7} />
      </Field>
      <Field label="Installation charged">
        <Select name="installType" defaultValue={zone?.installType ?? 'PER_SQFT'}>
          <option value="PER_SQFT">Per sq ft</option>
          <option value="FLAT">Flat per order</option>
        </Select>
      </Field>
      <Field label="Installation rate" error={error('installValuePaise')}>
        <MoneyInput name="installValue" defaultValue={paiseToRupees(zone?.installValuePaise ?? 0)} />
      </Field>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Checkbox
          name="installAvailable"
          label="We install in this zone"
          defaultChecked={zone?.installAvailable}
        />
        <Checkbox name="isActive" label="Zone is active" defaultChecked={zone?.isActive ?? true} />
      </div>
      <div className="flex items-end gap-2 sm:col-span-2 sm:justify-end">
        <FormError message={action.error} />
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" pending={action.pending}>
          Save zone
        </Button>
      </div>
    </form>
  );
}

const pincodesIn = (text: string) => [...new Set(text.match(/\b[1-9]\d{5}\b/g) ?? [])];

function PincodeForm({ zone, onDone }: { zone: Zone; onDone: () => void }) {
  const action = useAction();
  const [text, setText] = useState(zone.pincodes.join(', '));
  const wanted = pincodesIn(text);
  const add = wanted.filter((p) => !zone.pincodes.includes(p));
  const remove = zone.pincodes.filter((p) => !wanted.includes(p));

  async function save() {
    if (
      await action.run(`/admin/pricing/zones/${zone.id}/pincodes`, { method: 'PUT', json: { add, remove } })
    )
      onDone();
  }

  return (
    <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
      <Field
        label="Pincodes in this zone"
        hint="Paste a list in any format. Pincodes added here move out of any other zone."
      >
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="font-mono text-xs"
        />
      </Field>
      <p className="text-xs text-gray-500">
        {add.length} to add, {remove.length} to remove
      </p>
      <FormError message={action.error} />
      <div className="flex gap-2">
        <Button onClick={save} pending={action.pending} disabled={!add.length && !remove.length}>
          Save pincodes
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function NewZone() {
  const canWrite = usePermission('pricing.write');
  const [open, setOpen] = useState(false);
  if (!canWrite) return null;
  return open ? (
    <div className="rounded-2xl border border-brand/30 bg-white p-5">
      <p className="font-semibold">New zone</p>
      <ZoneForm zone={null} onDone={() => setOpen(false)} />
    </div>
  ) : (
    <Button variant="secondary" onClick={() => setOpen(true)}>
      Add a zone
    </Button>
  );
}
