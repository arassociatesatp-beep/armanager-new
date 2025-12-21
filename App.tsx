
import React, { useState, useMemo, useEffect, lazy, Suspense, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeColor, SalesTransaction, PaymentTransaction, Customer, PurchaseTransaction, ExpenseTransaction, StockItem, StockTransaction, Account, GlobalTransaction, AppSettings, Product, Reminder } from './types';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import { ThemeContext, DataContext } from './Contexts';

// Firebase imports for real-time sync
import {
  addDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  isFirebaseConfigured,
  updateSettings as updateFirebaseSettings,
  getSettings,
  // ID Generators
  generateCustomerId,
  generateProductId,
  generateSaleId,
  generatePaymentId,
  generatePurchaseId,
  generateExpenseId,
  generateStockId,
  generateStockTransactionId,
  generateAccountId,
  generateGlobalTransactionId,
  // Filter Metadata
  addFilterMetadata
} from '@/src/services/firebase';

// Firebase Auth imports
import { subscribeToAuthState, logOut } from '@/src/services/auth';

// Lazy load all page components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const ProductManagement = lazy(() => import('./components/ProductManagement'));
const SalesPage = lazy(() => import('./components/SalesPage'));
const CustomerPage = lazy(() => import('./components/CustomerPage'));
const PurchasePage = lazy(() => import('./components/PurchasePage'));
const StockPage = lazy(() => import('./components/StockPage'));
const PaymentPage = lazy(() => import('./components/PaymentPage'));
const SettingsPage = lazy(() => import('./components/SettingsPage'));
const ReportsPage = lazy(() => import('./components/ReportsPage'));
const LoginPage = lazy(() => import('./components/LoginPage'));

// Re-export contexts so other components importing from './App' continue to work
export { ThemeContext, DataContext };

// Extended type with Firestore document ID
type WithDocId<T> = T & { _docId?: string };

// Initial Mock Data (used as fallback if Firebase not configured)
const initialAccounts: Account[] = [];

const initialGlobalTransactions: GlobalTransaction[] = [];

const initialSalesList: SalesTransaction[] = [];

const initialPaymentsList: PaymentTransaction[] = [];

const initialCustomers: Customer[] = [];

const initialPurchases: PurchaseTransaction[] = [];

const initialExpenses: ExpenseTransaction[] = [];

const initialStocks: StockItem[] = [];

const initialStockTransactions: StockTransaction[] = [];

const initialProducts: Product[] = [];

