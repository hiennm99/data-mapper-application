import type { AxiosInstance, AxiosResponse } from 'axios';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';

// Backend configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Type definitions for error responses
interface ValidationError {
    loc: string[];
    msg: string;
}

interface ErrorResponseData {
    detail?: string | ValidationError[];
}

/**
 * Create and configure axios instance with common settings
 */
const createAxiosInstance = (): AxiosInstance => {
    const instance = axios.create({
        baseURL: BACKEND_URL,
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        }
    });

    // Response interceptor for error handling
    instance.interceptors.response.use(
        (response: AxiosResponse) => response,
        (error: AxiosError) => {
            let errorMessage: string;

            if (error.response) {
                // Server responded with error status
                const data = error.response.data as ErrorResponseData;
                if (data?.detail) {
                    if (typeof data.detail === 'string') {
                        errorMessage = data.detail;
                    } else if (Array.isArray(data.detail)) {
                        errorMessage = data.detail
                            .map((err: ValidationError) =>
                                `${err.loc ? err.loc.join('.') : ''}: ${err.msg || JSON.stringify(err)}`
                            )
                            .join('; ');
                    } else {
                        errorMessage = JSON.stringify(data.detail);
                    }
                } else {
                    errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
                }
            } else if (error.request) {
                // Request made but no response
                errorMessage = 'No response from server. Please check your connection.';
            } else {
                // Error in request setup
                errorMessage = error.message || 'Failed to make request';
            }

            console.error('API Error:', errorMessage);
            return Promise.reject(new Error(errorMessage));
        }
    );

    return instance;
};

// Export singleton instance
export const apiClient = createAxiosInstance();

/**
 * Helper function to handle API errors with toast notification
 */
export const handleApiError = (error: unknown, defaultMessage: string = 'An error occurred'): string => {
    const errorMessage = error instanceof Error ? error.message : defaultMessage;
    toast.error(errorMessage);
    return errorMessage;
};

/**
 * Helper function to show success toast
 */
export const showSuccessToast = (message: string): void => {
    toast.success(message);
};

export default apiClient;
