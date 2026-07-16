/**
 * Simple hash utility for password protection
 * Uses Web Crypto API for SHA-256 hashing
 */

// Convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Hash a password using SHA-256
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return bufferToHex(hashBuffer);
}

// Check if a string looks like a SHA-256 hash (64 hex characters)
function isHash(str: string): boolean {
    return /^[a-f0-9]{64}$/i.test(str);
}

// Verify password against stored hash
// Supports backward compatibility: if stored value is plain text, compare directly
export async function verifyPassword(password: string, storedValue: string): Promise<boolean> {
    // If stored value is not a hash (legacy plain text), compare directly
    if (!isHash(storedValue)) {
        return password === storedValue;
    }

    // Otherwise, hash the input and compare with stored hash
    const passwordHash = await hashPassword(password);
    return passwordHash === storedValue;
}