export default function App() {
  const [theme, setTheme] = useState<ThemeColor>('green');
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const [firebaseReady, setFirebaseReady] = useState(false);

  // Data loading state - tracks when Firebase data has been received
  const [dataLoading, setDataLoading] = useState(true);
  const [loadedCollections, setLoadedCollections] = useState<Set<string>>(new Set());
  const TOTAL_COLLECTIONS = 11; // sales, payments, customers, purchases, expenses, stocks, stockTransactions, accounts, globalTransactions, products, reminders

  // Authentication State - Check localStorage on mount (fallback for demo mode)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [authLoading, setAuthLoading] = useState(true);

  // Firebase Auth State Subscription
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      if (user) {
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
      } else if (isFirebaseConfigured()) {
        // Only auto-logout if Firebase is configured (not demo mode)
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
      }
      setAuthLoading(false);
    });

    // If Firebase not available, just use localStorage
    if (!unsubscribe) {
      setAuthLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Shared Data State (with _docId for Firestore updates)
  const [accounts, setAccounts] = useState<WithDocId<Account>[]>(initialAccounts);
  const [globalTransactions, setGlobalTransactions] = useState<WithDocId<GlobalTransaction>[]>(initialGlobalTransactions);
  const [settings, setSettings] = useState<AppSettings>({ bagsPerTon: 20 });
  const [sales, setSales] = useState<WithDocId<SalesTransaction>[]>(initialSalesList);
  const [payments, setPayments] = useState<WithDocId<PaymentTransaction>[]>(initialPaymentsList);
  const [customers, setCustomers] = useState<WithDocId<Customer>[]>(initialCustomers);
  const [purchases, setPurchases] = useState<WithDocId<PurchaseTransaction>[]>(initialPurchases);
  const [expenses, setExpenses] = useState<WithDocId<ExpenseTransaction>[]>(initialExpenses);
  const [stocks, setStocks] = useState<WithDocId<StockItem>[]>(initialStocks);
  const [stockTransactions, setStockTransactions] = useState<WithDocId<StockTransaction>[]>(initialStockTransactions);
  const [products, setProducts] = useState<WithDocId<Product>[]>(initialProducts);
  const [reminders, setReminders] = useState<WithDocId<Reminder>[]>([]);

  // Firebase Real-time Sync - ONLY after authentication is confirmed
  useEffect(() => {
    // Don't set up subscriptions until auth is ready
    if (authLoading) {
      console.log('⏳ Waiting for auth to complete before subscribing...');
      return;
    }

    // If not authenticated, don't subscribe to Firestore (rules will reject)
    if (!isAuthenticated) {
      console.log('🔒 Not authenticated, skipping Firestore subscriptions');
      setDataLoading(false);
      return;
    }

    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured. Using local state only.');
      setDataLoading(false);
      return;
    }

    console.log('🔥 Auth confirmed, setting up Firebase real-time sync...');
    setFirebaseReady(true);
    setDataLoading(true); // Reset loading state when setting up new subscriptions

    const unsubscribes: (() => void)[] = [];

    // Helper to mark collection as loaded
    const markLoaded = (name: string) => {
      setLoadedCollections(prev => {
        const next = new Set(prev);
        next.add(name);
        return next;
      });
    };

    // Subscribe to all collections - order by createdAt (auto-added on document creation)
    const salesUnsub = subscribeToCollection<WithDocId<SalesTransaction>>('sales', (data) => {
      setSales(data);
      markLoaded('sales');
    }, 'createdAt');
    if (salesUnsub) unsubscribes.push(salesUnsub);

    const paymentsUnsub = subscribeToCollection<WithDocId<PaymentTransaction>>('payments', (data) => {
      setPayments(data);
      markLoaded('payments');
    }, 'createdAt');
    if (paymentsUnsub) unsubscribes.push(paymentsUnsub);

    const customersUnsub = subscribeToCollection<WithDocId<Customer>>('customers', (data) => {
      setCustomers(data);
      markLoaded('customers');
    }, 'createdAt');
    if (customersUnsub) unsubscribes.push(customersUnsub);

    const purchasesUnsub = subscribeToCollection<WithDocId<PurchaseTransaction>>('purchases', (data) => {
      setPurchases(data);
      markLoaded('purchases');
    }, 'createdAt');
    if (purchasesUnsub) unsubscribes.push(purchasesUnsub);

    const expensesUnsub = subscribeToCollection<WithDocId<ExpenseTransaction>>('expenses', (data) => {
      setExpenses(data);
      markLoaded('expenses');
    }, 'createdAt');
    if (expensesUnsub) unsubscribes.push(expensesUnsub);

    const stocksUnsub = subscribeToCollection<WithDocId<StockItem>>('stocks', (data) => {
      setStocks(data);
      markLoaded('stocks');
    }, 'createdAt');
    if (stocksUnsub) unsubscribes.push(stocksUnsub);

    const stockTxUnsub = subscribeToCollection<WithDocId<StockTransaction>>('stockTransactions', (data) => {
      setStockTransactions(data);
      markLoaded('stockTransactions');
    }, 'createdAt');
    if (stockTxUnsub) unsubscribes.push(stockTxUnsub);

    const accountsUnsub = subscribeToCollection<WithDocId<Account>>('accounts', (data) => {
      setAccounts(data);
      markLoaded('accounts');
    }, 'createdAt');
    if (accountsUnsub) unsubscribes.push(accountsUnsub);

    const globalTxUnsub = subscribeToCollection<WithDocId<GlobalTransaction>>('globalTransactions', (data) => {
      setGlobalTransactions(data);
      markLoaded('globalTransactions');
    }, 'createdAt');
    if (globalTxUnsub) unsubscribes.push(globalTxUnsub);

    const productsUnsub = subscribeToCollection<WithDocId<Product>>('products', (data) => {
      setProducts(data);
      markLoaded('products');
    }, 'createdAt');
    if (productsUnsub) unsubscribes.push(productsUnsub);

    const remindersUnsub = subscribeToCollection<WithDocId<Reminder>>('reminders', (data) => {
      setReminders(data);
      markLoaded('reminders');
    }, 'createdAt');
    if (remindersUnsub) unsubscribes.push(remindersUnsub);

    // Load settings
    getSettings<AppSettings>().then(savedSettings => {
      if (savedSettings) setSettings(savedSettings);
    });

    // Cleanup subscriptions on unmount or when auth changes
    return () => {
      console.log('🔌 Cleaning up Firebase subscriptions');
      unsubscribes.forEach(unsub => unsub());
      setLoadedCollections(new Set()); // Reset loaded collections on cleanup
    };
  }, [authLoading, isAuthenticated]); // Re-run when auth state changes

  // Check if all collections are loaded
  useEffect(() => {
    if (loadedCollections.size >= TOTAL_COLLECTIONS) {
      setDataLoading(false);
      console.log('✅ All Firebase collections loaded');
    }
  }, [loadedCollections]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  // Data Context Handlers - Now sync with Firebase
  const addAccount = async (acc: Account) => {
    // Add to Firebase (local state updates via real-time listener)
    if (firebaseReady) {
      const customId = generateAccountId(acc.name);
      const dataWithMeta = addFilterMetadata(acc, { type: acc.type });
      await addDocument('accounts', dataWithMeta, customId);
    } else {
      setAccounts(prev => [...prev, acc]);
    }
  };

  const updateAccountBalance = async (accountId: number, amount: number) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;

    const currentBalance = parseFloat(account.balance.replace(/,/g, ''));
    const newBalance = currentBalance + amount;
    const updatedAccount = { ...account, balance: newBalance.toLocaleString() };

    if (firebaseReady && account._docId) {
      await updateDocument('accounts', account._docId, { balance: updatedAccount.balance });
    } else {
      setAccounts(prev => prev.map(acc => acc.id === accountId ? updatedAccount : acc));
    }
  };

  const addGlobalTransaction = async (tx: GlobalTransaction) => {
    if (firebaseReady) {
      // Find account name for meaningful ID
      const account = accounts.find(a => a.id === tx.accountId);
      const accountName = account?.name || 'unknown';
      const customId = generateGlobalTransactionId(accountName, tx.type, tx.date);
      const dataWithMeta = addFilterMetadata(tx, { category: tx.category, type: tx.type });
      await addDocument('globalTransactions', dataWithMeta, customId);
    } else {
      setGlobalTransactions(prev => [tx, ...prev]);
    }
    // Also update the balance when a transaction is added
    const amount = parseFloat(tx.amount.replace(/,/g, ''));
    updateAccountBalance(tx.accountId, tx.type === 'Credit' ? amount : -amount);
  };

  // Update globalTransaction by expenseId (for syncing amount when expense is edited)
  const updateGlobalTransactionByExpenseId = async (expenseId: number, newAmount: string, description?: string) => {
    const tx = globalTransactions.find(t => (t as any).expenseId === expenseId) as WithDocId<GlobalTransaction> | undefined;
    if (!tx) return;

    const updatedTx = { ...tx, amount: newAmount, ...(description && { description }) };

    if (firebaseReady && tx._docId) {
      const { _docId, ...txData } = updatedTx;
      await updateDocument('globalTransactions', _docId, txData);
    } else {
      setGlobalTransactions(prev => prev.map(t => (t as any).expenseId === expenseId ? updatedTx : t));
    }
  };

  // Delete globalTransaction by expenseId (for syncing when expense is deleted)
  const deleteGlobalTransactionByExpenseId = async (expenseId: number) => {
    const tx = globalTransactions.find(t => (t as any).expenseId === expenseId) as WithDocId<GlobalTransaction> | undefined;
    if (!tx) return;

    if (firebaseReady && tx._docId) {
      await deleteDocument('globalTransactions', tx._docId);
    } else {
      setGlobalTransactions(prev => prev.filter(t => (t as any).expenseId !== expenseId));
    }
  };

  // Delete globalTransaction by paymentId (for syncing when payment is deleted)
  const deleteGlobalTransactionByPaymentId = async (paymentId: number) => {
    const tx = globalTransactions.find(t => (t as any).paymentId === paymentId) as WithDocId<GlobalTransaction> | undefined;
    if (!tx) return;

    if (firebaseReady && tx._docId) {
      await deleteDocument('globalTransactions', tx._docId);
    } else {
      setGlobalTransactions(prev => prev.filter(t => (t as any).paymentId !== paymentId));
    }
    // Reverse the account balance change
    const amount = parseFloat(tx.amount.replace(/,/g, ''));
    await updateAccountBalance(tx.accountId, tx.type === 'Credit' ? -amount : amount);
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (firebaseReady) {
      await updateFirebaseSettings(updated);
    }
  };

  // Sales CRUD - Firebase synced
  const addSale = async (sale: SalesTransaction) => {
    if (firebaseReady) {
      const customId = generateSaleId(sale.customer, sale.product, sale.date);
      const dataWithMeta = addFilterMetadata(sale, { type: 'Sale' });
      await addDocument('sales', dataWithMeta, customId);
    } else {
      setSales(prev => [sale, ...prev]);
    }
  };

  const updateSale = async (sale: SalesTransaction & { _docId?: string }) => {
    if (firebaseReady && sale._docId) {
      const { _docId, ...saleData } = sale;
      await updateDocument('sales', _docId, saleData);
    } else {
      setSales(prev => prev.map(s => s.id === sale.id ? sale : s));
    }
  };

  const deleteSale = async (id: number) => {
    const sale = sales.find(s => s.id === id);
    if (firebaseReady && sale?._docId) {
      await deleteDocument('sales', sale._docId);
    } else {
      setSales(prev => prev.filter(s => s.id !== id));
    }
  };

  // Payments CRUD - Firebase synced
  const addPayment = async (payment: PaymentTransaction) => {
    if (firebaseReady) {
      const customId = generatePaymentId(payment.customer, payment.method, payment.date);
      const dataWithMeta = addFilterMetadata(payment, { type: 'Payment' });
      await addDocument('payments', dataWithMeta, customId);
    } else {
      setPayments(prev => [payment, ...prev]);
    }
  };

  const updatePayment = async (payment: PaymentTransaction & { _docId?: string }) => {
    if (firebaseReady && payment._docId) {
      const { _docId, ...paymentData } = payment;
      await updateDocument('payments', _docId, paymentData);
    } else {
      setPayments(prev => prev.map(p => p.id === payment.id ? payment : p));
    }
  };

  const deletePayment = async (id: number) => {
    const payment = payments.find(p => p.id === id);
    if (firebaseReady && payment?._docId) {
      await deleteDocument('payments', payment._docId);
    } else {
      setPayments(prev => prev.filter(p => p.id !== id));
    }
    // Also delete the linked globalTransaction and reverse balance
    await deleteGlobalTransactionByPaymentId(id);
  };

  // Customers CRUD - Firebase synced
  const addCustomer = async (customer: Customer) => {
    if (firebaseReady) {
      const customId = generateCustomerId(customer.name);
      const dataWithMeta = addFilterMetadata(customer, { category: customer.category });
      await addDocument('customers', dataWithMeta, customId);
    } else {
      setCustomers(prev => [customer, ...prev]);
    }
  };

  const updateCustomer = async (customer: Customer & { _docId?: string }) => {
    if (firebaseReady && customer._docId) {
      const { _docId, ...customerData } = customer;
      await updateDocument('customers', _docId, customerData);
    } else {
      setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
    }
  };

  // Purchases CRUD - Firebase synced
  const addPurchase = async (purchase: PurchaseTransaction) => {
    if (firebaseReady) {
      const customId = generatePurchaseId(purchase.vendor, purchase.item, purchase.date);
      const dataWithMeta = addFilterMetadata(purchase, { category: purchase.subCategory, type: 'Purchase' });
      await addDocument('purchases', dataWithMeta, customId);
    } else {
      setPurchases(prev => [purchase, ...prev]);
    }
  };

  const updatePurchase = async (purchase: PurchaseTransaction & { _docId?: string }) => {
    if (firebaseReady && purchase._docId) {
      const { _docId, ...purchaseData } = purchase;
      await updateDocument('purchases', _docId, purchaseData);
    } else {
      setPurchases(prev => prev.map(p => p.id === purchase.id ? purchase : p));
    }
  };

  const deletePurchase = async (id: number) => {
    const purchase = purchases.find(p => p.id === id) as WithDocId<PurchaseTransaction> | undefined;
    if (firebaseReady && purchase?._docId) {
      await deleteDocument('purchases', purchase._docId);
    } else {
      setPurchases(prev => prev.filter(p => p.id !== id));
    }
  };

  // Expenses CRUD - Firebase synced
  const addExpense = async (expense: ExpenseTransaction) => {
    if (firebaseReady) {
      const customId = generateExpenseId(expense.vendor, expense.item, expense.date);
      const dataWithMeta = addFilterMetadata(expense, { type: 'Expense' });
      await addDocument('expenses', dataWithMeta, customId);
    } else {
      setExpenses(prev => [expense, ...prev]);
    }
  };

  const updateExpense = async (expense: ExpenseTransaction & { _docId?: string }) => {
    if (firebaseReady && expense._docId) {
      const { _docId, ...expenseData } = expense;
      await updateDocument('expenses', _docId, expenseData);
    } else {
      setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
    }
  };

  const deleteExpense = async (id: number) => {
    const expense = expenses.find(e => e.id === id) as WithDocId<ExpenseTransaction> | undefined;
    if (firebaseReady && expense?._docId) {
      await deleteDocument('expenses', expense._docId);
    } else {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  // Stocks CRUD - Firebase synced
  const addStock = async (stock: StockItem) => {
    if (firebaseReady) {
      const customId = generateStockId(stock.shop);
      const dataWithMeta = addFilterMetadata(stock);
      await addDocument('stocks', dataWithMeta, customId);
    } else {
      setStocks(prev => [...prev, stock]);
    }
  };

  const updateStock = async (stock: StockItem & { _docId?: string }) => {
    if (firebaseReady && stock._docId) {
      const { _docId, ...stockData } = stock;
      await updateDocument('stocks', _docId, stockData);
    } else {
      setStocks(prev => prev.map(s => s.id === stock.id ? stock : s));
    }
  };

  const deleteStock = async (id: number) => {
    const stock = stocks.find(s => s.id === id) as WithDocId<StockItem> | undefined;
    if (firebaseReady && stock?._docId) {
      await deleteDocument('stocks', stock._docId);
    } else {
      setStocks(prev => prev.filter(s => s.id !== id));
    }
  };

  // Stock Transactions CRUD - Firebase synced
  const addStockTransaction = async (transaction: StockTransaction) => {
    if (firebaseReady) {
      // Find shop name for meaningful ID
      const stock = stocks.find(s => s.id === transaction.shopId);
      const shopName = stock?.shop || 'unknown';
      const customId = generateStockTransactionId(shopName, transaction.type, transaction.date);
      const dataWithMeta = addFilterMetadata(transaction, { type: transaction.type });
      await addDocument('stockTransactions', dataWithMeta, customId);
    } else {
      setStockTransactions(prev => [transaction, ...prev]);
    }
  };

  const updateStockTransaction = async (transaction: StockTransaction & { _docId?: string }) => {
    if (firebaseReady && transaction._docId) {
      const { _docId, ...transactionData } = transaction;
      await updateDocument('stockTransactions', _docId, transactionData);
    } else {
      setStockTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
    }
  };

  const deleteStockTransaction = async (id: number) => {
    const transaction = stockTransactions.find(t => t.id === id) as WithDocId<StockTransaction> | undefined;
    if (firebaseReady && transaction?._docId) {
      await deleteDocument('stockTransactions', transaction._docId);
    } else {
      setStockTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  // Products CRUD - Firebase synced
  const addProduct = async (product: Product) => {
    if (firebaseReady) {
      const customId = generateProductId(product.name);
      const dataWithMeta = addFilterMetadata(product, { category: product.category });
      await addDocument('products', dataWithMeta, customId);
    } else {
      setProducts(prev => [...prev, product]);
    }
  };

  const updateProductItem = async (product: Product & { _docId?: string }) => {
    if (firebaseReady && product._docId) {
      const { _docId, ...productData } = product;
      await updateDocument('products', _docId, productData);
    } else {
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    }
  };

  const deleteProduct = async (id: number) => {
    const product = products.find(p => p.id === id) as WithDocId<Product> | undefined;
    if (firebaseReady && product?._docId) {
      await deleteDocument('products', product._docId);
    } else {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  // Reminders CRUD - Firebase synced
  const addReminder = async (reminder: Reminder) => {
    if (firebaseReady) {
      const customId = `reminder_${sanitizeForDocId(reminder.customer)}_${reminder.id}`;
      const dataWithMeta = addFilterMetadata(reminder, { type: reminder.status });
      await addDocument('reminders', dataWithMeta, customId);
    } else {
      setReminders(prev => [...prev, reminder]);
    }
  };

  const updateReminder = async (reminder: Reminder & { _docId?: string }) => {
    if (firebaseReady && reminder._docId) {
      const { _docId, ...reminderData } = reminder;
      await updateDocument('reminders', _docId, reminderData);
    } else {
      setReminders(prev => prev.map(r => r.id === reminder.id ? reminder : r));
    }
  };

  const deleteReminder = async (id: number) => {
    const reminder = reminders.find(r => r.id === id) as WithDocId<Reminder> | undefined;
    if (firebaseReady && reminder?._docId) {
      await deleteDocument('reminders', reminder._docId);
    } else {
      setReminders(prev => prev.filter(r => r.id !== id));
    }
  };

  // Helper function for reminder IDs
  const sanitizeForDocId = (text: string): string => {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 50);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogout = async () => {
    // Use Firebase logout if available
    if (isFirebaseConfigured()) {
      await logOut();
    }
    // Always clear local state
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  const value = useMemo(() => ({
    theme,
    setTheme,
    isDarkMode,
    toggleDarkMode
  }), [theme, isDarkMode]);

  const dataValue = {
    accounts,
    addAccount,
    updateAccountBalance,
    globalTransactions,
    addGlobalTransaction,
    updateGlobalTransactionByExpenseId,
    deleteGlobalTransactionByExpenseId,
    deleteGlobalTransactionByPaymentId,
    settings,
    updateSettings,
    sales,
    addSale,
    updateSale,
    deleteSale,
    payments,
    addPayment,
    updatePayment,
    deletePayment,
    customers,
    addCustomer,
    updateCustomer,
    purchases,
    addPurchase,
    updatePurchase,
    deletePurchase,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    stocks,
    addStock,
    updateStock,
    deleteStock,
    stockTransactions,
    addStockTransaction,
    updateStockTransaction,
    deleteStockTransaction,
    products,
    addProduct,
    updateProduct: updateProductItem,
    deleteProduct,
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
    dataLoading
  };



  // Loading fallback component
  const LoadingFallback = () => (
    <div className={`flex items-center justify-center h-screen ${isDarkMode ? 'bg-black' : 'bg-[#f9fafb]'}`}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-t-green-500 border-green-200 rounded-full animate-spin"></div>
        <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Loading...</p>
      </div>
    </div>
  );

  return (
    <ThemeContext.Provider value={value}>
      <DataContext.Provider value={dataValue}>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public Route */}
              <Route
                path="/login"
                element={
                  isAuthenticated ?
                    <Navigate to="/dashboard" replace /> :
                    <LoginPage onLogin={handleLogin} />
                }
              />

              {/* Protected Routes */}
              <Route
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <DashboardLayout onLogout={handleLogout} />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/products" element={<ProductManagement />} />
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/customers" element={<CustomerPage />} />
                <Route path="/purchase" element={<PurchasePage />} />
                <Route path="/stocks" element={<StockPage />} />
                <Route path="/payments" element={<PaymentPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              {/* Redirect root to dashboard or login */}
              <Route
                path="/"
                element={
                  <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
                }
              />

              {/* 404 Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </DataContext.Provider>
    </ThemeContext.Provider>
  );
}
