import {
  Building2,
  ClipboardList,
  FileText,
  Inbox,
  LayoutDashboard,
  Package,
  Percent,
  Ruler,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface Section {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Hidden from staff without this permission; the API enforces the same rule. */
  permission: string;
}

export const SECTIONS: Section[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.read' },
  { href: '/orders', label: 'Orders', icon: ClipboardList, permission: 'orders.read' },
  { href: '/quotations', label: 'Quotations', icon: FileText, permission: 'quotations.read' },
  { href: '/customers', label: 'Customers', icon: Users, permission: 'customers.read' },
  { href: '/leads', label: 'Leads', icon: Inbox, permission: 'customers.read' },
  { href: '/catalog', label: 'Catalogue', icon: Package, permission: 'orders.read' },
  { href: '/pricing', label: 'Pricing', icon: Ruler, permission: 'pricing.read' },
  { href: '/franchises', label: 'Franchises', icon: Building2, permission: 'franchises.read' },
  { href: '/commission', label: 'Commission', icon: Percent, permission: 'commission.read' },
  { href: '/settings', label: 'Settings', icon: Settings, permission: 'users.read' },
];

export const visibleSections = (permissions: string[]) =>
  SECTIONS.filter((section) => permissions.includes(section.permission));
