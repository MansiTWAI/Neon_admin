'use client';

import { useState, type FormEvent } from 'react';
import { usePermission } from '@/components/can';
import { Badge } from '@/components/ui/data';
import { Button, Checkbox, Field, FormError, TextInput } from '@/components/ui/form';
import { useAction } from '@/lib/use-action';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort: number;
  isActive: boolean;
  products: number;
}

export function CategoryEditor({ categories }: { categories: Category[] }) {
  const canWrite = usePermission('catalog.write');
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {categories.map((category) =>
        editing === category.id ? (
          <CategoryForm key={category.id} category={category} onDone={() => setEditing(null)} />
        ) : (
          <div
            key={category.id}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900">
                {category.name}{' '}
                <span className="text-xs font-normal text-gray-400">/shop/{category.slug}</span>
              </p>
              {category.description && (
                <p className="truncate text-sm text-gray-500">{category.description}</p>
              )}
            </div>
            <span className="text-sm text-gray-500 tabular-nums">{category.products} products</span>
            {!category.isActive && <Badge>Hidden</Badge>}
            {canWrite && (
              <Button size="sm" variant="ghost" onClick={() => setEditing(category.id)}>
                Edit
              </Button>
            )}
          </div>
        ),
      )}
      {canWrite &&
        (editing === 'new' ? (
          <CategoryForm category={null} onDone={() => setEditing(null)} />
        ) : (
          <Button variant="secondary" onClick={() => setEditing('new')}>
            Add a category
          </Button>
        ))}
    </div>
  );
}

function CategoryForm({ category, onDone }: { category: Category | null; onDone: () => void }) {
  const action = useAction();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await action.run(
      category ? `/admin/catalog/categories/${category.id}` : '/admin/catalog/categories',
      {
        method: category ? 'PUT' : 'POST',
        json: {
          name: form.get('name'),
          slug: form.get('slug'),
          description: String(form.get('description') ?? '').trim() || null,
          sort: Number(form.get('sort') || 0),
          isActive: form.get('isActive') === 'on',
        },
      },
    );
    if (ok) onDone();
  }

  return (
    <form
      onSubmit={submit}
      className="grid grid-cols-1 gap-3 rounded-xl border border-brand/30 bg-white p-4 sm:grid-cols-2"
    >
      <Field label="Name" error={action.fieldErrors.name}>
        <TextInput name="name" defaultValue={category?.name} required />
      </Field>
      <Field label="Web address" error={action.fieldErrors.slug}>
        <TextInput name="slug" defaultValue={category?.slug} required placeholder="weddings-and-events" />
      </Field>
      <Field label="Description" optional className="sm:col-span-2">
        <TextInput name="description" defaultValue={category?.description ?? ''} maxLength={300} />
      </Field>
      <Field label="Order in the shop" hint="Lower numbers come first.">
        <TextInput name="sort" type="number" min={0} defaultValue={category?.sort ?? 20} />
      </Field>
      <div className="flex items-end pb-2">
        <Checkbox name="isActive" label="Show in the shop" defaultChecked={category?.isActive ?? true} />
      </div>
      <div className="sm:col-span-2">
        <FormError message={action.error} />
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" pending={action.pending}>
          Save
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
