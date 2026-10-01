import type { ReactNode } from 'react';
import { PageHeader } from '@/components/page-header';
import { SubNav } from '@/components/ui/sub-nav';

export default function PricingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader
        title="Pricing"
        description="Everything the storefront charges, set here and nowhere else."
      />
      <SubNav
        links={[
          { href: '/pricing', label: 'Rate card' },
          { href: '/pricing/rules', label: 'Rules and extras' },
          { href: '/pricing/zones', label: 'Delivery and installation' },
          { href: '/pricing/coupons', label: 'Coupons' },
        ]}
      />
      {children}
    </>
  );
}
