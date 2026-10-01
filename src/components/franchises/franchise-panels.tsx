'use client';

import { useState, type FormEvent } from 'react';
import { usePermission } from '@/components/can';
import { TemporaryPasswordDialog } from '@/components/temporary-password';
import { Badge } from '@/components/ui/data';
import { Button, Checkbox, Field, FormError, TextArea, TextInput } from '@/components/ui/form';
import { formatPhone } from '@/lib/format';
import { useAction } from '@/lib/use-action';

const pincodesIn = (text: string) => [...new Set(text.match(/\b[1-9]\d{5}\b/g) ?? [])];

export function TerritoryEditor({ franchiseId, pincodes }: { franchiseId: string; pincodes: string[] }) {
  const canWrite = usePermission('franchises.write');
  const action = useAction();
  const [text, setText] = useState(pincodes.join(', '));
  const wanted = pincodesIn(text);
  const add = wanted.filter((p) => !pincodes.includes(p));
  const remove = pincodes.filter((p) => !wanted.includes(p));

  const save = (reassign: boolean) =>
    action.run(`/admin/franchises/${franchiseId}/territories`, {
      method: 'PUT',
      json: { add, remove, reassign },
    });

  return (
    <div className="space-y-3">
      <TextArea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        disabled={!canWrite}
        className="font-mono text-xs"
        placeholder="411001, 411004"
        aria-label="Pincodes"
      />
      <p className="text-xs text-gray-500">
        Orders and enquiries from these pincodes go to this franchise. {add.length} to add, {remove.length} to
        remove.
      </p>
      {canWrite && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => save(false)}
            pending={action.pending}
            disabled={!add.length && !remove.length}
          >
            Save pincodes
          </Button>
          {action.code === 'PINCODES_TAKEN' && (
            <Button size="sm" variant="secondary" onClick={() => save(true)} pending={action.pending}>
              Move them to this franchise
            </Button>
          )}
        </div>
      )}
      <FormError message={action.error} />
    </div>
  );
}

interface Technician {
  id: string;
  name: string;
  phone: string;
  skills: string[];
  isActive: boolean;
}

export function TechnicianList({
  franchiseId,
  technicians,
}: {
  franchiseId: string;
  technicians: Technician[];
}) {
  const canWrite = usePermission('franchises.write');
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {technicians.map((t) =>
        editing === t.id ? (
          <TechnicianForm
            key={t.id}
            franchiseId={franchiseId}
            technician={t}
            onDone={() => setEditing(null)}
          />
        ) : (
          <div key={t.id} className="flex items-center justify-between gap-3 text-sm">
            <span>
              <span className="font-medium">{t.name}</span>
              <span className="block text-xs text-gray-500">
                {formatPhone(t.phone)}
                {t.skills.length > 0 && ` · ${t.skills.join(', ')}`}
              </span>
            </span>
            <span className="flex items-center gap-2">
              {!t.isActive && <Badge>Inactive</Badge>}
              {canWrite && (
                <Button size="sm" variant="ghost" onClick={() => setEditing(t.id)}>
                  Edit
                </Button>
              )}
            </span>
          </div>
        ),
      )}
      {technicians.length === 0 && <p className="text-sm text-gray-500">No technicians yet.</p>}
      {canWrite &&
        (editing === 'new' ? (
          <TechnicianForm franchiseId={franchiseId} technician={null} onDone={() => setEditing(null)} />
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setEditing('new')}>
            Add a technician
          </Button>
        ))}
    </div>
  );
}

function TechnicianForm({
  franchiseId,
  technician,
  onDone,
}: {
  franchiseId: string;
  technician: Technician | null;
  onDone: () => void;
}) {
  const action = useAction();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await action.run(
      technician
        ? `/admin/franchises/${franchiseId}/technicians/${technician.id}`
        : `/admin/franchises/${franchiseId}/technicians`,
      {
        method: technician ? 'PUT' : 'POST',
        json: {
          name: form.get('name'),
          phone: form.get('phone'),
          skills: String(form.get('skills') ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          isActive: form.get('isActive') === 'on',
        },
      },
    );
    if (ok) onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-gray-200 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" error={action.fieldErrors.name}>
          <TextInput name="name" defaultValue={technician?.name} required />
        </Field>
        <Field
          label="Mobile"
          hint="They sign in to the technician app with this."
          error={action.fieldErrors.phone}
        >
          <TextInput name="phone" type="tel" defaultValue={technician?.phone.replace(/^\+91/, '')} required />
        </Field>
      </div>
      <Field label="Skills" optional>
        <TextInput
          name="skills"
          defaultValue={technician?.skills.join(', ')}
          placeholder="installation, wiring"
        />
      </Field>
      <Checkbox name="isActive" label="Can take jobs" defaultChecked={technician?.isActive ?? true} />
      <FormError message={action.error} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" pending={action.pending}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function ResetOwnerPassword({ franchiseId, email }: { franchiseId: string; email: string }) {
  const canWrite = usePermission('franchises.write');
  const action = useAction();
  const [password, setPassword] = useState<string | null>(null);
  if (!canWrite) return null;

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        pending={action.pending}
        onClick={async () => {
          const result = await action.run<{ temporaryPassword: string }>(
            `/admin/franchises/${franchiseId}/owner/reset-password`,
          );
          if (result) setPassword(result.temporaryPassword);
        }}
      >
        Reset password
      </Button>
      <FormError message={action.error} />
      <TemporaryPasswordDialog email={email} password={password} onClose={() => setPassword(null)} />
    </>
  );
}
