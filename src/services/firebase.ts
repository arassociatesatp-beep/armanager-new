/**
 * Firebase Configuration and Firestore Service
 * 
 * This module initializes Firebase and provides CRUD operations for Firestore.
 * All data sync operations go through this service.
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import {
    getFirestore,
    Firestore,
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    Timestamp,
    DocumentData,
    QuerySnapshot,
    setDoc,
    getDoc
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration from environment variables (PUBLIC values only)
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// DEBUG: Log what we got from env
console.log('🔧 Firebase Config Debug:', {
    hasApiKey: !!firebaseConfig.apiKey,
    hasProjectId: !!firebaseConfig.projectId,
    projectId: firebaseConfig.projectId || 'NOT SET',
});

// Initialize Firebase
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

/**
 * Initialize Firebase app and services
 */
export function initializeFirebase(): { app: FirebaseApp; db: Firestore; auth: Auth } {
    if (!app) {
        // Check if Firebase config is available
        if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
            console.warn('Firebase config not found. Real-time sync disabled.');
            console.warn('Make sure .env.local has VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID');
            throw new Error('Firebase configuration missing');
        }

        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
    }

    return { app, db: db!, auth: auth! };
}

/**
 * Get Firestore instance
 */
export function getDb(): Firestore | null {
    if (!db) {
        try {
            initializeFirebase();
        } catch {
            return null;
        }
    }
    return db;
}

/**
 * Get Auth instance
 */
export function getAuthInstance(): Auth | null {
    if (!auth) {
        try {
            initializeFirebase();
        } catch {
            return null;
        }
    }
    return auth;
}

// ============================================================
// CRUD Operations
// ============================================================

type CollectionName =
    | 'sales'
    | 'payments'
    | 'customers'
    | 'purchases'
    | 'expenses'
    | 'stocks'
    | 'stockTransactions'
    | 'accounts'
    | 'globalTransactions'
    | 'products'
    | 'reminders'
    | 'settings';

/**
 * Generate a clean document ID from text (removes special characters, spaces → underscores)
 */
function sanitizeForDocId(text: string): string {
    return text
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s_-]/g, '') // Remove special characters
        .replace(/\s+/g, '_')          // Spaces to underscores
        .replace(/_+/g, '_')           // Multiple underscores to single
        .slice(0, 50);                 // Limit length
}

/**
 * Get current date in YYYYMMDD format
 */
function getDateString(dateStr?: string): string {
    if (dateStr) {
        // Parse DD-MM-YYYY format
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}${parts[1]}${parts[0]}`;
        }
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

/**
 * Get month string in YYYY-MM format for filtering
 */
function getMonthString(dateStr?: string): string {
    if (dateStr) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}`;
        }
    }
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get year number for filtering
 */
function getYear(dateStr?: string): number {
    if (dateStr) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return parseInt(parts[2], 10);
        }
    }
    return new Date().getFullYear();
}

/**
 * Generate search terms array from text fields
 */
function generateSearchTerms(...fields: (string | undefined)[]): string[] {
    const terms: string[] = [];
    fields.forEach(field => {
        if (field) {
            const words = field.toLowerCase().split(/[\s•,.-]+/).filter(w => w.length > 1);
            terms.push(...words);
        }
    });
    return [...new Set(terms)]; // Remove duplicates
}

// ============================================================
// Meaningful ID Generators
// ============================================================

/**
 * Generate customer document ID: customer_name
 * Example: "ram_kumar"
 */
export function generateCustomerId(name: string): string {
    return sanitizeForDocId(name);
}

/**
 * Generate product document ID: product_name
 * Example: "jsw_opc"
 */
export function generateProductId(name: string): string {
    return sanitizeForDocId(name);
}

/**
 * Generate sale document ID: customer_product_date_timestamp
 * Example: "ram_kumar_jsw_opc_20241210_1702234567"
 */
