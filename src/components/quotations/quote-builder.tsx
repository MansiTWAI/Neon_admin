'use client';

import { formatINR, roundHalfUp } from '@neon-adda/shared';
import { Plus, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { usePermission } from '@/components/can';
import { Dialog } from '@/components/ui/dialog';
import { Button, Field, FormError, MoneyInput, TextArea, TextInput } from '@/components/ui/form';
import type { AdminQuote } from '@/lib/types';
import { useAction } from '@/lib/use-action';

interface Line {
  key: string;
  description: string;
  widthIn: string;
  heightIn: string;
  qty: string;
  amount: string;
}

const DAY = 24 * 60 * 60 * 1000;

function initialLines(quote: AdminQuote): Line[] {
  if (quote.items.length) {
    return quote.items.map((item) => ({
      key: item.id,
      description: item.description,
      widthIn: item.widthIn ? String(item.widthIn) : '',
      heightIn: item.heightIn ? String(item.heightIn) : '',
      qty: String(item.qty),
      amount: String(item.amountPaise / 100),
    }));
  }
  const request = quote.request;
  return [
    {
      key: 'first',
      description: request ? `${request.kind === 'LOGO' ? 'Logo neon sign' : 'Neon sign'}` : '',
      widthIn: request?.widthIn ? String(request.widthIn) : '',
      heightIn: request?.heightIn ? String(request.heightIn) : '',
      qty: String(request?.qty ?? 1),
      amount: request?.estimatePaise ? String(roundHalfUp(request.estimatePaise / 1.18 / 100)) : '',
    },
  ];
}

/**
 * Prices a quotation line by line. Amounts are entered before GST; GST is worked out by the API
 * for the delivery state, and the preview here assumes an intra-state sale.
 */
export function QuoteBuilder({ quote, gstRatePct }: { quote: AdminQuote; gstRatePct: number }) {
  const canWrite = usePermission('quotations.write');
  const save = useAction();
  const send = useAction();
  const decline = useAction();
  const [lines, setLines] = useState<Line[]>(() => initialLines(quote));
  const [discount, setDiscount] = useState(
    quote.totals.discountPaise ? String(quote.totals.discountPaise / 100) : '',
  );
  const [validDays, setValidDays] = useState(
    quote.validUntil && quote.sentAt
      ? String(
          Math.max(
            1,
            Math.round((new Date(quote.validUntil).getTime() - new Date(quote.sentAt).getTime()) / DAY),
          ),
        )
      : '15',
  );
  const [terms, setTerms] = useState(
    quote.terms ?? '50% advance to start work, balance before dispatch. Prices include design and testing.',
  );
  const [notes, setNotes] = useState(quote.notes ?? '');
  const [declining, setDeclining] = useState(false);
  const [dirty, setDirty] = useState(quote.status === 'REQUESTED' || quote.status === 'CHANGES_REQUESTED');

  const editable =
    canWrite &&
    quote.isLatest &&
    ['REQUESTED', 'IN_REVIEW', 'CHANGES_REQUESTED', 'SENT'].includes(quote.status);
  const subtotal = lines.reduce((sum, line) => sum + Math.round(Number(line.amount || 0) * 100), 0);
  const discountPaise = Math.round(Number(discount || 0) * 100);
  const taxable = Math.max(0, subtotal - discountPaise);
  const gst = roundHalfUp((taxable * gstRatePct) / 100);

  const update = (key: string, patch: Partial<Line>) => {
    setDirty(true);
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  async function handleSave() {
    const saved = await save.run<AdminQuote>(`/admin/quotations/${quote.id}`, {
      method: 'PUT',
      json: {
        items: lines.map((line) => ({
          description: line.description,
          widthIn: line.widthIn ? Number(line.widthIn) : null,
          heightIn: line.heightIn ? Number(line.heightIn) : null,
          qty: Number(line.qty || 1),
          amountPaise: Math.round(Number(line.amount || 0) * 100),
        })),
        discountPaise,
        validDays: Number(validDays || 15),
        terms: terms.trim() || null,
        notes: notes.trim() || null,
      },
    });
    if (saved) {
      setDirty(false);
      // Saving a quotation the customer has seen creates a new version with its own page.
      if (saved.id !== quote.id) window.location.assign(`/quotations/${saved.id}`);
    }
  }

  if (!editable) return null;

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {lines.map((line, i) => (
          <div
            key={line.key}
            className="grid grid-cols-1 gap-2 rounded-xl border border-gray-200 p-3 sm:grid-cols-[minmax(0,1fr)_70px_70px_60px_130px_auto]"
          >
            <Field label={i === 0 ? 'Description' : ''} error={save.fieldErrors[`items.${i}.description`]}>
              <TextInput
                value={line.description}
                onChange={(e) => update(line.key, { description: e.target.value })}
                placeholder="Logo neon sign, Ice Blue, black acrylic"
              />
            </Field>
            <Field label={i === 0 ? 'W (in)' : ''}>
              <TextInput
                type="number"
                min={1}
                value={line.widthIn}
                onChange={(e) => update(line.key, { widthIn: e.target.value })}
              />
            </Field>
            <Field label={i === 0 ? 'H (in)' : ''}>
              <TextInput
                type="number"
                min={1}
                value={line.heightIn}
                onChange={(e) => update(line.key, { heightIn: e.target.value })}
              />
            </Field>
            <Field label={i === 0 ? 'Qty' : ''}>
              <TextInput
                type="number"
                min={1}
                value={line.qty}
                onChange={(e) => update(line.key, { qty: e.target.value })}
              />
            </Field>
            <Field
              label={i === 0 ? 'Amount before GST' : ''}
              error={save.fieldErrors[`items.${i}.amountPaise`]}
            >
              <MoneyInput
                value={line.amount}
                onChange={(e) => update(line.key, { amount: e.target.value })}
              />
            </Field>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setDirty(true);
                  setLines((current) => current.filter((l) => l.key !== line.key));
                }}
                disabled={lines.length === 1}
                aria-label="Remove line"
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600 disabled:opacity-30"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setDirty(true);
            setLines((current) => [
              ...current,
              { key: crypto.randomUUID(), description: '', widthIn: '', heightIn: '', qty: '1', amount: '' },
            ]);
          }}
        >
          <Plus className="size-4" /> Add a line, e.g. installation or a dimmer
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Discount" optional>
          <MoneyInput
            value={discount}
            onChange={(e) => {
              setDirty(true);
              setDiscount(e.target.value);
            }}
          />
        </Field>
        <Field label="Valid for (days)">
          <TextInput
            type="number"
            min={1}
            max={90}
            value={validDays}
            onChange={(e) => {
              setDirty(true);
              setValidDays(e.target.value);
            }}
          />
        </Field>
        <div className="rounded-xl bg-gray-50 p-3 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Before GST</span>
            <span className="tabular-nums">{formatINR(taxable, { paise: true })}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>GST {gstRatePct}%</span>
            <span className="tabular-nums">{formatINR(gst, { paise: true })}</span>
          </div>
          <div className="mt-1 flex justify-between font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatINR(roundHalfUp((taxable + gst) / 100) * 100)}</span>
          </div>
        </div>
      </div>

      <Field label="Terms shown to the customer">
        <TextArea
          value={terms}
          onChange={(e) => {
            setDirty(true);
            setTerms(e.target.value);
          }}
          maxLength={2000}
        />
      </Field>
      <Field label="Internal notes" optional hint="Not shown to the customer.">
        <TextArea
          value={notes}
          onChange={(e) => {
            setDirty(true);
            setNotes(e.target.value);
          }}
          maxLength={2000}
          rows={2}
        />
      </Field>

      <FormError message={save.error ?? send.error} />
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleSave} pending={save.pending} variant={dirty ? 'primary' : 'secondary'}>
          {quote.sentAt ? 'Save as new version' : 'Save draft'}
        </Button>
        {quote.status === 'IN_REVIEW' && (
          <Button
            onClick={() => send.run(`/admin/quotations/${quote.id}/send`)}
            pending={send.pending}
            disabled={dirty}
            title={dirty ? 'Save your changes first' : undefined}
          >
            <Send className="size-4" /> Send to customer
          </Button>
        )}
        {quote.status !== 'SENT' && (
          <Button variant="ghost" onClick={() => setDeclining(true)} className="ml-auto text-red-600">
            Decline request
          </Button>
        )}
      </div>

      <Dialog
        open={declining}
        onClose={() => setDeclining(false)}
        title="Decline this request"
        description="The customer is told why."
      >
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const reason = String(new FormData(event.currentTarget).get('reason') ?? '');
            if (await decline.run(`/admin/quotations/${quote.id}/decline`, { json: { reason } }))
              setDeclining(false);
          }}
          className="space-y-4"
        >
          <Field label="Reason" error={decline.fieldErrors.reason}>
            <TextArea
              name="reason"
              required
              minLength={5}
              maxLength={500}
              placeholder="We are not able to make signs above 12 feet."
            />
          </Field>
          <FormError message={decline.error} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeclining(false)}>
              Back
            </Button>
            <Button type="submit" variant="danger" pending={decline.pending}>
              Decline
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
