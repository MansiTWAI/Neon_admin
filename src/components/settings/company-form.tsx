'use client';

import { GST_STATES } from '@neon-adda/shared';
import type { FormEvent } from 'react';
import { usePermission } from '@/components/can';
import { Button, Field, FormError, Select, TextArea, TextInput } from '@/components/ui/form';
import { useAction } from '@/lib/use-action';

export interface Company {
  legalName: string;
  tradeName?: string;
  gstin?: string | null;
  address?: string;
  stateCode: string;
  email?: string;
  phone?: string;
}

const STATES = Object.entries(GST_STATES).sort((a, b) => a[1].localeCompare(b[1]));

/** The seller details printed on every tax invoice. */
export function CompanyForm({ company }: { company: Company | null }) {
  const allowed = usePermission('settings.write');
  const action = useAction();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    void action.run('/admin/settings/company', { method: 'PUT', json: form });
  }

  const error = (field: string) => action.fieldErrors[field];

  return (
    <form onSubmit={submit}>
      <fieldset disabled={!allowed} className="grid gap-4 sm:grid-cols-2">
        <Field label="Legal name" error={error('legalName')}>
          <TextInput name="legalName" defaultValue={company?.legalName} required />
        </Field>
        <Field label="Trade name" optional>
          <TextInput name="tradeName" defaultValue={company?.tradeName ?? ''} />
        </Field>
        <Field label="GSTIN" error={error('gstin')}>
          <TextInput name="gstin" defaultValue={company?.gstin ?? ''} maxLength={15} className="uppercase" />
        </Field>
        <Field label="State of registration" error={error('stateCode')}>
          <Select name="stateCode" defaultValue={company?.stateCode ?? '27'}>
            {STATES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Registered address" error={error('address')} className="sm:col-span-2">
          <TextArea name="address" defaultValue={company?.address ?? ''} rows={2} required />
        </Field>
        <Field label="Accounts email" error={error('email')}>
          <TextInput name="email" type="email" defaultValue={company?.email ?? ''} required />
        </Field>
        <Field label="Phone" error={error('phone')}>
          <TextInput name="phone" defaultValue={company?.phone ?? ''} required />
        </Field>
      </fieldset>
      {allowed && (
        <div className="mt-4 flex items-center gap-3">
          <Button type="submit" pending={action.pending}>
            Save company details
          </Button>
          <FormError message={action.error} />
        </div>
      )}
    </form>
  );
}
