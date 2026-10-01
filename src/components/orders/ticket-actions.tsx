'use client';

import { useState, type FormEvent } from 'react';
import { usePermission } from '@/components/can';
import { Button, FormError, Select, TextArea } from '@/components/ui/form';
import { useAction } from '@/lib/use-action';

export function TicketActions({
  orderNo,
  ticket,
}: {
  orderNo: string;
  ticket: { id: string; status: string; resolution: string | null };
}) {
  const allowed = usePermission('orders.update');
  const action = useAction();
  const [editing, setEditing] = useState(false);
  if (!allowed) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await action.run(`/admin/orders/${orderNo}/tickets/${ticket.id}`, {
      json: { status: form.get('status'), resolution: form.get('resolution') },
    });
    if (ok) setEditing(false);
  }

  if (!editing) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
        Update
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 w-full space-y-2">
      <Select name="status" defaultValue={ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status}>
        <option value="OPEN">Open</option>
        <option value="IN_PROGRESS">In progress</option>
        <option value="RESOLVED">Resolved</option>
        <option value="CLOSED">Closed</option>
      </Select>
      <TextArea
        name="resolution"
        defaultValue={ticket.resolution ?? ''}
        placeholder="What was done. Sent to the customer when resolved."
        maxLength={2000}
      />
      <FormError message={action.error} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" pending={action.pending}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
