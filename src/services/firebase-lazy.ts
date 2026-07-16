/**
 * Firebase Lazy Loader
 * 
 * Provides async dynamic imports for Firebase to defer loading
 * until after initial page render. This significantly improves FCP/LCP.
 */

// Cache for loaded Firebase modules
let firebaseModuleCache: typeof import('./firebase') | null = null;
let authModuleCache: typeof import('./auth') | null = null;

/**
 * Dynamically import Firebase service module
 * Only loads on first call, then returns cached module
 */
export async function getFirebaseService() {
    if (!firebaseModuleCache) {
        firebaseModuleCache = await import('./firebase');
    }
    return firebaseModuleCache;
}

/**
 * Dynamically import Auth service module
 */
export async function getAuthService() {
    if (!authModuleCache) {
        authModuleCache = await import('./auth');
    }
    return authModuleCache;
}

/**
 * Check if Firebase is configured (lightweight check, no dynamic import)
 */
export function isFirebaseConfiguredSync(): boolean {
    return !!(
        import.meta.env.VITE_FIREBASE_API_KEY &&
        import.meta.env.VITE_FIREBASE_PROJECT_ID
    );
}

// Re-export types that are needed synchronously
export type { FilterMetadata } from './firebase';
