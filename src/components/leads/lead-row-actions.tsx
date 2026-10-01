'use client';

import { Select } from '@/components/ui/form';
import { useAction } from '@/lib/use-action';

const STATUSES = [
  ['NEW', 'New'],
  ['CONTACTED', 'Contacted'],
  ['QUOTED', 'Quoted'],
  ['WON', 'Won'],
  ['LOST', 'Lost'],
] as const;

/** Inline status and franchise pickers; each change saves on its own. */
export function LeadRowActions({
  lead,
  franchises,
}: {
  lead: { id: string; status: string; franchiseId: string | null };
  franchises: { id: string; name: string }[];
}) {
  const action = useAction();
  const save = (patch: Record<string, unknown>) =>
    action.run(`/admin/leads/${lead.id}`, { method: 'PATCH', json: patch });

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row">
      <Select
        aria-label="Lead status"
        defaultValue={lead.status}
        disabled={action.pending}
        onChange={(e) => void save({ status: e.target.value })}
        className="py-1.5 sm:w-32"
      >
        {STATUSES.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Franchise"
        defaultValue={lead.franchiseId ?? ''}
        disabled={action.pending}
        onChange={(e) => void save({ franchiseId: e.target.value || null })}
        className="py-1.5 sm:w-48"
      >
        <option value="">Head office</option>
        {franchises.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </Select>
      {action.error && <span className="text-xs text-red-600">{action.error}</span>}
    </div>
  );
}
