import { Lock } from 'lucide-react';
import { EmptyState } from './empty-state';
import { PageHeader } from './page-header';

export function NoAccess({ title, permission }: { title: string; permission: string }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState
        icon={Lock}
        title="Your role does not include this"
        body={`Ask a super admin for the ${permission} permission.`}
      />
    </>
  );
}
