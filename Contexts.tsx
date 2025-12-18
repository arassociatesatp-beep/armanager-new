
import React from 'react';
import {
  ThemeColor,
  Account,
  GlobalTransaction,
  SalesTransaction,
  PaymentTransaction,
  Customer,
  PurchaseTransaction,
  ExpenseTransaction,
  StockItem,
  StockTransaction,
  AppSettings,
  Product,
  Reminder
} from './types';

export const ThemeContext = React.createContext<{
  theme: ThemeColor;
  setTheme: (t: ThemeColor) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}>({
  theme: 'green',
  setTheme: () => { },
  isDarkMode: false,
  toggleDarkMode: () => { },
});

export const DataContext = React.createContext<{
  accounts: Account[];
  addAccount: (acc: Account) => void;
  updateAccountBalance: (accountId: number, amount: number) => void;

  globalTransactions: GlobalTransaction[];
  addGlobalTransaction: (tx: GlobalTransaction) => void;
  updateGlobalTransactionByExpenseId: (expenseId: number, newAmount: string, description?: string) => void;
  deleteGlobalTransactionByExpenseId: (expenseId: number) => void;
  deleteGlobalTransactionByPaymentId: (paymentId: number) => void;

  sales: SalesTransaction[];
  addSale: (sale: SalesTransaction) => void;
  updateSale: (sale: SalesTransaction) => void;
  deleteSale: (id: number) => void;

  payments: PaymentTransaction[];
  addPayment: (payment: PaymentTransaction) => void;
  updatePayment: (payment: PaymentTransaction) => void;
  deletePayment: (id: number) => void;

  customers: Customer[];
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;

  purchases: PurchaseTransaction[];
  addPurchase: (purchase: PurchaseTransaction) => void;
  updatePurchase: (purchase: PurchaseTransaction) => void;
  deletePurchase: (id: number) => void;

  expenses: ExpenseTransaction[];
  addExpense: (expense: ExpenseTransaction) => void;
  updateExpense: (expense: ExpenseTransaction) => void;
  deleteExpense: (id: number) => void;

  stocks: StockItem[];
  addStock: (stock: StockItem) => void;
  updateStock: (stock: StockItem) => void;
  deleteStock: (id: number) => void;

  stockTransactions: StockTransaction[];
  addStockTransaction: (tx: StockTransaction) => void;
  updateStockTransaction: (tx: StockTransaction) => void;
  deleteStockTransaction: (id: number) => void;

  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: number) => void;

  reminders: Reminder[];
  addReminder: (reminder: Reminder) => void;
  updateReminder: (reminder: Reminder) => void;
  deleteReminder: (id: number) => void;

  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;

  // Loading state for Firebase data
  dataLoading: boolean;
}>({
  accounts: [],
  addAccount: () => { },
  updateAccountBalance: () => { },
  globalTransactions: [],
  addGlobalTransaction: () => { },
  updateGlobalTransactionByExpenseId: () => { },
  deleteGlobalTransactionByExpenseId: () => { },
  deleteGlobalTransactionByPaymentId: () => { },

  sales: [],
  addSale: () => { },
  updateSale: () => { },
  deleteSale: () => { },

  payments: [],
  addPayment: () => { },
  updatePayment: () => { },
  deletePayment: () => { },

  customers: [],
  addCustomer: () => { },
  updateCustomer: () => { },

  purchases: [],
  addPurchase: () => { },
  updatePurchase: () => { },
  deletePurchase: () => { },

  expenses: [],
  addExpense: () => { },
  updateExpense: () => { },
  deleteExpense: () => { },

  stocks: [],
  addStock: () => { },
  updateStock: () => { },
  deleteStock: () => { },

  stockTransactions: [],
  addStockTransaction: () => { },
  updateStockTransaction: () => { },
  deleteStockTransaction: () => { },

  products: [],
  addProduct: () => { },
  updateProduct: () => { },
  deleteProduct: () => { },

  reminders: [],
  addReminder: () => { },
  updateReminder: () => { },
  deleteReminder: () => { },

  settings: { bagsPerTon: 20 },
  updateSettings: () => { },

  dataLoading: true,
});
