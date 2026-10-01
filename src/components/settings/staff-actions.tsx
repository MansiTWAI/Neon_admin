'use client';

import { useState, type FormEvent } from 'react';
import { usePermission } from '@/components/can';
import { TemporaryPasswordDialog } from '@/components/temporary-password';
import { Dialog } from '@/components/ui/dialog';
import { Button, Checkbox, Field, FormError, Select, TextInput } from '@/components/ui/form';
import { useAction } from '@/lib/use-action';

interface Role {
  key: string;
  name: string;
}

export function InviteStaff({ roles }: { roles: Role[] }) {
  const allowed = usePermission('users.write');
  const action = useAction();
  const [open, setOpen] = useState(false);
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);
  if (!allowed) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await action.run<{ email: string; temporaryPassword: string }>('/admin/staff', {
      json: { name: form.get('name'), email: form.get('email'), roleKey: form.get('roleKey') },
    });
    if (result) {
      setOpen(false);
      setIssued({ email: result.email, password: result.temporaryPassword });
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add staff</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add a staff member"
        description="They set up two-factor sign-in the first time they log in."
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name" error={action.fieldErrors.name}>
            <TextInput name="name" required />
          </Field>
          <Field label="Work email" error={action.fieldErrors.email}>
            <TextInput name="email" type="email" required />
          </Field>
          <Field label="Role">
            <Select name="roleKey" defaultValue="operations">
              {roles.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
          <FormError message={action.error} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" pending={action.pending}>
              Create account
            </Button>
          </div>
        </form>
      </Dialog>
      <TemporaryPasswordDialog
        email={issued?.email ?? ''}
        password={issued?.password ?? null}
        onClose={() => setIssued(null)}
      />
    </>
  );
}

export function StaffMemberActions({
  member,
  roles,
  isSelf,
}: {
  member: { id: string; name: string | null; email: string | null; status: string; roles: Role[] };
  roles: Role[];
  isSelf: boolean;
}) {
  const allowed = usePermission('users.write');
  const update = useAction();
  const reset = useAction();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  if (!allowed || isSelf) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (
      await update.run(`/admin/staff/${member.id}`, {
        method: 'PUT',
        json: { roleKey: form.get('roleKey'), status: form.get('status') },
      })
    ) {
      setOpen(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const resetTwoFactor = new FormData(event.currentTarget).get('resetTwoFactor') === 'on';
    const result = await reset.run<{ temporaryPassword: string }>(
      `/admin/staff/${member.id}/reset-password`,
      { json: { resetTwoFactor } },
    );
    if (result) {
      setOpen(false);
      setPassword(result.temporaryPassword);
    }
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Manage
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={member.name ?? member.email ?? 'Staff member'}
        description="Changes sign them out everywhere."
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Role">
            <Select name="roleKey" defaultValue={member.roles[0]?.key}>
              {roles.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Access">
            <Select name="status" defaultValue={member.status === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE'}>
              <option value="ACTIVE">Can sign in</option>
              <option value="BLOCKED">Blocked</option>
            </Select>
          </Field>
          <FormError message={update.error} />
          <Button type="submit" pending={update.pending}>
            Save access
          </Button>
        </form>
        <form onSubmit={resetPassword} className="mt-6 space-y-3 border-t border-gray-100 pt-5">
          <p className="text-sm font-semibold text-gray-900">Locked out?</p>
          <Checkbox name="resetTwoFactor" label="Also reset their authenticator app (lost phone)" />
          <FormError message={reset.error} />
          <Button type="submit" variant="secondary" pending={reset.pending}>
            Issue a temporary password
          </Button>
        </form>
      </Dialog>
      <TemporaryPasswordDialog
        email={member.email ?? ''}
        password={password}
        onClose={() => setPassword(null)}
      />
    </>
  );
}