export function generateSaleId(customer: string, product: string, date?: string): string {
    const customerPart = sanitizeForDocId(customer).slice(0, 20);
    const productPart = sanitizeForDocId(product.split('•')[0]).slice(0, 15);
    const datePart = getDateString(date);
    const timestamp = Date.now().toString().slice(-6);
    return `${customerPart}_${productPart}_${datePart}_${timestamp}`;
}

/**
 * Generate payment document ID: customer_method_date_timestamp
 * Example: "ram_kumar_cash_20241210_234567"
 */
export function generatePaymentId(customer: string, method: string, date?: string): string {
    const customerPart = sanitizeForDocId(customer).slice(0, 20);
    const methodPart = sanitizeForDocId(method).slice(0, 10);
    const datePart = getDateString(date);
    const timestamp = Date.now().toString().slice(-6);
    return `${customerPart}_${methodPart}_${datePart}_${timestamp}`;
}

/**
 * Generate purchase document ID: vendor_item_date_timestamp
 * Example: "jsw_cement_20241210_234567"
 */
export function generatePurchaseId(vendor: string, item: string, date?: string): string {
    const vendorPart = sanitizeForDocId(vendor).slice(0, 15);
    const itemPart = sanitizeForDocId(item).slice(0, 15);
    const datePart = getDateString(date);
    const timestamp = Date.now().toString().slice(-6);
    return `${vendorPart}_${itemPart}_${datePart}_${timestamp}`;
}

/**
 * Generate expense document ID: vendor_item_date_timestamp
 * Example: "electrician_wiring_20241210_234567"
 */
export function generateExpenseId(vendor: string, item: string, date?: string): string {
    const vendorPart = sanitizeForDocId(vendor).slice(0, 15);
    const itemPart = sanitizeForDocId(item).slice(0, 15);
    const datePart = getDateString(date);
    const timestamp = Date.now().toString().slice(-6);
    return `${vendorPart}_${itemPart}_${datePart}_${timestamp}`;
}

/**
 * Generate stock document ID: shop_name
 * Example: "main_warehouse"
 */
export function generateStockId(shopName: string): string {
    return sanitizeForDocId(shopName);
}

/**
 * Generate stock transaction document ID: shop_type_date_timestamp
 * Example: "main_warehouse_sale_20241210_234567"
 */
export function generateStockTransactionId(shop: string, type: string, date?: string): string {
    const shopPart = sanitizeForDocId(shop).slice(0, 20);
    const typePart = sanitizeForDocId(type).slice(0, 10);
    const datePart = getDateString(date);
    const timestamp = Date.now().toString().slice(-6);
    return `${shopPart}_${typePart}_${datePart}_${timestamp}`;
}

/**
 * Generate account document ID: account_name
 * Example: "hdfc_savings"
 */
export function generateAccountId(name: string): string {
    return sanitizeForDocId(name);
}

/**
 * Generate global transaction document ID: account_type_date_timestamp
 * Example: "hdfc_savings_credit_20241210_234567"
 */
export function generateGlobalTransactionId(accountName: string, type: string, date?: string): string {
    const accountPart = sanitizeForDocId(accountName).slice(0, 20);
    const typePart = sanitizeForDocId(type).slice(0, 10);
    const datePart = getDateString(date);
    const timestamp = Date.now().toString().slice(-6);
    return `${accountPart}_${typePart}_${datePart}_${timestamp}`;
}

// ============================================================
// Filter Metadata Helper
// ============================================================

export interface FilterMetadata {
    _month: string;
    _year: number;
    _searchTerms: string[];
    _category?: string;
    _type?: string;
}

/**
 * Add filter metadata to a document for easy querying
 */
export function addFilterMetadata(
    data: Record<string, any>,
    options?: {
        category?: string;
        type?: string;
        searchFields?: string[];
    }
): Record<string, any> & FilterMetadata {
    const dateField = data.date || data.openingDate;
    const searchFields = options?.searchFields || [];

    // Auto-extract search fields from common data properties
    const autoSearchFields = [
        data.customer,
        data.vendor,
        data.product,
        data.item,
        data.name,
        data.description,
        data.shop,
        data.note
    ].filter(Boolean);

    return {
        ...data,
        _month: getMonthString(dateField),
        _year: getYear(dateField),
        _searchTerms: generateSearchTerms(...autoSearchFields, ...searchFields),
        ...(options?.category && { _category: options.category }),
        ...(options?.type && { _type: options.type })
    };
}

