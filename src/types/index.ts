export enum Role {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  CLIENT_USER = 'CLIENT_USER',
  DRIVER = 'DRIVER',
}

export enum VendorType {
  DAIRY = 'DAIRY',
  PHARMA = 'PHARMA',
  STATIONERY = 'STATIONERY',
  FMCG = 'FMCG'
}

export type UserRole = keyof typeof Role;

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role.ADMIN;
};

export type ClientUser = {
  id: string;
  name: string;
  email: string;
  role: Role.CLIENT | Role.CLIENT_USER;
  clientId: string;
  firstLogin?: boolean;
  password?: string;
};

export type DriverUser = {
  id: string;
  name: string;
  email: string;
  role: Role.DRIVER;
  password?: string;
};

export type User = AdminUser | ClientUser | DriverUser;

export const isClientUser = (user: User | null): user is ClientUser => {
  return !!user && (user.role === Role.CLIENT || user.role === Role.CLIENT_USER);
};

export const isAdminUser = (user: User | null): user is AdminUser => {
  return !!user && user.role === Role.ADMIN;
};

export const isDriverUser = (user: User | null): user is DriverUser => {
  return !!user && user.role === Role.DRIVER;
};

export interface Branch {
  id: string;
  name: string;
  address: string;
}

export interface Client {
  id: string;
  clientNumber: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  password?: string;
  firstLogin?: boolean;
  users: User[];
  branches: Branch[];
  isArchived?: boolean;
  archivedAt?: string;
}

export interface Bulletin {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'URGENT' | 'PROMO';
  timestamp: string;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  subcategory?: string;
  unit: string;
  unitValue: number; // New: value per 1 qty (e.g. 50 if 1 qty = 50 liters)
  image: string;
  iconName?: string; // New: Lucide icon name string
  active: boolean;
  moq: number; // Minimum Order Quantity
}

export interface OrderItem {
  productId: string;
  quantity: number;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'ISSUE';

export interface Order {
  id: string;
  clientId: string;
  branchId?: string; // New: link order to specific branch
  placedById: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  deliveryDate: string;
  deliveryConfirmed?: boolean;
  deliveryConfirmedBy?: string;
  deliveryConfirmedAt?: string;
  deliveryImage?: string;
  deliveryIssue?: string;
  auditLog: AuditLogEntry[];
}

export interface AuditLogEntry {
  timestamp: string;
  userId: string;
  action: string;
  details: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
}
