import { Package, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Can } from '@/components/can';
import { EmptyState } from '@/components/empty-state';
import { NoAccess } from '@/components/no-access';
import { PageHeader } from '@/components/page-header';
import { SignPreview } from '@/components/sign-preview';
import { Badge, Cell, Pagination, QueueTabs, SearchBox, Table } from '@/components/ui/data';
import { PRODUCT_TYPE } from '@/lib/format';
import { FORBIDDEN, load, query } from '@/lib/load';
import type { Lettering } from '@/lib/types';

export const metadata: Metadata = { title: 'Catalogue' };

interface ProductPage {
  items: {
    id: string;
    name: string;
    slug: string;
    type: string;
    pricingMode: string;
    category: string;
    design: Lettering | null;
    sizes: unknown[];
    isFeatured: boolean;
    isActive: boolean;
    timesOrdered: number;
  }[];
  page: number;
  pages: number;
  total: number;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoryId?: string; page?: string }>;
}) {
  const { q, categoryId, page } = await searchParams;
  const [data, categories] = await Promise.all([
    load<ProductPage>(`/admin/catalog/products${query({ q, categoryId, page })}`),
    load<{ id: string; name: string; products: number }[]>('/admin/catalog/categories'),
  ]);
  if (data === FORBIDDEN || categories === FORBIDDEN)
    return <NoAccess title="Catalogue" permission="orders.read" />;

  return (
    <>
      <PageHeader
        title="Catalogue"
        description="Ready-made signs in the shop, and the custom products behind the studio."
      >
        <div className="flex flex-wrap gap-2">
          <SearchBox action="/catalog" defaultValue={q} placeholder="Name or tag" />
          <Can permission="catalog.write">
            <Link
              href="/catalog/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              <Plus className="size-4" /> New product
            </Link>
          </Can>
        </div>
      </PageHeader>

      <QueueTabs
        active={categoryId ?? ''}
        tabs={[
          { key: '', label: 'All', href: `/catalog${query({ q })}` },
          ...categories.map((c) => ({
            key: c.id,
            label: c.name,
            href: `/catalog${query({ q, categoryId: c.id })}`,
            count: c.products,
          })),
          { key: 'manage', label: 'Edit categories', href: '/catalog/categories' },
        ]}
      />

      {data.items.length === 0 ? (
        <EmptyState icon={Package} title="No products found" body="Add a ready-made design for the shop." />
      ) : (
        <>
          <Table head={['Product', 'Type', 'Category', 'Sizes', 'Ordered', 'Status']}>
            {data.items.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <Cell>
                  <Link href={`/catalog/${p.id}`} className="flex items-center gap-3">
                    <SignPreview previewUrl={null} lettering={p.design} className="h-10 w-14" />
                    <span>
                      <span className="block font-semibold text-gray-900 hover:text-brand">{p.name}</span>
                      <span className="text-xs text-gray-400">/p/{p.slug}</span>
                    </span>
                  </Link>
                </Cell>
                <Cell className="text-gray-600">
                  {PRODUCT_TYPE[p.type]}
                  {p.pricingMode === 'QUOTE' && (
                    <span className="block text-xs text-gray-400">by quotation</span>
                  )}
                </Cell>
                <Cell className="text-gray-600">{p.category}</Cell>
                <Cell className="tabular-nums">{p.sizes.length || '—'}</Cell>
                <Cell className="tabular-nums">{p.timesOrdered}</Cell>
                <Cell>
                  <div className="flex gap-1">
                    <Badge tone={p.isActive ? 'green' : 'gray'}>{p.isActive ? 'Live' : 'Hidden'}</Badge>
                    {p.isFeatured && <Badge tone="pink">Featured</Badge>}
                  </div>
                </Cell>
              </tr>
            ))}
          </Table>
          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            href={(n) => `/catalog${query({ q, categoryId, page: n })}`}
          />
        </>
      )}
    </>
  );
}
