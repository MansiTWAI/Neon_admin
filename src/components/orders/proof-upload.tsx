'use client';

import { ImageUp } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { usePermission } from '@/components/can';
import { Button, FormError, TextArea } from '@/components/ui/form';
import { useAction } from '@/lib/use-action';

const MAX_BYTES = 10 * 1024 * 1024;

/** Uploads a design proof for one sign; the customer is notified to approve it. */
export function ProofUpload({
  orderNo,
  itemId,
  revision,
}: {
  orderNo: string;
  itemId: string;
  revision: boolean;
}) {
  const allowed = usePermission('orders.update');
  const action = useAction();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!allowed) return null;

  function choose(chosen: File | undefined) {
    setError(null);
    if (!chosen) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(chosen.type))
      return setError('Use a PNG, JPG or WebP image');
    if (chosen.size > MAX_BYTES) return setError('Proof images can be up to 10 MB');
    if (preview) URL.revokeObjectURL(preview);
    setFile(chosen);
    setPreview(URL.createObjectURL(chosen));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    const form = event.currentTarget;
    const body = new FormData();
    body.append('designerNote', String(new FormData(form).get('designerNote') ?? ''));
    body.append('file', file);
    if (await action.run(`/admin/orders/${orderNo}/items/${itemId}/proofs`, { body })) {
      setFile(null);
      setPreview(null);
      form.reset();
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-xl border border-dashed border-gray-300 p-3">
      <div className="flex items-center gap-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="New proof"
            className="h-16 w-24 rounded-lg border border-gray-200 object-cover"
          />
        ) : (
          <div className="grid h-16 w-24 place-items-center rounded-lg bg-gray-50 text-gray-400">
            <ImageUp className="size-5" />
          </div>
        )}
        <div className="text-sm">
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
            {file ? 'Choose another image' : revision ? 'Upload revised proof' : 'Upload proof'}
          </Button>
          <p className="mt-1 text-xs text-gray-500">{file ? file.name : 'PNG, JPG or WebP up to 10 MB'}</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => choose(e.target.files?.[0])}
        />
      </div>
      {file && (
        <>
          <TextArea
            name="designerNote"
            placeholder="Note for the customer, e.g. what changed"
            maxLength={1000}
          />
          <Button type="submit" pending={action.pending}>
            Send proof to customer
          </Button>
        </>
      )}
      <FormError message={error ?? action.error} />
    </form>
  );
}
