import type { LucideIcon } from 'lucide-react';

export function EmptyState({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-gray-100">
        <Icon className="size-5 text-gray-500" />
      </div>
      <h2 className="mt-4 font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-gray-500">{body}</p>
    </div>
  );
}
