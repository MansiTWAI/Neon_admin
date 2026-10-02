'use client';

import { GST_STATES } from '@neon-adda/shared';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { usePermission } from '@/components/can';
import {
  Button,
  Checkbox,
  Field,
  FormError,
  MoneyInput,
  paiseToRupees,
  rupeesToPaise,
  Select,
  TextInput,
} from '@/components/ui/form';
import { useAction } from '@/lib/use-action';

export interface PricingRulesValue {
  multiColorSurchargePct: number;
  gstRatePct: number;
  hsnCode: string;
  companyStateCode: string;
  minOrderValuePaise: number;
  maxQty: number;
  advance: { thresholdPaise: number; pct: number };
}

export interface AddonValue {
  code: string;
  name: string;
  pricingType: 'FLAT' | 'PER_SQFT' | 'PERCENT';
  value: number;
  isActive: boolean;
}

export function RulesForm({ rules }: { rules: PricingRulesValue }) {
  const canPublish = usePermission('pricing.publish');
  const action = useAction();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const number = (key: string) => Number(form.get(key));
    void action.run('/admin/pricing/rules', {
      method: 'PUT',
      json: {
        multiColorSurchargePct: number('multiColorSurchargePct'),
        gstRatePct: number('gstRatePct'),
        hsnCode: form.get('hsnCode'),
        companyStateCode: form.get('companyStateCode'),
        minOrderValuePaise: rupeesToPaise(form.get('minOrderValue')),
        maxQty: number('maxQty'),
        advance: { thresholdPaise: rupeesToPaise(form.get('advanceThreshold')), pct: number('advancePct') },
      },
    });
  }

  const error = (field: string) => action.fieldErrors[field];

  return (
    <form onSubmit={submit}>
      <fieldset disabled={!canPublish} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label="Multi-colour surcharge (%)"
          hint="Added when lines use different colours."
          error={error('multiColorSurchargePct')}
        >
          <TextInput
            name="multiColorSurchargePct"
            type="number"
            min={0}
            max={100}
            step="0.5"
            defaultValue={rules.multiColorSurchargePct}
          />
        </Field>
        <Field label="GST (%)" error={error('gstRatePct')}>
          <TextInput
            name="gstRatePct"
            type="number"
            min={0}
            max={28}
            step="0.5"
            defaultValue={rules.gstRatePct}
          />
        </Field>
        <Field label="HSN code" error={error('hsnCode')}>
          <TextInput name="hsnCode" defaultValue={rules.hsnCode} inputMode="numeric" />
        </Field>
        <Field label="We invoice from" hint="Sales within this state get CGST and SGST; elsewhere IGST.">
          <Select name="companyStateCode" defaultValue={rules.companyStateCode}>
            {Object.entries(GST_STATES).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Minimum order, before GST" error={error('minOrderValuePaise')}>
          <MoneyInput name="minOrderValue" defaultValue={paiseToRupees(rules.minOrderValuePaise)} />
        </Field>
        <Field
          label="Most signs in one online order"
          hint="Larger orders go to a bulk quotation."
          error={error('maxQty')}
        >
          <TextInput name="maxQty" type="number" min={1} max={1000} defaultValue={rules.maxQty} />
        </Field>
        <Field
          label="Part payment from"
          hint="Orders at or above this total can pay an advance."
          error={error('advance.thresholdPaise')}
        >
          <MoneyInput name="advanceThreshold" defaultValue={paiseToRupees(rules.advance.thresholdPaise)} />
        </Field>
        <Field label="Advance (%)" error={error('advance.pct')}>
          <TextInput name="advancePct" type="number" min={1} max={100} defaultValue={rules.advance.pct} />
        </Field>
      </fieldset>
      <div className="mt-4 flex items-center gap-3">
        {canPublish ? (
          <Button type="submit" pending={action.pending}>
            Save rules
          </Button>
        ) : (
          <p className="text-sm text-gray-500">Changing these needs the pricing.publish permission.</p>
        )}
        <FormError message={action.error} />
      </div>
    </form>
  );
}

const TYPE_LABEL = { FLAT: 'Flat ₹', PER_SQFT: '₹ per sq ft', PERCENT: '% of sign price' };

export function AddonsEditor({ addons: initial }: { addons: AddonValue[] }) {
  const canPublish = usePermission('pricing.publish');
  const action = useAction();
  const [addons, setAddons] = useState(() =>
    initial.map((a) => ({
      ...a,
      key: a.code,
      amount: a.pricingType === 'PERCENT' ? String(a.value) : String(a.value / 100),
    })),
  );

  const update = (i: number, patch: Partial<(typeof addons)[number]>) =>
    setAddons((all) => all.map((a, j) => (j === i ? { ...a, ...patch } : a)));

  function save() {
    void action.run('/admin/pricing/addons', {
      method: 'PUT',
      json: {
        addons: addons.map(({ code, name, pricingType, amount, isActive }) => ({
          code,
          name,
          pricingType,
          value: pricingType === 'PERCENT' ? Number(amount) : Math.round(Number(amount) * 100),
          isActive,
        })),
      },
    });
  }

  return (
    <div className="space-y-3">
      <fieldset disabled={!canPublish} className="space-y-2">
        {addons.map((addon, i) => (
          <div
            key={addon.key}
            className="grid grid-cols-1 items-center gap-2 lg:grid-cols-[140px_minmax(0,1fr)_150px_110px_auto]"
          >
            <TextInput
              aria-label="Code"
              value={addon.code}
              onChange={(e) => update(i, { code: e.target.value.toUpperCase() })}
              disabled={initial.some((a) => a.code === addon.key)}
              className="font-mono text-xs"
            />
            <TextInput
              aria-label="Name"
              value={addon.name}
              onChange={(e) => update(i, { name: e.target.value })}
            />
            <Select
              aria-label="Charged as"
              value={addon.pricingType}
              onChange={(e) => update(i, { pricingType: e.target.value as AddonValue['pricingType'] })}
            >
              {Object.entries(TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <TextInput
              aria-label="Amount"
              type="number"
              min={0}
              step="0.01"
              value={addon.amount}
              onChange={(e) => update(i, { amount: e.target.value })}
            />
            <Checkbox
              label="On sale"
              checked={addon.isActive}
              onChange={(e) => update(i, { isActive: e.target.checked })}
            />
          </div>
        ))}
      </fieldset>
      {canPublish && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setAddons((all) => [
                ...all,
                {
                  key: crypto.randomUUID(),
                  code: '',
                  name: '',
                  pricingType: 'FLAT',
                  value: 0,
                  amount: '',
                  isActive: true,
                },
              ])
            }
          >
            <Plus className="size-4" /> Add an extra
          </Button>
          <Button onClick={save} pending={action.pending} className="ml-auto">
            Save extras
          </Button>
        </div>
      )}
      <FormError message={action.error} />
    </div>
  );
}
