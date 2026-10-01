import {
  GST_STATES,
  type OrderPaymentStatus,
  type OrderStatus,
  type QuotationStatus,
} from '@neon-adda/shared';
import type { Tone } from '@/components/ui/data';

const dateTime = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});
const date = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
});

export const formatDate = (iso: string | null | undefined) => (iso ? date.format(new Date(iso)) : '');
export const formatDateTime = (iso: string | null | undefined) => (iso ? dateTime.format(new Date(iso)) : '');

/** +919812345678 → 98123 45678 */
export const formatPhone = (phone: string | null | undefined) =>
  phone?.replace(/^\+91(\d{5})(\d{5})$/, '$1 $2') ?? '';

export const stateName = (code: string) => GST_STATES[code as keyof typeof GST_STATES] ?? code;

/** Value for a datetime-local input, in India time. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const ist = new Date(new Date(iso).getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 16);
}

/** A datetime-local value typed in India time, as an ISO instant. */
export const fromLocalInput = (value: string) => (value ? new Date(`${value}:00+05:30`).toISOString() : null);

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  PENDING_PAYMENT: { label: 'Awaiting payment', tone: 'amber' },
  EXPIRED: { label: 'Expired', tone: 'gray' },
  CONFIRMED: { label: 'Confirmed', tone: 'blue' },
  PROOF_PENDING: { label: 'Proof sent', tone: 'violet' },
  PROOF_APPROVED: { label: 'Design approved', tone: 'blue' },
  IN_PRODUCTION: { label: 'In production', tone: 'blue' },
  QUALITY_CHECK: { label: 'Quality check', tone: 'blue' },
  READY_TO_DISPATCH: { label: 'Ready to dispatch', tone: 'blue' },
  SHIPPED: { label: 'Shipped', tone: 'blue' },
  DELIVERED: { label: 'Delivered', tone: 'green' },
  INSTALLED: { label: 'Installed', tone: 'green' },
  COMPLETED: { label: 'Completed', tone: 'green' },
  ON_HOLD: { label: 'On hold', tone: 'red' },
  CANCELLED: { label: 'Cancelled', tone: 'gray' },
};

/** Button labels for moving an order on; phrased as the action, not the state. */
export const MOVE_LABEL: Partial<Record<OrderStatus, string>> = {
  IN_PRODUCTION: 'Start production',
  QUALITY_CHECK: 'Send to quality check',
  READY_TO_DISPATCH: 'Mark ready to dispatch',
  SHIPPED: 'Mark shipped',
  DELIVERED: 'Mark delivered',
  INSTALLED: 'Mark installed',
  COMPLETED: 'Complete order',
  ON_HOLD: 'Put on hold',
  CANCELLED: 'Cancel order',
  EXPIRED: 'Mark expired',
};

export const PAYMENT_STATUS: Record<OrderPaymentStatus, { label: string; tone: Tone }> = {
  UNPAID: { label: 'Unpaid', tone: 'amber' },
  PARTIALLY_PAID: { label: 'Part paid', tone: 'amber' },
  PAID: { label: 'Paid', tone: 'green' },
  PARTIALLY_REFUNDED: { label: 'Part refunded', tone: 'gray' },
  REFUNDED: { label: 'Refunded', tone: 'gray' },
};

export const PAYMENT_METHOD: Record<string, string> = {
  RAZORPAY: 'Online',
  PAYMENT_LINK: 'Payment link',
  UPI_QR: 'UPI QR',
  OFFLINE_CASH: 'Cash',
  OFFLINE_UPI: 'UPI',
  OFFLINE_BANK: 'Bank transfer',
};

export const QUOTE_STATUS: Record<QuotationStatus, { label: string; tone: Tone }> = {
  REQUESTED: { label: 'New request', tone: 'amber' },
  IN_REVIEW: { label: 'Draft', tone: 'blue' },
  SENT: { label: 'Sent', tone: 'violet' },
  CHANGES_REQUESTED: { label: 'Changes asked', tone: 'amber' },
  ACCEPTED: { label: 'Accepted', tone: 'green' },
  REJECTED: { label: 'Declined', tone: 'gray' },
  EXPIRED: { label: 'Expired', tone: 'gray' },
};

export const QUOTE_KIND: Record<string, string> = {
  LOGO: 'Logo sign',
  LARGE: 'Large sign',
  BULK: 'Bulk order',
  CUSTOM: 'Custom',
};

export const PRODUCT_TYPE: Record<string, string> = {
  TEXT_NEON: 'Text neon',
  LOGO_NEON: 'Logo neon',
  READYMADE: 'Ready-made',
  BUSINESS: 'Business signage',
};

export const TICKET_TYPE: Record<string, string> = {
  DAMAGED: 'Arrived damaged',
  NOT_WORKING: 'Not lighting up',
  WRONG_ITEM: 'Wrong item',
  INSTALLATION: 'Installation',
  DELIVERY: 'Delivery',
  OTHER: 'Other',
};

/** Audit actions read as sentences in activity lists. */
export const ACTIVITY: Record<string, string> = {
  'order.status-changed': 'changed the status',
  'order.payment-recorded': 'recorded a payment',
  'order.proof-sent': 'sent a design proof',
  'order.installation-scheduled': 'scheduled the installation',
  'order.ticket-updated': 'updated a help request',
  'quotation.saved': 'saved the quotation',
  'quotation.sent': 'sent the quotation',
  'quotation.declined': 'declined the request',
};

export const FRANCHISE_STATUS = {
  PENDING_KYC: { label: 'Awaiting KYC', tone: 'amber' },
  ACTIVE: { label: 'Active', tone: 'green' },
  SUSPENDED: { label: 'Suspended', tone: 'red' },
} as const satisfies Record<string, { label: string; tone: Tone }>;

export type CommissionStatus = 'PENDING' | 'ELIGIBLE' | 'APPROVED' | 'PAID' | 'REVERSED' | 'ON_HOLD';

export const COMMISSION_STATUS: Record<CommissionStatus, { label: string; tone: Tone }> = {
  PENDING: { label: 'Pending', tone: 'gray' },
  ELIGIBLE: { label: 'Ready to approve', tone: 'amber' },
  APPROVED: { label: 'Approved', tone: 'blue' },
  PAID: { label: 'Paid', tone: 'green' },
  REVERSED: { label: 'Reversed', tone: 'red' },
  ON_HOLD: { label: 'On hold', tone: 'red' },
};
