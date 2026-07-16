/**
 * Firebase Cloud Functions - Secure AI Proxy
 * 
 * This function acts as a secure proxy to call Google AI Studio API.
 * The API key is stored in Firebase environment config, NEVER exposed to frontend.
 * 
 * Setup: firebase functions:config:set ai.key="YOUR_GOOGLE_AI_API_KEY"
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

// CORS configuration - restrict to your domains in production
const corsHandler = cors({
    origin: true, // In production, replace with: ['https://yourdomain.com']
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
});

// Simple in-memory rate limiting (use Redis for production scale)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in ms

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (record.count >= RATE_LIMIT) {
        return false;
    }

    record.count++;
    return true;
}

// Clean up old rate limit entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
        if (now > record.resetTime) {
            rateLimitMap.delete(ip);
        }
    }
}, RATE_LIMIT_WINDOW);

/**
 * AI Proxy Cloud Function
 * 
 * Securely calls Google AI Studio API without exposing the API key.
 * 
 * Request body:
 * {
 *   "prompt": "Your message to the AI",
 *   "model": "gemini-1.5-flash" (optional, defaults to gemini-1.5-flash)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "result": "AI response text",
 *   "usage": { ... } // token usage info
 * }
 */
export const aiProxy = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            // Only allow POST requests
            if (req.method !== 'POST') {
                res.status(405).json({
                    success: false,
                    error: 'Method not allowed. Use POST.'
                });
                return;
            }

            // Get client IP for rate limiting
            const clientIp = req.headers['x-forwarded-for'] as string ||
                req.socket.remoteAddress ||
                'unknown';

            // Check rate limit
            if (!checkRateLimit(clientIp)) {
                res.status(429).json({
                    success: false,
                    error: 'Rate limit exceeded. Please try again later.'
                });
                return;
            }

            // Validate request body
            const { prompt, model = 'gemini-1.5-flash' } = req.body;

            if (!prompt || typeof prompt !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'Invalid request. "prompt" is required and must be a string.'
                });
                return;
            }

            if (prompt.length > 32000) {
                res.status(400).json({
                    success: false,
                    error: 'Prompt too long. Maximum 32000 characters.'
                });
                return;
            }

            // Get API key from Firebase config (NEVER expose this)
            const apiKey = functions.config().ai?.key;

            if (!apiKey) {
                console.error('AI API key not configured. Run: firebase functions:config:set ai.key="YOUR_KEY"');
                res.status(500).json({
                    success: false,
                    error: 'Server configuration error. Contact administrator.'
                });
                return;
            }

            // Call Google AI Studio API
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 8192,
                    },
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    ],
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Google AI API error:', response.status, errorText);
                res.status(502).json({
                    success: false,
                    error: 'AI service temporarily unavailable. Please try again.'
                });
                return;
            }

            const data = await response.json();

            // Extract the response text
            const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const usage = data.usageMetadata || null;

            // Return ONLY the result - never return headers, API key, or raw response
            res.status(200).json({
                success: true,
                result: result,
                usage: usage,
            });

        } catch (error) {
            console.error('aiProxy error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error. Please try again.'
            });
        }
    });
});

/**
 * Health check endpoint
 */
export const healthCheck = functions.https.onRequest((req, res) => {
    corsHandler(req, res, () => {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString()
        });
    });
});
