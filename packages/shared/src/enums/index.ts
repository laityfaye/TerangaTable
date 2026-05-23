export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  DELETED = 'deleted',
}

export enum OrderType {
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
  ONLINE = 'online',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  MOBILE_MONEY = 'mobile_money',
  ONLINE = 'online',
  VOUCHER = 'voucher',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SEATED = 'seated',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum ReservationSource {
  WEBSITE = 'website',
  PHONE = 'phone',
  WALK_IN = 'walk_in',
  API = 'api',
}

export enum TableShape {
  ROUND = 'round',
  SQUARE = 'square',
  RECT = 'rect',
}

export enum CustomerSegment {
  NEW = 'new',
  REGULAR = 'regular',
  VIP = 'vip',
  INACTIVE = 'inactive',
}

export enum DeliveryStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  EN_ROUTE = 'en_route',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export enum DeliveryZoneType {
  RADIUS = 'radius',
  POLYGON = 'polygon',
}

export enum OptionGroupType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
}

export enum SettingType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
  ARRAY = 'array',
}

export enum CustomFieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  SELECT = 'select',
  TEXT = 'text',
}

export enum ConditionLogic {
  AND = 'AND',
  OR = 'OR',
}

export enum TenantRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  REGIONAL_ADMIN = 'regional_admin',
  OWNER = 'restaurant_owner',
  MANAGER = 'manager',
  SERVEUR = 'serveur',
  CAISSIER = 'caissier',
  CUISINIER = 'cuisinier',
  LIVREUR = 'livreur',
}