/**
 * Add a new document to a collection
 * @param collectionName - The Firestore collection name
 * @param data - The document data
 * @param customId - Optional custom document ID (if not provided, auto-generates)
 */
export async function addDocument<T extends DocumentData>(
    collectionName: CollectionName,
    data: T,
    customId?: string
): Promise<string | null> {
    const firestore = getDb();
    if (!firestore) return null;

    try {
        const docData = {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        if (customId) {
            // Use custom ID with setDoc
            const sanitizedId = sanitizeForDocId(customId);
            const docRef = doc(firestore, collectionName, sanitizedId);
            await setDoc(docRef, docData);
            return sanitizedId;
        } else {
            // Fall back to auto-generated ID
            const docRef = await addDoc(collection(firestore, collectionName), docData);
            return docRef.id;
        }
    } catch (error) {
        console.error(`Error adding document to ${collectionName}:`, error);
        return null;
    }
}

/**
 * Update an existing document
 */
export async function updateDocument<T extends DocumentData>(
    collectionName: CollectionName,
    documentId: string,
    data: Partial<T>
): Promise<boolean> {
    const firestore = getDb();
    if (!firestore) return false;

    try {
        const docRef = doc(firestore, collectionName, documentId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now(),
        });
        return true;
    } catch (error) {
        console.error(`Error updating document in ${collectionName}:`, error);
        return false;
    }
}

/**
 * Delete a document
 */
export async function deleteDocument(
    collectionName: CollectionName,
    documentId: string
): Promise<boolean> {
    const firestore = getDb();
    if (!firestore) return false;

    try {
        const docRef = doc(firestore, collectionName, documentId);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error(`Error deleting document from ${collectionName}:`, error);
        return false;
    }
}

/**
 * Subscribe to real-time updates from a collection
 * Returns an unsubscribe function
 */
export function subscribeToCollection<T>(
    collectionName: CollectionName,
    callback: (items: T[]) => void,
    orderByField: string = 'createdAt'
): (() => void) | null {
    const firestore = getDb();
    if (!firestore) {
        console.warn(`Cannot subscribe to ${collectionName}: Firebase not initialized`);
        return null;
    }

    try {
        const q = query(
            collection(firestore, collectionName),
            orderBy(orderByField, 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
            const items: T[] = [];
            snapshot.forEach((doc) => {
                items.push({
                    ...doc.data(),
                    _docId: doc.id  // Store Firestore document ID for updates
                } as T);
            });
            callback(items);
        }, (error) => {
            console.error(`Error in ${collectionName} subscription:`, error);
        });

        return unsubscribe;
    } catch (error) {
        console.error(`Error subscribing to ${collectionName}:`, error);
        return null;
    }
}

/**
 * Get or set settings document
 */
export async function getSettings<T extends DocumentData>(): Promise<T | null> {
    const firestore = getDb();
    if (!firestore) return null;

    try {
        const docRef = doc(firestore, 'settings', 'app');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as T;
        }
        return null;
    } catch (error) {
        console.error('Error getting settings:', error);
        return null;
    }
}

export async function updateSettings<T extends DocumentData>(data: Partial<T>): Promise<boolean> {
    const firestore = getDb();
    if (!firestore) return false;

    try {
        const docRef = doc(firestore, 'settings', 'app');
        await setDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now(),
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating settings:', error);
        return false;
    }
}

// ============================================================
// Helper to check if Firebase is configured
// ============================================================
export function isFirebaseConfigured(): boolean {
    return !!(
        import.meta.env.VITE_FIREBASE_API_KEY &&
        import.meta.env.VITE_FIREBASE_PROJECT_ID
    );
}
