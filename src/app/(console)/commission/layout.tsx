import type { ReactNode } from 'react';
import { PageHeader } from '@/components/page-header';
import { SubNav } from '@/components/ui/sub-nav';

export default function CommissionLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader
        title="Commission"
        description="What franchises earn on orders in their area, from accrual on confirmation to payout."
      />
      <SubNav
        links={[
          { href: '/commission', label: 'Ledger' },
          { href: '/commission/payouts', label: 'Payouts' },
          { href: '/commission/rules', label: 'Rules' },
        ]}
      />
      {children}
    </>
  );
}
