'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { usePermission } from '@/components/can';
import { SignPreview } from '@/components/sign-preview';
import {
  Button,
  Checkbox,
  Field,
  FormError,
  MoneyInput,
  paiseToRupees,
  rupeesToPaise,
  Select,
  TextArea,
  TextInput,
} from '@/components/ui/form';
import { PRODUCT_TYPE } from '@/lib/format';
import { useAction } from '@/lib/use-action';

export interface ProductFormValue {
  id?: string;
  categoryId: string;
  type: string;
  pricingMode: 'INSTANT' | 'QUOTE';
  name: string;
  slug: string;
  description: string | null;
  design: {
    lines: { text: string; colorName: string; glowHex: string; tubeHex: string }[];
    fontFamily: string;
    backboardCode: string;
  } | null;
  sizes: { label: string; widthIn: number; heightIn: number }[];
  highlights: string[];
  tags: string[];
  leadTimeDays: number;
  rateOverridePaise: number | null;
  isFeatured: boolean;
  isActive: boolean;
}

interface Assets {
  fonts: { family: string; name: string }[];
  colors: { name: string; glowHex: string; tubeHex: string }[];
  backboards: { code: string; name: string }[];
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);

export function ProductForm({
  product,
  categories,
  assets,
}: {
  product: ProductFormValue | null;
  categories: { id: string; name: string }[];
  assets: Assets;
}) {
  const router = useRouter();
  const canWrite = usePermission('catalog.write');
  const action = useAction();
  const firstColor = assets.colors[0]!;

  const [type, setType] = useState(product?.type ?? 'READYMADE');
  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [lines, setLines] = useState(
    product?.design?.lines ?? [
      { text: '', colorName: firstColor.name, glowHex: firstColor.glowHex, tubeHex: firstColor.tubeHex },
    ],
  );
  const [fontFamily, setFontFamily] = useState(product?.design?.fontFamily ?? assets.fonts[0]?.family ?? '');
  const [sizes, setSizes] = useState(
    (product?.sizes.length
      ? product.sizes
      : [
          { label: 'Small', widthIn: 18, heightIn: 8 },
          { label: 'Medium', widthIn: 24, heightIn: 11 },
          { label: 'Large', widthIn: 36, heightIn: 16 },
        ]
    ).map((s) => ({ ...s, key: crypto.randomUUID() })),
  );

  const readymade = type === 'READYMADE';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const list = (key: string, separator: RegExp) =>
      String(form.get(key) ?? '')
        .split(separator)
        .map((v) => v.trim())
        .filter(Boolean);

    const saved = await action.run<{ id: string }>(
      product?.id ? `/admin/catalog/products/${product.id}` : '/admin/catalog/products',
      {
        method: product?.id ? 'PUT' : 'POST',
        json: {
          categoryId: form.get('categoryId'),
          type,
          pricingMode: form.get('pricingMode'),
          name,
          slug,
          description: String(form.get('description') ?? '').trim() || null,
          design: readymade ? { lines, fontFamily, backboardCode: form.get('backboardCode') } : null,
          sizes: readymade ? sizes.map(({ label, widthIn, heightIn }) => ({ label, widthIn, heightIn })) : [],
          highlights: list('highlights', /\n/),
          tags: list('tags', /,/).map((t) => slugify(t)),
          leadTimeDays: Number(form.get('leadTimeDays')),
          rateOverridePaise: form.get('rateOverride') ? rupeesToPaise(form.get('rateOverride')) : null,
          isFeatured: form.get('isFeatured') === 'on',
          isActive: form.get('isActive') === 'on',
        },
      },
    );
    if (saved && !product?.id) router.replace(`/catalog/${saved.id}`);
  }

  const error = (field: string) => action.fieldErrors[field];

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <fieldset disabled={!canWrite} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" error={error('name')}>
            <TextInput
              value={name}
              required
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />
          </Field>
          <Field label="Web address" hint={`Shop page: /p/${slug || '…'}`} error={error('slug')}>
            <TextInput
              value={slug}
              required
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
          </Field>
          <Field label="Category" error={error('categoryId')}>
            <Select name="categoryId" defaultValue={product?.categoryId ?? categories[0]?.id} required>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value)} disabled={Boolean(product)}>
              {Object.entries(PRODUCT_TYPE).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Description" optional>
          <TextArea name="description" defaultValue={product?.description ?? ''} maxLength={1000} />
        </Field>

        {readymade && (
          <>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Lettering</p>
              <div className="space-y-2">
                {lines.map((line, i) => (
                  <div key={i} className="grid grid-cols-[1fr_160px_auto] gap-2">
                    <TextInput
                      value={line.text}
                      maxLength={30}
                      required
                      placeholder={`Line ${i + 1}`}
                      aria-label={`Line ${i + 1}`}
                      onChange={(e) =>
                        setLines((all) => all.map((l, j) => (j === i ? { ...l, text: e.target.value } : l)))
                      }
                    />
                    <Select
                      aria-label={`Colour of line ${i + 1}`}
                      value={line.glowHex}
                      onChange={(e) => {
                        const color = assets.colors.find((c) => c.glowHex === e.target.value)!;
                        setLines((all) =>
                          all.map((l, j) =>
                            j === i
                              ? {
                                  ...l,
                                  colorName: color.name,
                                  glowHex: color.glowHex,
                                  tubeHex: color.tubeHex,
                                }
                              : l,
                          ),
                        );
                      }}
                    >
                      {assets.colors.map((c) => (
                        <option key={c.glowHex} value={c.glowHex}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                    <button
                      type="button"
                      onClick={() => setLines((all) => all.filter((_, j) => j !== i))}
                      disabled={lines.length === 1}
                      aria-label={`Remove line ${i + 1}`}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600 disabled:opacity-30"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
              {lines.length < 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1"
                  onClick={() => setLines((all) => [...all, { ...all[all.length - 1]!, text: '' }])}
                >
                  <Plus className="size-4" /> Add a line
                </Button>
              )}
              {error('design') && <p className="mt-1 text-xs text-red-600">{error('design')}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Font">
                <Select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                  {assets.fonts.map((f) => (
                    <option key={f.family} value={f.family}>
                      {f.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Default backboard">
                <Select name="backboardCode" defaultValue={product?.design?.backboardCode ?? 'CLR_CUT'}>
                  {assets.backboards.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Sizes offered</p>
              <div className="space-y-2">
                {sizes.map((size, i) => (
                  <div key={size.key} className="grid grid-cols-[1fr_90px_90px_auto] gap-2">
                    <TextInput
                      value={size.label}
                      aria-label="Size name"
                      onChange={(e) =>
                        setSizes((all) => all.map((s, j) => (j === i ? { ...s, label: e.target.value } : s)))
                      }
                    />
                    <TextInput
                      type="number"
                      aria-label="Width in inches"
                      value={size.widthIn}
                      min={6}
                      onChange={(e) =>
                        setSizes((all) =>
                          all.map((s, j) => (j === i ? { ...s, widthIn: Number(e.target.value) } : s)),
                        )
                      }
                    />
                    <TextInput
                      type="number"
                      aria-label="Height in inches"
                      value={size.heightIn}
                      min={2}
                      onChange={(e) =>
                        setSizes((all) =>
                          all.map((s, j) => (j === i ? { ...s, heightIn: Number(e.target.value) } : s)),
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setSizes((all) => all.filter((_, j) => j !== i))}
                      disabled={sizes.length === 1}
                      aria-label="Remove size"
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600 disabled:opacity-30"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Width × height in inches. Prices come from the rate card.
              </p>
              {sizes.length < 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1"
                  onClick={() =>
                    setSizes((all) => [
                      ...all,
                      { key: crypto.randomUUID(), label: '', widthIn: 48, heightIn: 20 },
                    ])
                  }
                >
                  <Plus className="size-4" /> Add a size
                </Button>
              )}
            </div>
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Highlights" optional hint="One per line, shown as a checklist.">
            <TextArea name="highlights" defaultValue={product?.highlights.join('\n') ?? ''} rows={4} />
          </Field>
          <Field
            label="Tags"
            optional
            hint="Comma separated, e.g. bedroom, gift. Used by search and the occasion pages."
          >
            <TextArea name="tags" defaultValue={product?.tags.join(', ') ?? ''} rows={4} />
          </Field>
        </div>
      </fieldset>

      <aside className="space-y-4">
        {readymade && (
          <SignPreview
            previewUrl={null}
            lettering={{ fontFamily, lines: lines.filter((l) => l.text) }}
            className="aspect-[4/3] w-full"
          />
        )}
        <fieldset disabled={!canWrite} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
          <Field label="Pricing">
            <Select name="pricingMode" defaultValue={product?.pricingMode ?? 'INSTANT'}>
              <option value="INSTANT">Instant, from the rate card</option>
              <option value="QUOTE">By quotation</option>
            </Select>
          </Field>
          <Field label="Rate override per sq ft" optional hint="Leave empty to use the rate card.">
            <MoneyInput name="rateOverride" defaultValue={paiseToRupees(product?.rateOverridePaise)} />
          </Field>
          <Field label="Made in (working days)">
            <TextInput
              name="leadTimeDays"
              type="number"
              min={1}
              max={60}
              defaultValue={product?.leadTimeDays ?? 5}
              required
            />
          </Field>
          <Checkbox name="isFeatured" label="Feature on the home page" defaultChecked={product?.isFeatured} />
          <Checkbox name="isActive" label="Show in the shop" defaultChecked={product?.isActive ?? true} />
          <FormError message={action.error} />
          {canWrite && (
            <Button type="submit" pending={action.pending} className="w-full">
              {product ? 'Save changes' : 'Create product'}
            </Button>
          )}
        </fieldset>
      </aside>
    </form>
  );
}
