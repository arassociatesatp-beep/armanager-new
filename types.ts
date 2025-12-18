
export type ThemeColor = 'rose' | 'blue' | 'green' | 'orange' | 'red' | 'violet' | 'yellow' | 'neutral';

export interface ThemeConfig {
  name: string;
  primary: string; // Hex for charts/JS
  twText: string; // Tailwind text class
  twBg: string; // Tailwind bg class
  twBorder: string; // Tailwind border class
  twRing: string; // Tailwind ring class
  twGradientFrom: string; // Tailwind gradient from class
  twBadgeBg: string; // Tailwind light bg for badges
  twBadgeText: string; // Tailwind text for badges
}

export const THEMES: Record<ThemeColor, ThemeConfig> = {
  rose: {
    name: 'Rose',
    primary: '#f43f5e',
    twText: 'text-rose-500',
    twBg: 'bg-rose-500',
    twBorder: 'border-rose-500',
    twRing: 'ring-rose-500',
    twGradientFrom: 'from-rose-500',
    twBadgeBg: 'bg-rose-500/10',
    twBadgeText: 'text-rose-400',
  },
  blue: {
    name: 'Blue',
    primary: '#3b82f6',
    twText: 'text-blue-500',
    twBg: 'bg-blue-500',
    twBorder: 'border-blue-500',
    twRing: 'ring-blue-500',
    twGradientFrom: 'from-blue-500',
    twBadgeBg: 'bg-blue-500/10',
    twBadgeText: 'text-blue-400',
  },
  green: {
    name: 'Green',
    primary: '#22c55e',
    twText: 'text-green-500',
    twBg: 'bg-green-500',
    twBorder: 'border-green-500',
    twRing: 'ring-green-500',
    twGradientFrom: 'from-green-500',
    twBadgeBg: 'bg-green-500/10',
    twBadgeText: 'text-green-400',
  },
  orange: {
    name: 'Orange',
    primary: '#f97316',
    twText: 'text-orange-500',
    twBg: 'bg-orange-500',
    twBorder: 'border-orange-500',
    twRing: 'ring-orange-500',
    twGradientFrom: 'from-orange-500',
    twBadgeBg: 'bg-orange-500/10',
    twBadgeText: 'text-orange-400',
  },
  red: {
    name: 'Red',
    primary: '#ef4444',
    twText: 'text-red-500',
    twBg: 'bg-red-500',
    twBorder: 'border-red-500',
    twRing: 'ring-red-500',
    twGradientFrom: 'from-red-500',
    twBadgeBg: 'bg-red-500/10',
    twBadgeText: 'text-red-400',
  },
  violet: {
    name: 'Violet',
    primary: '#8b5cf6',
    twText: 'text-violet-500',
    twBg: 'bg-violet-500',
    twBorder: 'border-violet-500',
    twRing: 'ring-violet-500',
    twGradientFrom: 'from-violet-500',
    twBadgeBg: 'bg-violet-500/10',
    twBadgeText: 'text-violet-400',
  },
  yellow: {
    name: 'Yellow',
    primary: '#eab308',
    twText: 'text-yellow-500',
    twBg: 'bg-yellow-500',
    twBorder: 'border-yellow-500',
    twRing: 'ring-yellow-500',
    twGradientFrom: 'from-yellow-500',
    twBadgeBg: 'bg-yellow-500/10',
    twBadgeText: 'text-yellow-400',
  },
  neutral: {
    name: 'Neutral',
    primary: '#ffffff',
    twText: 'text-white',
    twBg: 'bg-white',
    twBorder: 'border-white',
    twRing: 'ring-white',
    twGradientFrom: 'from-white',
    twBadgeBg: 'bg-white/10',
    twBadgeText: 'text-white',
  }
};

export interface SalesTransaction {
  id: number;
  customerId?: string; // Stable reference to customer by ID (preferred for linking)
  customer: string;    // Customer name for display purposes
  product: string;
  date: string;
  amount: string;
  pricePerBag: string;         // Selling price per unit (renamed from 'rate')
  purchasePrice?: string;      // Original purchase cost per unit (renamed from 'purchaseRate')
  type: 'Sale';
  note?: string;
}

export interface PaymentTransaction {
  id: number;
  customerId?: string; // Stable reference to customer by ID (preferred for linking)
  customer: string;    // Customer name for display purposes
  method: string;
  date: string;
  amount: string;
  type: 'Payment';
  note?: string;
  accountId?: number;
  isGandhi?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  registerDate: string;
  email: string;
  openingBalance: string;
  openingBalanceDate: string; // Date of the opening balance
  category: string;
}

export interface PurchaseTransaction {
  id: number;
  vendor: string;
  item: string;
  subCategory: string;
  quantity: string;
  billedQuantity: string;
  unit: string;
  date: string;
  amount: string;
  type: 'Purchase';
  note?: string;
  vehicleNumber?: string;
}

export interface ExpenseTransaction {
  id: number;
  vendor: string;
  item: string;
  date: string;
  amount: string;
  type: 'Expense';
  note?: string;
  accountId?: number; // Track which account was debited for reversal
}

export interface StockItem {
  id: number;
  shop: string;
  quantity: string;
  unit: string;
  threshold: string;
  status: string;
}

export interface StockTransaction {
  id: number;
  shopId: number;
  type: 'Sale' | 'Dump' | 'Add Stock' | 'Transfer In' | 'Transfer Out';
  quantity: string;
  unit: string;
  date: string;
  amount: string;
  price: string;
  purchasePrice: string;
  customer: string;
  product: string;
  note?: string;
}

// Data Context Shared Types
export interface Account {
  id: number;
  name: string;
  type: string;
  balance: string;
  accountNumber: string;
  openingBalance: string; // Track opening balance separately
  openingDate: string;
}

export interface GlobalTransaction {
  id: number;
  accountId: number;
  type: 'Credit' | 'Debit';
  amount: string;
  date: string;
  description: string;
  category: string;
  expenseId?: number; // Link to the expense that created this transaction
  paymentId?: number; // Link to the payment that created this transaction
}

export interface AppSettings {
  bagsPerTon: number;
  reportsPassword?: string; // Password to lock Reports page (optional)
}

export interface Product {
  id: number;
  name: string;
  category: string;
}

export interface Reminder {
  id: number;
  customer: string;
  amount: string;
  dueDate: string;
  status: 'Overdue' | 'Upcoming';
  isCompleted?: boolean;
}
