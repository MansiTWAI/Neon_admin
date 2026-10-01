'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Dialog } from './ui/dialog';
import { Button } from './ui/form';

/** Shows a one-time password exactly once. It is not stored anywhere it can be read back. */
export function TemporaryPasswordDialog({
  email,
  password,
  onClose,
}: {
  email: string;
  password: string | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Dialog
      open={password !== null}
      onClose={onClose}
      title="Share these sign-in details"
      description="This password is shown only once. Send it privately; they choose their own sign-in steps after the first login."
    >
      <dl className="space-y-3 rounded-xl bg-gray-50 p-4 text-sm">
        <div>
          <dt className="text-gray-500">Email</dt>
          <dd className="font-medium">{email}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Temporary password</dt>
          <dd className="font-mono text-lg font-semibold tracking-wide">{password}</dd>
        </div>
      </dl>
      <div className="mt-5 flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={async () => {
            await navigator.clipboard.writeText(`${email}\n${password}`);
            setCopied(true);
          }}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button onClick={onClose}>Done</Button>
      </div>
    </Dialog>
  );
}
