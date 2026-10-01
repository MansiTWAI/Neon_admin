'use client';

import { GST_STATES } from '@neon-adda/shared';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { usePermission } from '@/components/can';
import { TemporaryPasswordDialog } from '@/components/temporary-password';
import { Button, Field, FormError, Select, TextArea, TextInput } from '@/components/ui/form';
import { useAction } from '@/lib/use-action';

export interface FranchiseValue {
  id: string;
  code: string;
  name: string;
  city: string;
  stateCode: string;
  status: 'PENDING_KYC' | 'ACTIVE' | 'SUSPENDED';
  tier: { id: string; name: string } | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  address: string | null;
  maxQuoteDiscountPct: number;
}

const STATES = Object.entries(GST_STATES).sort((a, b) => a[1].localeCompare(b[1]));

/** Creates a franchise with its owner's login, or edits one. */
export function FranchiseForm({
  franchise,
  tiers,
}: {
  franchise: FranchiseValue | null;
  tiers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const canWrite = usePermission('franchises.write');
  const action = useAction();
  const [created, setCreated] = useState<{ id: string; email: string; password: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? '').trim();
    const body = {
      code: value('code'),
      name: value('name'),
      city: value('city'),
      stateCode: value('stateCode'),
      tierId: value('tierId') || null,
      status: value('status'),
      phone: value('phone'),
      email: value('email'),
      gstin: value('gstin'),
      address: value('address'),
      maxQuoteDiscountPct: Number(value('maxQuoteDiscountPct') || 5),
    };

    if (franchise) {
      await action.run(`/admin/franchises/${franchise.id}`, { method: 'PUT', json: body });
      return;
    }
    const result = await action.run<{ id: string; ownerEmail: string; temporaryPassword: string }>(
      '/admin/franchises',
      {
        json: { ...body, owner: { name: value('ownerName'), email: value('ownerEmail') } },
      },
    );
    if (result) setCreated({ id: result.id, email: result.ownerEmail, password: result.temporaryPassword });
  }

  const error = (field: string) => action.fieldErrors[field];

  return (
    <form onSubmit={submit}>
      <fieldset disabled={!canWrite} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Franchise name" error={error('name')} className="sm:col-span-2">
          <TextInput
            name="name"
            defaultValue={franchise?.name}
            required
            placeholder="Neon Adda Pune, FC Road"
          />
        </Field>
        <Field label="Code" hint="Short and permanent, e.g. PUNEFC." error={error('code')}>
          <TextInput
            name="code"
            defaultValue={franchise?.code}
            required
            maxLength={12}
            className="font-mono uppercase"
          />
        </Field>
        <Field label="City" error={error('city')}>
          <TextInput name="city" defaultValue={franchise?.city} required />
        </Field>
        <Field label="State" error={error('stateCode')}>
          <Select name="stateCode" defaultValue={franchise?.stateCode ?? '27'}>
            {STATES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tier" hint="Tiers can have their own commission rates.">
          <Select name="tierId" defaultValue={franchise?.tier?.id ?? ''}>
            <option value="">No tier</option>
            {tiers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status" hint="Only active partners can sign in and receive orders.">
          <Select name="status" defaultValue={franchise?.status ?? 'PENDING_KYC'}>
            <option value="PENDING_KYC">Awaiting KYC</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </Select>
        </Field>
        <Field label="Phone" optional error={error('phone')}>
          <TextInput name="phone" type="tel" defaultValue={franchise?.phone?.replace(/^\+91/, '') ?? ''} />
        </Field>
        <Field label="Email" optional error={error('email')}>
          <TextInput name="email" type="email" defaultValue={franchise?.email ?? ''} />
        </Field>
        <Field label="GSTIN" optional error={error('gstin')}>
          <TextInput
            name="gstin"
            defaultValue={franchise?.gstin ?? ''}
            maxLength={15}
            className="uppercase"
          />
        </Field>
        <Field label="Largest discount on quotations (%)" error={error('maxQuoteDiscountPct')}>
          <TextInput
            name="maxQuoteDiscountPct"
            type="number"
            min={0}
            max={50}
            step="0.5"
            defaultValue={franchise?.maxQuoteDiscountPct ?? 5}
          />
        </Field>
        <Field label="Studio address" optional className="sm:col-span-2 lg:col-span-3">
          <TextArea name="address" defaultValue={franchise?.address ?? ''} rows={2} maxLength={300} />
        </Field>

        {!franchise && (
          <>
            <p className="pt-2 text-sm font-semibold text-gray-900 sm:col-span-2 lg:col-span-3">
              Owner’s sign-in
            </p>
            <Field label="Owner’s name" error={error('owner.name')}>
              <TextInput name="ownerName" required />
            </Field>
            <Field
              label="Owner’s email"
              hint="They sign in to the partner portal with this."
              error={error('owner.email')}
            >
              <TextInput name="ownerEmail" type="email" required />
            </Field>
          </>
        )}
      </fieldset>

      {canWrite && (
        <div className="mt-5 flex items-center gap-3">
          <Button type="submit" pending={action.pending}>
            {franchise ? 'Save changes' : 'Create franchise'}
          </Button>
          <FormError message={action.error} />
        </div>
      )}

      <TemporaryPasswordDialog
        email={created?.email ?? ''}
        password={created?.password ?? null}
        onClose={() => created && router.replace(`/franchises/${created.id}`)}
      />
    </form>
  );
}
