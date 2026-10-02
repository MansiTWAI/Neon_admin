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
  paiseToRupees,
  rupeesToPaise,
  Select,
  TextInput,
} from '@/components/ui/form';
import { fromLocalInput, toLocalInput } from '@/lib/format';
import { useAction } from '@/lib/use-action';

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENT' | 'FLAT';
  value: number;
  maxDiscountPaise: number | null;
  minOrderPaise: number | null;
  startsAt: string;
  endsAt: string | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  firstOrderOnly: boolean;
  isActive: boolean;
  used: number;
}

export function CouponDialog({ coupon }: { coupon: Coupon | null }) {
  const canWrite = usePermission('pricing.write');
  const action = useAction();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(coupon?.type ?? 'PERCENT');
  if (!canWrite) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const optionalInt = (key: string) => (form.get(key) ? Number(form.get(key)) : null);
    const optionalMoney = (key: string) => (form.get(key) ? rupeesToPaise(form.get(key)) : null);
    const ok = await action.run(coupon ? `/admin/pricing/coupons/${coupon.id}` : '/admin/pricing/coupons', {
      method: coupon ? 'PUT' : 'POST',
      json: {
        code: form.get('code'),
        type,
        value: type === 'PERCENT' ? Number(form.get('value')) : rupeesToPaise(form.get('value')),
        maxDiscountPaise: type === 'PERCENT' ? optionalMoney('maxDiscount') : null,
        minOrderPaise: optionalMoney('minOrder'),
        startsAt: fromLocalInput(String(form.get('startsAt'))) ?? new Date().toISOString(),
        endsAt: fromLocalInput(String(form.get('endsAt') ?? '')),
        usageLimit: optionalInt('usageLimit'),
        perUserLimit: optionalInt('perUserLimit'),
        firstOrderOnly: form.get('firstOrderOnly') === 'on',
        isActive: form.get('isActive') === 'on',
      },
    });
    if (ok) setOpen(false);
  }

  const error = (field: string) => action.fieldErrors[field];

  return (
    <>
      <Button
        size={coupon ? 'sm' : 'md'}
        variant={coupon ? 'ghost' : 'primary'}
        onClick={() => setOpen(true)}
      >
        {coupon ? 'Edit' : 'New coupon'}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={coupon ? `Edit ${coupon.code}` : 'New coupon'}
        wide
      >
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Code" error={error('code')}>
            <TextInput
              name="code"
              defaultValue={coupon?.code}
              required
              className="font-mono uppercase"
              placeholder="DIWALI25"
            />
          </Field>
          <Field label="Discount">
            <Select value={type} onChange={(e) => setType(e.target.value as Coupon['type'])}>
              <option value="PERCENT">Percentage off</option>
              <option value="FLAT">Fixed amount off</option>
            </Select>
          </Field>
          <Field label={type === 'PERCENT' ? 'Percent off' : 'Amount off'} error={error('value')}>
            {type === 'PERCENT' ? (
              <TextInput
                name="value"
                type="number"
                min={1}
                max={90}
                defaultValue={coupon?.type === 'PERCENT' ? coupon.value : 10}
                required
              />
            ) : (
              <MoneyInput
                name="value"
                defaultValue={coupon?.type === 'FLAT' ? paiseToRupees(coupon.value) : ''}
                required
              />
            )}
          </Field>
          {type === 'PERCENT' && (
            <Field label="Capped at" optional error={error('maxDiscountPaise')}>
              <MoneyInput name="maxDiscount" defaultValue={paiseToRupees(coupon?.maxDiscountPaise)} />
            </Field>
          )}
          <Field
            label="Minimum order"
            optional
            hint="Signs and installation, before GST."
            error={error('minOrderPaise')}
          >
            <MoneyInput name="minOrder" defaultValue={paiseToRupees(coupon?.minOrderPaise)} />
          </Field>
          <Field label="Starts" error={error('startsAt')}>
            <TextInput
              name="startsAt"
              type="datetime-local"
              defaultValue={toLocalInput(coupon?.startsAt ?? new Date().toISOString())}
              required
            />
          </Field>
          <Field label="Ends" optional error={error('endsAt')}>
            <TextInput name="endsAt" type="datetime-local" defaultValue={toLocalInput(coupon?.endsAt)} />
          </Field>
          <Field label="Total uses" optional error={error('usageLimit')}>
            <TextInput name="usageLimit" type="number" min={1} defaultValue={coupon?.usageLimit ?? ''} />
          </Field>
          <Field label="Uses per customer" optional error={error('perUserLimit')}>
            <TextInput name="perUserLimit" type="number" min={1} defaultValue={coupon?.perUserLimit ?? ''} />
          </Field>
          <div className="flex flex-col justify-end gap-2 sm:col-span-2">
            <Checkbox
              name="firstOrderOnly"
              label="First order only"
              defaultChecked={coupon?.firstOrderOnly}
            />
            <Checkbox name="isActive" label="Active" defaultChecked={coupon?.isActive ?? true} />
          </div>
          <div className="sm:col-span-2">
            <FormError message={action.error} />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" pending={action.pending}>
              Save coupon
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
