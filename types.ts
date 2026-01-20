export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Discontinued';
  lastUpdated: string;
}

// NEW: Independent Master Data for Reject Module
export interface RejectMasterItem {
  id: string;
  name: string;
  sku: string;
  defaultUnit: string;
  category: string;
}

// NEW: User Management Types
export type UserRole = 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  lastActive: string;
  status: 'ACTIVE' | 'INACTIVE';
}

// NEW: Media Player Types
export interface PlaylistItem {
  id: string;
  title: string;
  url: string;
  videoId: string;
}

export interface KPIMetric {
  title: string;
  value: string | number;
  change: number; // percentage
  trend: 'up' | 'down' | 'neutral';
  color: 'teal' | 'purple' | 'orange' | 'pink';
  iconName: string;
}

export interface DashboardStats {
  totalValue: number;
  totalItems: number;
  lowStockCount: number;
  topCategory: string;
}

export interface UnitDefinition {
  name: string;
  ratio: number;
}

export interface CartItem extends InventoryItem {
  cartId: string;
  selectedUnit: UnitDefinition;
  orderQuantity: number;
}

export interface TransactionRecord {
  id: string;
  date: string; // ISO String
  type: 'IN' | 'OUT';
  items: CartItem[];
  totalUnits: number;
  referenceNumber: string; // PO or Delivery Note
  notes: string;
  photos: string[];
}

// Specific Item structure for Reject Cart (Decoupled from InventoryItem)
export interface RejectCartItem extends RejectMasterItem {
  cartId: string;
  selectedUnit: UnitDefinition;
  orderQuantity: number;
}

export interface RejectRecord {
  id: string;
  date: string;
  outletName: string;
  items: RejectCartItem[];
  totalItems: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  TRANSACTION = 'TRANSACTION',
  HISTORY = 'HISTORY',
  AI_INSIGHTS = 'AI_INSIGHTS',
  REJECT = 'REJECT',
  SETTINGS = 'SETTINGS'
}