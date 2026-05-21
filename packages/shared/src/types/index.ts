import {
  TenantStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  ReservationStatus,
  ReservationSource,
  CustomerSegment,
  DeliveryStatus,
} from '../enums';

export interface Region {
  id: string;
  name: string;
  slug: string;
  countryCode: string;
  countryName: string;
  platformLabel: string;
  timezone: string;
  currencyCode: string;
  currencySymbol: string;
  locale: string;
  isActive: boolean;
}

export interface Tenant {
  id: string;
  regionId: string;
  slug: string;
  name: string;
  status: TenantStatus;
  planId: string;
  settings: Record<string, unknown>;
  trialEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  tenantId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string | null;
  roles: string[];
  iat?: number;
  exp?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface Order {
  id: string;
  tenantId: string;
  orderNumber: string;
  type: OrderType;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  notes: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  tenantId: string;
  method: PaymentMethod;
  amount: number;
  reference: string | null;
  status: PaymentStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Reservation {
  id: string;
  tenantId: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  partySize: number;
  tableId: string | null;
  reservedAt: string;
  durationMin: number;
  status: ReservationStatus;
  source: ReservationSource;
  notes: string | null;
  reminderSent: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  lastVisitAt: string | null;
  segment: CustomerSegment;
  notes: string | null;
  createdAt: string;
}
