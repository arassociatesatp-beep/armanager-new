/**
 * useFirebaseSync Hook
 * 
 * React hook that subscribes to Firestore collections and syncs data in real-time.
 * Use this to connect your app state to Firebase for cross-device sync.
 */

import { useEffect, useRef, useCallback } from 'react';
import {
    subscribeToCollection,
    addDocument,
    updateDocument,
    deleteDocument,
    isFirebaseConfigured,
} from '../services/firebase';
import type {
    SalesTransaction,
    PaymentTransaction,
    Customer,
    PurchaseTransaction,
    ExpenseTransaction,
    StockItem,
    StockTransaction,
    Account,
    GlobalTransaction
} from '../../types';

// Extended types with Firestore document ID
type WithDocId<T> = T & { _docId?: string };

interface FirebaseSyncOptions<T> {
    onDataChange: (data: T[]) => void;
    orderByField?: string;
}

/**
 * Generic hook to sync a single collection
 */
export function useCollectionSync<T>(
    collectionName: string,
    options: FirebaseSyncOptions<T>
) {
    const { onDataChange, orderByField = 'createdAt' } = options;
    const unsubscribeRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!isFirebaseConfigured()) {
            console.warn(`Firebase not configured. ${collectionName} sync disabled.`);
            return;
        }

        // Subscribe to real-time updates
        const unsubscribe = subscribeToCollection<T>(
            collectionName as any,
            onDataChange,
            orderByField
        );

        unsubscribeRef.current = unsubscribe;

        // Cleanup on unmount
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [collectionName, onDataChange, orderByField]);
}

/**
 * Hook to sync all business data collections
 */
export function useFirebaseSync(handlers: {
    onSalesChange?: (sales: WithDocId<SalesTransaction>[]) => void;
    onPaymentsChange?: (payments: WithDocId<PaymentTransaction>[]) => void;
    onCustomersChange?: (customers: WithDocId<Customer>[]) => void;
    onPurchasesChange?: (purchases: WithDocId<PurchaseTransaction>[]) => void;
    onExpensesChange?: (expenses: WithDocId<ExpenseTransaction>[]) => void;
    onStocksChange?: (stocks: WithDocId<StockItem>[]) => void;
    onStockTransactionsChange?: (transactions: WithDocId<StockTransaction>[]) => void;
    onAccountsChange?: (accounts: WithDocId<Account>[]) => void;
    onGlobalTransactionsChange?: (transactions: WithDocId<GlobalTransaction>[]) => void;
}) {
    const unsubscribesRef = useRef<((() => void) | null)[]>([]);

    useEffect(() => {
        if (!isFirebaseConfigured()) {
            console.warn('Firebase not configured. Real-time sync disabled. Set VITE_FIREBASE_* env variables.');
            return;
        }

        const unsubscribes: ((() => void) | null)[] = [];

        // Subscribe to each collection
        if (handlers.onSalesChange) {
            unsubscribes.push(subscribeToCollection<WithDocId<SalesTransaction>>('sales', handlers.onSalesChange, 'id'));
        }
        if (handlers.onPaymentsChange) {
            unsubscribes.push(subscribeToCollection<WithDocId<PaymentTransaction>>('payments', handlers.onPaymentsChange, 'id'));
        }
        if (handlers.onCustomersChange) {
            unsubscribes.push(subscribeToCollection<WithDocId<Customer>>('customers', handlers.onCustomersChange, 'id'));
        }
        if (handlers.onPurchasesChange) {
            unsubscribes.push(subscribeToCollection<WithDocId<PurchaseTransaction>>('purchases', handlers.onPurchasesChange, 'id'));
        }
        if (handlers.onExpensesChange) {
            unsubscribes.push(subscribeToCollection<WithDocId<ExpenseTransaction>>('expenses', handlers.onExpensesChange, 'id'));
        }
        if (handlers.onStocksChange) {
            unsubscribes.push(subscribeToCollection<WithDocId<StockItem>>('stocks', handlers.onStocksChange, 'id'));
        }
        if (handlers.onStockTransactionsChange) {
            unsubscribes.push(subscribeToCollection<WithDocId<StockTransaction>>('stockTransactions', handlers.onStockTransactionsChange, 'id'));
        }
        if (handlers.onAccountsChange) {
            unsubscribes.push(subscribeToCollection<WithDocId<Account>>('accounts', handlers.onAccountsChange, 'id'));
        }
        if (handlers.onGlobalTransactionsChange) {
            unsubscribes.push(subscribeToCollection<WithDocId<GlobalTransaction>>('globalTransactions', handlers.onGlobalTransactionsChange, 'id'));
        }

        unsubscribesRef.current = unsubscribes;

        // Cleanup all subscriptions on unmount
        return () => {
            unsubscribes.forEach(unsubscribe => {
                if (unsubscribe) unsubscribe();
            });
        };
    }, []); // Empty deps - only subscribe once on mount
}

