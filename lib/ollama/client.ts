/**
 * Ollama Client for AI inference
 * Connects to Ollama running on the host machine (Windows)
 * Docker containers access via host.docker.internal
 */

interface OllamaGenerateRequest {
    model: string;
    prompt: string;
    stream?: boolean;
    options?: {
        temperature?: number;
        top_p?: number;
        top_k?: number;
    };
}

interface OllamaGenerateResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

interface OllamaError {
    error: string;
}

/**
 * Ollama client configuration
 */
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const OLLAMA_TIMEOUT = parseInt(process.env.OLLAMA_TIMEOUT || '120000', 10); // 2 minutes default

/**
 * Generate text completion using Ollama
 * @param prompt - The prompt to send to the model
 * @param options - Optional generation parameters
 * @returns Generated text response
 */
export async function generateCompletion(
    prompt: string,
    options?: {
        model?: string;
        temperature?: number;
        top_p?: number;
        top_k?: number;
    }
): Promise<string> {
    const model = options?.model || OLLAMA_MODEL;

    const requestBody: OllamaGenerateRequest = {
        model,
        prompt,
        stream: false,
        options: {
            temperature: options?.temperature ?? 0.7,
            top_p: options?.top_p ?? 0.9,
            top_k: options?.top_k ?? 40,
        }
    };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT);

        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json() as OllamaError;
            throw new Error(`Ollama API error: ${errorData.error || response.statusText}`);
        }

        const data = await response.json() as OllamaGenerateResponse;

        if (!data.response) {
            throw new Error('Ollama returned empty response');
        }

        return data.response;
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error(`Ollama request timeout after ${OLLAMA_TIMEOUT}ms`);
            }
            throw new Error(`Ollama generation failed: ${error.message}`);
        }
        throw new Error('Unknown error occurred during Ollama generation');
    }
}

/**
 * Check if Ollama service is available
 * @returns true if Ollama is reachable, false otherwise
 */
export async function checkOllamaHealth(): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            method: 'GET',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        console.error('Ollama health check failed:', error);
        return false;
    }
}

/**
 * Get list of available models from Ollama
 * @returns Array of model names
 */
export async function getAvailableModels(): Promise<string[]> {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.statusText}`);
        }

        const data = await response.json() as { models: Array<{ name: string }> };
        return data.models.map(m => m.name);
    } catch (error) {
        console.error('Failed to get available models:', error);
        return [];
    }
}

/**
 * Ollama configuration info
 */
export const ollamaConfig = {
    baseUrl: OLLAMA_BASE_URL,
    model: OLLAMA_MODEL,
    timeout: OLLAMA_TIMEOUT,
};
