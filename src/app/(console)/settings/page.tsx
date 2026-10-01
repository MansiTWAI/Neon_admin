import { Lock, ShieldCheck, ShieldOff } from 'lucide-react';
import type { Metadata } from 'next';
import { NoAccess } from '@/components/no-access';
import { PageHeader } from '@/components/page-header';
import { CompanyForm, type Company } from '@/components/settings/company-form';
import { InviteStaff, StaffMemberActions } from '@/components/settings/staff-actions';
import { Badge, Card, Cell, Table } from '@/components/ui/data';
import { formatDateTime } from '@/lib/format';
import { FORBIDDEN, load } from '@/lib/load';
import { serverApi } from '@/lib/server-api';

export const metadata: Metadata = { title: 'Settings' };

interface StaffMember {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  locked: boolean;
  lastLoginAt: string | null;
  twoFactorEnabled: boolean;
  roles: { key: string; name: string }[];
}

interface Role {
  key: string;
  name: string;
  members: number;
  permissions: string[];
}

/** Permission groups as staff think about them, for the roles table. */
const AREAS: [string, string[]][] = [
  ['Orders', ['orders.read', 'orders.update', 'payments.write']],
  ['Quotations', ['quotations.read', 'quotations.write']],
  ['Customers and leads', ['customers.read']],
  ['Catalogue', ['catalog.write']],
  ['Pricing', ['pricing.read', 'pricing.write', 'pricing.publish']],
  ['Franchises', ['franchises.read', 'franchises.write']],
  ['Commission', ['commission.read', 'commission.write', 'commission.approve', 'payouts.write']],
  ['Staff and settings', ['users.read', 'users.write', 'settings.write']],
];

export default async function SettingsPage() {
  const [staff, roles, company, me] = await Promise.all([
    load<StaffMember[]>('/admin/staff'),
    load<Role[]>('/admin/roles'),
    load<Company | null>('/admin/settings/company'),
    serverApi.profile(),
  ]);
  if (staff === FORBIDDEN || roles === FORBIDDEN)
    return <NoAccess title="Settings" permission="users.read" />;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Who can use the admin panel, and the company details on invoices."
      />

      <div className="space-y-6">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Staff</h2>
            <InviteStaff roles={roles} />
          </div>
          <Table head={['Name', 'Role', 'Two-factor', 'Last sign-in', '']}>
            {staff.map((member) => (
              <tr key={member.id}>
                <Cell>
                  <p className="font-medium text-gray-900">
                    {member.name}
                    {member.id === me?.id && <span className="ml-2 text-xs text-gray-400">you</span>}
                  </p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </Cell>
                <Cell className="text-gray-700">
                  {member.roles.map((role) => role.name).join(', ')}
                  {member.status === 'BLOCKED' && (
                    <span className="ml-2">
                      <Badge tone="red">Blocked</Badge>
                    </span>
                  )}
                  {member.locked && (
                    <span className="ml-2">
                      <Badge tone="amber">Locked out</Badge>
                    </span>
                  )}
                </Cell>
                <Cell>
                  {member.twoFactorEnabled ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <ShieldCheck className="size-4" /> On
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-700">
                      <ShieldOff className="size-4" /> Not set up
                    </span>
                  )}
                </Cell>
                <Cell className="text-gray-500">{formatDateTime(member.lastLoginAt) || 'Never'}</Cell>
                <Cell>
                  <StaffMemberActions member={member} roles={roles} isSelf={member.id === me?.id} />
                </Cell>
              </tr>
            ))}
          </Table>
        </section>

        <Card title="What each role can do">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs tracking-wide text-gray-500 uppercase">
                  <th className="pb-2 font-medium">Area</th>
                  {roles.map((role) => (
                    <th key={role.key} className="pb-2 font-medium">
                      {role.name}
                      <span className="block font-normal normal-case">{role.members} people</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {AREAS.map(([area, permissions]) => (
                  <tr key={area}>
                    <th scope="row" className="py-2 text-left font-medium text-gray-700">
                      {area}
                    </th>
                    {roles.map((role) => {
                      const has = permissions.filter((p) => role.permissions.includes(p));
                      return (
                        <td key={role.key} className="py-2 text-xs text-gray-600">
                          {has.length === 0 ? (
                            <Lock className="size-3.5 text-gray-300" aria-label="No access" />
                          ) : has.length === permissions.length ? (
                            'Full'
                          ) : (
                            has.map((p) => p.split('.')[1]).join(', ')
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Company details for invoices">
          {company === FORBIDDEN ? (
            <p className="text-sm text-gray-500">You cannot view these.</p>
          ) : (
            <>
              {!company?.gstin && (
                <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Add the company GSTIN before the first order ships; it is printed on every tax invoice.
                </p>
              )}
              <CompanyForm company={company} />
            </>
          )}
        </Card>
      </div>
    </>
  );
}
