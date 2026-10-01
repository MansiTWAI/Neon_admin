import type { Metadata } from 'next';
import Link from 'next/link';
import { CategoryEditor } from '@/components/catalog/category-editor';
import { NoAccess } from '@/components/no-access';
import { PageHeader } from '@/components/page-header';
import { FORBIDDEN, load } from '@/lib/load';

export const metadata: Metadata = { title: 'Categories' };

export default async function CategoriesPage() {
  const categories =
    await load<Parameters<typeof CategoryEditor>[0]['categories']>('/admin/catalog/categories');
  if (categories === FORBIDDEN) return <NoAccess title="Categories" permission="orders.read" />;

  return (
    <>
      <Link href="/catalog" className="text-sm text-gray-500 hover:text-gray-900">
        Catalogue
      </Link>
      <PageHeader
        title="Categories"
        description="Shop categories. A category only appears in the shop once it has a ready-made product."
      />
      <CategoryEditor categories={categories} />
    </>
  );
}
