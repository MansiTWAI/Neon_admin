'use client';

import type { FormEvent } from 'react';
import { usePermission } from '@/components/can';
import { Button, Field, FormError, Select, TextArea, TextInput } from '@/components/ui/form';
import { fromLocalInput, toLocalInput } from '@/lib/format';
import type { AdminOrder } from '@/lib/types';
import { useAction } from '@/lib/use-action';

export function InstallationForm({ order }: { order: AdminOrder }) {
  const allowed = usePermission('orders.update');
  const action = useAction();
  const job = order.installation;
  if (!allowed) return null;

  const hours =
    job?.scheduledStart && job.scheduledEnd
      ? (new Date(job.scheduledEnd).getTime() - new Date(job.scheduledStart).getTime()) / 3_600_000
      : 2;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void action.run(`/admin/orders/${order.orderNo}/installation`, {
      method: 'PUT',
      json: {
        technicianId: form.get('technicianId') || null,
        scheduledStart: fromLocalInput(String(form.get('scheduledStart') ?? '')),
        durationHours: Number(form.get('durationHours')),
        notes: form.get('notes'),
      },
    });
  }

  if (order.technicians.length === 0) {
    return (
      <p className="text-sm text-amber-700">
        No technicians are set up for {order.franchise?.name ?? 'this order'}. Add one under Franchises.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Technician" error={action.fieldErrors.technicianId}>
        <Select name="technicianId" defaultValue={job?.technicianId ?? ''}>
          <option value="">Not assigned</option>
          {order.technicians.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.franchise ? ` · ${t.franchise}` : ''}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-[1fr_96px] gap-3">
        <Field label="Visit" error={action.fieldErrors.scheduledStart}>
          <TextInput
            name="scheduledStart"
            type="datetime-local"
            defaultValue={toLocalInput(job?.scheduledStart)}
          />
        </Field>
        <Field label="Hours">
          <TextInput name="durationHours" type="number" min={0.5} max={12} step={0.5} defaultValue={hours} />
        </Field>
      </div>
      <Field label="Notes for the technician" optional>
        <TextArea name="notes" defaultValue={job?.notes ?? ''} maxLength={500} rows={2} />
      </Field>
      <FormError message={action.error} />
      <Button type="submit" variant="secondary" pending={action.pending}>
        Save installation
      </Button>
    </form>
  );
}
