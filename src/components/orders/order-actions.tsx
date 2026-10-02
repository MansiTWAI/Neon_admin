'use client';

import { formatINR, type OrderStatus } from '@neon-adda/shared';
import { IndianRupee } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { usePermission } from '@/components/can';
import { Dialog } from '@/components/ui/dialog';
import {
  Button,
  Field,
  FormError,
  MoneyInput,
  rupeesToPaise,
  Select,
  TextArea,
  TextInput,
} from '@/components/ui/form';
import { fromLocalInput, MOVE_LABEL, ORDER_STATUS } from '@/lib/format';
import { useAction } from '@/lib/use-action';

/** Moves that need more than a click: a reason, or the courier details. */
const NEEDS_DETAILS: OrderStatus[] = ['SHIPPED', 'ON_HOLD', 'CANCELLED', 'EXPIRED'];
const DESTRUCTIVE: OrderStatus[] = ['CANCELLED', 'EXPIRED', 'ON_HOLD'];

export function StatusActions({
  orderNo,
  current,
  moves,
}: {
  orderNo: string;
  current: OrderStatus;
  moves: OrderStatus[];
}) {
  const allowed = usePermission('orders.update');
  const action = useAction();
  const [target, setTarget] = useState<OrderStatus | null>(null);
  if (!allowed || moves.length === 0) return null;

  const move = (to: OrderStatus, extra: Record<string, unknown> = {}) =>
    action.run(`/admin/orders/${orderNo}/status`, { json: { to, ...extra } });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    if (await move(target!, form)) setTarget(null);
  }

  const label = (to: OrderStatus) =>
    current === 'ON_HOLD' && to !== 'CANCELLED'
      ? `Resume: ${ORDER_STATUS[to].label.toLowerCase()}`
      : (MOVE_LABEL[to] ?? ORDER_STATUS[to].label);
  const forward = moves.filter((m) => !DESTRUCTIVE.includes(m));
  const other = moves.filter((m) => DESTRUCTIVE.includes(m));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {forward.map((to) => (
        <Button
          key={to}
          pending={action.pending && target === null}
          onClick={() => (NEEDS_DETAILS.includes(to) ? setTarget(to) : void move(to))}
        >
          {label(to)}
        </Button>
      ))}
      {other.map((to) => (
        <Button key={to} variant="secondary" onClick={() => setTarget(to)}>
          {MOVE_LABEL[to] ?? ORDER_STATUS[to].label}
        </Button>
      ))}
      {!target && action.error && <p className="w-full text-sm text-red-600">{action.error}</p>}

      <Dialog
        open={target !== null}
        onClose={() => {
          setTarget(null);
          action.reset();
        }}
        title={target ? (MOVE_LABEL[target] ?? ORDER_STATUS[target].label) : ''}
        description={target === 'CANCELLED' ? 'The customer is told their order was cancelled.' : undefined}
      >
        <form onSubmit={submit} className="space-y-4">
          {target === 'SHIPPED' && (
            <>
              <Field label="Courier" error={action.fieldErrors.courierName}>
                <TextInput name="courierName" required placeholder="Delhivery, Blue Dart, own van" />
              </Field>
              <Field label="Tracking number" error={action.fieldErrors.awbNo}>
                <TextInput name="awbNo" required />
              </Field>
              <Field label="Tracking link" optional error={action.fieldErrors.trackingUrl}>
                <TextInput name="trackingUrl" type="url" placeholder="https://" />
              </Field>
            </>
          )}
          <Field
            label={target === 'SHIPPED' ? 'Note' : 'Reason'}
            optional={target === 'SHIPPED'}
            error={action.fieldErrors.note}
            hint={target === 'CANCELLED' ? 'Shown to the customer.' : 'Kept on the order history.'}
          >
            <TextArea name="note" required={target !== 'SHIPPED'} maxLength={500} />
          </Field>
          <FormError message={action.error} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setTarget(null)}>
              Back
            </Button>
            <Button
              type="submit"
              variant={target === 'CANCELLED' ? 'danger' : 'primary'}
              pending={action.pending}
            >
              {target ? (MOVE_LABEL[target] ?? 'Confirm') : 'Confirm'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export function RecordPayment({
  orderNo,
  duePaise,
  advancePaise,
}: {
  orderNo: string;
  duePaise: number;
  advancePaise: number;
}) {
  const allowed = usePermission('payments.write');
  const action = useAction();
  const [open, setOpen] = useState(false);
  if (!allowed || duePaise <= 0) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const receivedAt = fromLocalInput(String(form.get('receivedAt') ?? ''));
    const ok = await action.run(`/admin/orders/${orderNo}/payments`, {
      json: {
        amountPaise: rupeesToPaise(form.get('amount')),
        method: form.get('method'),
        reference: form.get('reference'),
        ...(receivedAt ? { receivedAt } : {}),
      },
    });
    if (ok) setOpen(false);
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <IndianRupee className="size-4" /> Record payment
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Record a payment"
        description={`${formatINR(duePaise, { paise: true })} is due. Record the cash or UPI collected on delivery, or a bank transfer.`}
      >
        <form onSubmit={submit} className="space-y-4">
          <Field
            label="Amount"
            error={action.fieldErrors.amountPaise}
            hint={
              advancePaise < duePaise ? `The advance to start work is ${formatINR(advancePaise)}.` : undefined
            }
          >
            <MoneyInput name="amount" required defaultValue={duePaise / 100} max={duePaise / 100} />
          </Field>
          <Field label="Received by">
            <Select name="method" defaultValue="OFFLINE_CASH">
              <option value="OFFLINE_CASH">Cash</option>
              <option value="OFFLINE_UPI">UPI to company account</option>
              <option value="OFFLINE_BANK">Bank transfer (NEFT, IMPS, RTGS)</option>
            </Select>
          </Field>
          <Field
            label="Reference"
            optional
            hint="UTR, UPI transaction ID or receipt number."
            error={action.fieldErrors.reference}
          >
            <TextInput name="reference" maxLength={60} />
          </Field>
          <Field
            label="Received on"
            optional
            hint="Leave blank for now."
            error={action.fieldErrors.receivedAt}
          >
            <TextInput name="receivedAt" type="datetime-local" />
          </Field>
          <FormError message={action.error} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" pending={action.pending}>
              Record payment
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
