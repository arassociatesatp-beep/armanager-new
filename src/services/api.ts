/**
 * Secure API Service
 * 
 * This service calls the Cloud Function proxy to access AI features.
 * NO API KEYS are stored or exposed in this frontend code.
 */

// Get the Functions URL from environment (set after deployment)
const FUNCTIONS_URL = import.meta.env.VITE_FUNCTIONS_URL || '';

export interface AIProxyResponse {
    success: boolean;
    result?: string;
    error?: string;
    usage?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
    };
}

/**
 * Call the AI Proxy Cloud Function
 * 
 * @param prompt - The text prompt to send to the AI
 * @param model - Optional model name (defaults to gemini-1.5-flash)
 * @returns Promise with AI response
 * 
 * @example
 * const response = await callAIProxy("What is the weather today?");
 * if (response.success) {
 *   console.log(response.result);
 * }
 */
export async function callAIProxy(
    prompt: string,
    model: string = 'gemini-1.5-flash'
): Promise<AIProxyResponse> {
    try {
        // Validate prompt
        if (!prompt || prompt.trim().length === 0) {
            return { success: false, error: 'Prompt cannot be empty' };
        }

        // Determine the endpoint URL
        const endpoint = FUNCTIONS_URL
            ? `${FUNCTIONS_URL}/aiProxy`
            : '/api/aiProxy'; // Falls back to hosting rewrite

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, model }),
        });

        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            return {
                success: false,
                error: 'Invalid response from server'
            };
        }

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || `Request failed with status ${response.status}`,
            };
        }

        return data as AIProxyResponse;

    } catch (error) {
        console.error('AI Proxy call failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error occurred',
        };
    }
}

/**
 * Check if the Cloud Function is healthy
 */
export async function checkAPIHealth(): Promise<boolean> {
    try {
        const endpoint = FUNCTIONS_URL
            ? `${FUNCTIONS_URL}/healthCheck`
            : '/api/healthCheck';

        const response = await fetch(endpoint);
        return response.ok;
    } catch {
        return false;
    }
}