// ============================================================
// CRUD Helper Functions (use these in your components)
// ============================================================

/**
 * Add a sale to Firestore
 */
export async function addSaleToFirebase(sale: SalesTransaction): Promise<string | null> {
    return addDocument('sales', sale);
}

/**
 * Update a sale in Firestore
 */
export async function updateSaleInFirebase(docId: string, sale: Partial<SalesTransaction>): Promise<boolean> {
    return updateDocument('sales', docId, sale);
}

/**
 * Delete a sale from Firestore
 */
export async function deleteSaleFromFirebase(docId: string): Promise<boolean> {
    return deleteDocument('sales', docId);
}

// Payment CRUD
export async function addPaymentToFirebase(payment: PaymentTransaction): Promise<string | null> {
    return addDocument('payments', payment);
}

export async function updatePaymentInFirebase(docId: string, payment: Partial<PaymentTransaction>): Promise<boolean> {
    return updateDocument('payments', docId, payment);
}

export async function deletePaymentFromFirebase(docId: string): Promise<boolean> {
    return deleteDocument('payments', docId);
}

// Customer CRUD
export async function addCustomerToFirebase(customer: Customer): Promise<string | null> {
    return addDocument('customers', customer);
}

export async function updateCustomerInFirebase(docId: string, customer: Partial<Customer>): Promise<boolean> {
    return updateDocument('customers', docId, customer);
}

// Purchase CRUD
export async function addPurchaseToFirebase(purchase: PurchaseTransaction): Promise<string | null> {
    return addDocument('purchases', purchase);
}

export async function updatePurchaseInFirebase(docId: string, purchase: Partial<PurchaseTransaction>): Promise<boolean> {
    return updateDocument('purchases', docId, purchase);
}

export async function deletePurchaseFromFirebase(docId: string): Promise<boolean> {
    return deleteDocument('purchases', docId);
}

// Expense CRUD
export async function addExpenseToFirebase(expense: ExpenseTransaction): Promise<string | null> {
    return addDocument('expenses', expense);
}

export async function updateExpenseInFirebase(docId: string, expense: Partial<ExpenseTransaction>): Promise<boolean> {
    return updateDocument('expenses', docId, expense);
}

export async function deleteExpenseFromFirebase(docId: string): Promise<boolean> {
    return deleteDocument('expenses', docId);
}

// Stock CRUD
export async function addStockToFirebase(stock: StockItem): Promise<string | null> {
    return addDocument('stocks', stock);
}

export async function updateStockInFirebase(docId: string, stock: Partial<StockItem>): Promise<boolean> {
    return updateDocument('stocks', docId, stock);
}

export async function deleteStockFromFirebase(docId: string): Promise<boolean> {
    return deleteDocument('stocks', docId);
}

// Stock Transaction CRUD
export async function addStockTransactionToFirebase(transaction: StockTransaction): Promise<string | null> {
    return addDocument('stockTransactions', transaction);
}

export async function updateStockTransactionInFirebase(docId: string, transaction: Partial<StockTransaction>): Promise<boolean> {
    return updateDocument('stockTransactions', docId, transaction);
}

export async function deleteStockTransactionFromFirebase(docId: string): Promise<boolean> {
    return deleteDocument('stockTransactions', docId);
}

// Account CRUD
export async function addAccountToFirebase(account: Account): Promise<string | null> {
    return addDocument('accounts', account);
}

export async function updateAccountInFirebase(docId: string, account: Partial<Account>): Promise<boolean> {
    return updateDocument('accounts', docId, account);
}

// Global Transaction CRUD
export async function addGlobalTransactionToFirebase(transaction: GlobalTransaction): Promise<string | null> {
    return addDocument('globalTransactions', transaction);
}
