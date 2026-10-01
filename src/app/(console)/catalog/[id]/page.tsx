import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductForm, type ProductFormValue } from '@/components/catalog/product-form';
import { NoAccess } from '@/components/no-access';
import { PageHeader } from '@/components/page-header';
import { fetchStudioAssets } from '@/lib/api';
import { STORE_URL } from '@/lib/env';
import { FORBIDDEN, load } from '@/lib/load';

export const metadata: Metadata = { title: 'Product' };

/** Edits a product, or creates one when the id is "new". */
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === 'new';
  const [product, categories, assets] = await Promise.all([
    isNew ? null : load<ProductFormValue>(`/admin/catalog/products/${encodeURIComponent(id)}`),
    load<{ id: string; name: string }[]>('/admin/catalog/categories'),
    fetchStudioAssets(),
  ]);
  if (product === FORBIDDEN || categories === FORBIDDEN)
    return <NoAccess title="Product" permission="orders.read" />;

  return (
    <>
      <Link href="/catalog" className="text-sm text-gray-500 hover:text-gray-900">
        Catalogue
      </Link>
      <PageHeader
        title={product ? product.name : 'New product'}
        description={
          product
            ? undefined
            : 'A ready-made design customers can buy in a click, and open in the studio to change.'
        }
      >
        {product?.type === 'READYMADE' && product.isActive && (
          <a
            href={`${STORE_URL}/p/${product.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-brand hover:underline"
          >
            View in the shop
          </a>
        )}
      </PageHeader>
      <ProductForm key={product?.id ?? 'new'} product={product} categories={categories} assets={assets} />
    </>
  );
}
