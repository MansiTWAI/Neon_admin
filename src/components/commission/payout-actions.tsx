'use client';

import { formatINR } from '@neon-adda/shared';
import { useState, type FormEvent } from 'react';
import { usePermission } from '@/components/can';
import { Dialog } from '@/components/ui/dialog';
import { Button, Field, FormError, Select, TextInput } from '@/components/ui/form';
import { useAction } from '@/lib/use-action';

export function CreatePayout({ franchiseId }: { franchiseId: string }) {
  const allowed = usePermission('payouts.write');
  const action = useAction();
  if (!allowed) return null;
  return (
    <>
      <Button
        size="sm"
        pending={action.pending}
        onClick={() => action.run('/admin/commission/payouts', { json: { franchiseId } })}
      >
        Prepare payout
      </Button>
      <FormError message={action.error} />
    </>
  );
}

export function PayoutActions({
  payout,
}: {
  payout: { id: string; franchise: string; netPaise: number; bank: string | null };
}) {
  const allowed = usePermission('payouts.write');
  const pay = useAction();
  const cancel = useAction();
  const [open, setOpen] = useState(false);
  if (!allowed) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (
      await pay.run(`/admin/commission/payouts/${payout.id}/paid`, {
        json: { utr: form.get('utr'), mode: form.get('mode') },
      })
    )
      setOpen(false);
  }

  return (
    <div className="flex gap-1">
      <Button size="sm" onClick={() => setOpen(true)}>
        Mark paid
      </Button>
      <Button
        size="sm"
        variant="ghost"
        pending={cancel.pending}
        onClick={() => cancel.run(`/admin/commission/payouts/${payout.id}/cancel`)}
      >
        Cancel
      </Button>
      <FormError message={cancel.error} />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Pay ${formatINR(payout.netPaise, { paise: true })} to ${payout.franchise}`}
        description={
          payout.bank ? `Bank on file: ${payout.bank}` : 'No bank details on file for this franchise.'
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Transfer method">
            <Select name="mode" defaultValue="NEFT">
              <option>NEFT</option>
              <option>IMPS</option>
              <option>RTGS</option>
              <option>UPI</option>
            </Select>
          </Field>
          <Field label="Bank reference (UTR)" error={pay.fieldErrors.utr}>
            <TextInput name="utr" required minLength={6} maxLength={40} className="font-mono uppercase" />
          </Field>
          <FormError message={pay.error} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Back
            </Button>
            <Button type="submit" pending={pay.pending}>
              Record payment
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
