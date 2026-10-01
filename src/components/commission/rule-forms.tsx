'use client';

import { useState, type FormEvent } from 'react';
import { usePermission } from '@/components/can';
import { Dialog } from '@/components/ui/dialog';
import {
  Button,
  Checkbox,
  Field,
  FormError,
  MoneyInput,
  rupeesToPaise,
  Select,
  TextInput,
} from '@/components/ui/form';
import { fromLocalInput, toLocalInput } from '@/lib/format';
import { useAction } from '@/lib/use-action';

interface Option {
  id: string;
  name: string;
}

export function NewRule({
  tiers,
  franchises,
  categories,
}: {
  tiers: Option[];
  franchises: Option[];
  categories: Option[];
}) {
  const allowed = usePermission('commission.write');
  const action = useAction();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<'DEFAULT' | 'TIER' | 'FRANCHISE'>('TIER');
  const [type, setType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  if (!allowed) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const cap = String(form.get('cap') ?? '');
    const ok = await action.run('/admin/commission/rules', {
      json: {
        scope,
        tierId: scope === 'TIER' ? form.get('tierId') : null,
        franchiseId: scope === 'FRANCHISE' ? form.get('franchiseId') : null,
        categoryId: form.get('categoryId') || null,
        source: form.get('source'),
        type,
        value: type === 'PERCENT' ? Number(form.get('value')) : rupeesToPaise(form.get('value')),
        maxPerOrderPaise: cap ? rupeesToPaise(cap) : null,
        priority: Number(form.get('priority') || 0),
        effectiveFrom: fromLocalInput(String(form.get('effectiveFrom'))) ?? new Date().toISOString(),
      },
    });
    if (ok) setOpen(false);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>New rule</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="New commission rule"
        description="Rules cannot be edited once saved, so the rate behind every past commission stays on record. To change a rate, end the old rule and add a new one."
        wide
      >
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Applies to">
            <Select value={scope} onChange={(e) => setScope(e.target.value as typeof scope)}>
              <option value="DEFAULT">Every franchise</option>
              <option value="TIER">A tier</option>
              <option value="FRANCHISE">One franchise</option>
            </Select>
          </Field>
          {scope === 'TIER' && (
            <Field label="Tier" error={action.fieldErrors.tierId}>
              <Select name="tierId">
                {tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {scope === 'FRANCHISE' && (
            <Field label="Franchise" error={action.fieldErrors.franchiseId}>
              <Select name="franchiseId">
                {franchises.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Orders">
            <Select name="source" defaultValue="SELF_SOURCED">
              <option value="SELF_SOURCED">Customers they bring in</option>
              <option value="ASSIGNED">Orders assigned by pincode</option>
              <option value="ANY">Both</option>
            </Select>
          </Field>
          <Field label="Products">
            <Select name="categoryId" defaultValue="">
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Commission">
            <Select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              <option value="PERCENT">Percentage of the order before GST</option>
              <option value="FLAT">Fixed amount per order</option>
            </Select>
          </Field>
          <Field label={type === 'PERCENT' ? 'Percent' : 'Amount'} error={action.fieldErrors.value}>
            {type === 'PERCENT' ? (
              <TextInput
                name="value"
                type="number"
                min={0.5}
                max={50}
                step="0.5"
                required
                defaultValue={10}
              />
            ) : (
              <MoneyInput name="value" required />
            )}
          </Field>
          <Field label="Cap per order" optional>
            <MoneyInput name="cap" />
          </Field>
          <Field label="Starts" error={action.fieldErrors.effectiveFrom}>
            <TextInput
              name="effectiveFrom"
              type="datetime-local"
              defaultValue={toLocalInput(new Date().toISOString())}
              required
            />
          </Field>
          <Field label="Priority" hint="Breaks ties between equally specific rules. Usually 0.">
            <TextInput name="priority" type="number" min={-50} max={50} defaultValue={0} />
          </Field>
          <div className="sm:col-span-2">
            <FormError message={action.error} />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" pending={action.pending}>
              Save rule
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function EndRule({ ruleId }: { ruleId: string }) {
  const allowed = usePermission('commission.write');
  const action = useAction();
  if (!allowed) return null;
  return (
    <Button
      size="sm"
      variant="ghost"
      pending={action.pending}
      onClick={() => action.run(`/admin/commission/rules/${ruleId}/end`)}
    >
      End
    </Button>
  );
}

export function CommissionSettingsForm({
  settings,
}: {
  settings: { eligibilityDays: number; includeInstallation: boolean; tdsPct: number };
}) {
  const allowed = usePermission('commission.write');
  const action = useAction();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void action.run('/admin/commission/settings', {
      method: 'PUT',
      json: {
        eligibilityDays: Number(form.get('eligibilityDays')),
        includeInstallation: form.get('includeInstallation') === 'on',
        tdsPct: Number(form.get('tdsPct')),
      },
    });
  }

  return (
    <form onSubmit={submit}>
      <fieldset disabled={!allowed} className="grid gap-4 sm:grid-cols-3">
        <Field label="Payable after (days)" hint="Counted from completion; covers the return window.">
          <TextInput
            name="eligibilityDays"
            type="number"
            min={0}
            max={90}
            defaultValue={settings.eligibilityDays}
          />
        </Field>
        <Field label="TDS deducted (%)">
          <TextInput name="tdsPct" type="number" min={0} max={20} step="0.1" defaultValue={settings.tdsPct} />
        </Field>
        <div className="flex items-end pb-2">
          <Checkbox
            name="includeInstallation"
            label="Pay commission on installation"
            defaultChecked={settings.includeInstallation}
          />
        </div>
      </fieldset>
      {allowed && (
        <div className="mt-4 flex items-center gap-3">
          <Button type="submit" variant="secondary" pending={action.pending}>
            Save
          </Button>
          <FormError message={action.error} />
        </div>
      )}
    </form>
  );
}
