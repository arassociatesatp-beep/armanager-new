/**
 * Firebase Authentication Service
 * 
 * Provides authentication functions using Firebase Auth.
 * Supports email/password authentication (sign-in only).
 */

import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    AuthError
} from 'firebase/auth';
import { getAuthInstance } from './firebase';

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    const auth = getAuthInstance();

    if (!auth) {
        return { user: null, error: 'Firebase not configured. Please check your environment variables.' };
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user, error: null };
    } catch (error) {
        const authError = error as AuthError;
        let errorMessage = 'Login failed. Please try again.';

        switch (authError.code) {
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled.';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password.';
                break;
            case 'auth/invalid-credential':
                errorMessage = 'Invalid email or password.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
        }

        return { user: null, error: errorMessage };
    }
}

/**
 * Sign out the current user
 */
export async function logOut(): Promise<{ error: string | null }> {
    const auth = getAuthInstance();

    if (!auth) {
        return { error: 'Firebase not configured.' };
    }

    try {
        await signOut(auth);
        return { error: null };
    } catch (error) {
        return { error: 'Logout failed. Please try again.' };
    }
}

/**
 * Subscribe to auth state changes
 * Returns an unsubscribe function
 */
export function subscribeToAuthState(callback: (user: User | null) => void): (() => void) | null {
    const auth = getAuthInstance();

    if (!auth) {
        callback(null);
        return null;
    }

    return onAuthStateChanged(auth, callback);
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
    const auth = getAuthInstance();
    return auth?.currentUser || null;
}

/**
 * Check if Firebase Auth is available
 */
export function isAuthAvailable(): boolean {
    return getAuthInstance() !== null;
}
