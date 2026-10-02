import type { OrderPaymentStatus, OrderStatus, QuotationStatus } from '@neon-adda/shared';

export interface Lettering {
  fontFamily: string;
  lines: { text: string; glowHex: string; tubeHex?: string }[];
}

export interface AddressSnapshot {
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  stateCode: string;
  pincode: string;
  businessName: string | null;
  gstin: string | null;
}

export interface Activity {
  id: string;
  action: string;
  by: string;
  at: string;
}

export interface AdminOrder {
  orderNo: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  paymentMode: 'FULL' | 'ADVANCE' | 'COD';
  channel: string;
  placedAt: string;
  confirmedAt: string | null;
  expiresAt: string | null;
  cancelReason: string | null;
  installationRequired: boolean;
  customer: { id: string; name: string | null; phone: string | null; email: string | null };
  franchise: { id: string; name: string; code: string; source: string } | null;
  coupon: string | null;
  allowedMoves: OrderStatus[];
  items: {
    id: string;
    description: string;
    widthIn: number;
    heightIn: number;
    billableSqft: number;
    ratePerSqftPaise: number;
    qty: number;
    addons: { label: string; amountPaise: number }[] | null;
    amountPaise: number;
    previewUrl: string | null;
    lettering: Lettering | null;
    proofStatus: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED' | 'SUPERSEDED';
    revisionsUsed: number;
    proofs: {
      id: string;
      version: number;
      imageUrl: string | null;
      designerNote: string | null;
      status: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED' | 'SUPERSEDED';
      customerComment: string | null;
      sentAt: string;
      respondedAt: string | null;
    }[];
  }[];
  totals: {
    itemsPaise: number;
    installationPaise: number;
    deliveryPaise: number;
    discountPaise: number;
    taxablePaise: number;
    cgstPaise: number;
    sgstPaise: number;
    igstPaise: number;
    roundOffPaise: number;
    totalPaise: number;
    paidPaise: number;
    duePaise: number;
    advanceRequiredPaise: number;
  };
  shippingAddress: AddressSnapshot;
  billingAddress: AddressSnapshot;
  customerGstin: string | null;
  shipment: { courierName: string | null; awbNo: string | null; trackingUrl: string | null };
  payments: {
    id: string;
    purpose: string;
    method: string;
    status: string;
    amountPaise: number;
    reference: string | null;
    at: string;
  }[];
  commissions: {
    id: string;
    franchise: string;
    basePaise: number;
    amountPaise: number;
    status: string;
    eligibleAt: string | null;
  }[];
  installation: {
    status: string;
    technicianId: string | null;
    technician: { name: string; phone: string } | null;
    scheduledStart: string | null;
    scheduledEnd: string | null;
    completedAt: string | null;
    notes: string | null;
    failReason: string | null;
    photos: { id: string; stage: string; url: string }[];
  } | null;
  technicians: { id: string; name: string; phone: string; franchise: string | null }[];
  invoices: { invoiceNo: string; type: string; issuedAt: string }[];
  tickets: {
    id: string;
    type: string;
    description: string;
    status: string;
    resolution: string | null;
    at: string;
  }[];
  review: { rating: number; comment: string | null } | null;
  history: { status: OrderStatus; note: string | null; actorType: string; at: string }[];
  activity: Activity[];
}

export interface AdminQuote {
  id: string;
  quoteNo: string;
  version: number;
  isLatest: boolean;
  status: QuotationStatus;
  customer: { id: string; name: string | null; phone: string | null; email: string | null };
  franchise: string | null;
  requestedAt: string;
  request: {
    kind: string;
    widthIn: number | null;
    heightIn: number | null;
    qty: number;
    pincode: string;
    installation: boolean;
    message: string | null;
    estimatePaise: number | null;
  } | null;
  lettering: Lettering | null;
  previewUrl: string | null;
  logoUrl: string | null;
  items: {
    id: string;
    description: string;
    widthIn: number | null;
    heightIn: number | null;
    qty: number;
    amountPaise: number;
  }[];
  totals: {
    subtotalPaise: number;
    discountPaise: number;
    taxablePaise: number;
    cgstPaise: number;
    sgstPaise: number;
    igstPaise: number;
    totalPaise: number;
  };
  validUntil: string | null;
  terms: string | null;
  notes: string | null;
  sentAt: string | null;
  respondedAt: string | null;
  orderNo: string | null;
  versions: {
    id: string;
    version: number;
    status: QuotationStatus;
    totalPaise: number | null;
    sentAt: string | null;
  }[];
  activity: Activity[];
}
