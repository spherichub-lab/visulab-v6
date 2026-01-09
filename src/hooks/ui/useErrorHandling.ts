/**
 * useErrorHandling - Unified error handling hook
 * Provides centralized error processing, retry logic, and user feedback
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { showNotification, showSuccess, showWarning, showInfo } from '../../utils/errorHandler';

export interface ErrorHandlingOptions {
    showToast?: boolean;
    logError?: boolean;
    context?: string;
    customMessage?: string;
    retryAction?: () => Promise<void>;
    maxRetries?: number;
    retryDelay?: number;
    onError?: (error: Error) => void;
    onRetry?: (attempt: number) => void;
    onSuccess?: () => void;
}

export interface ErrorState {
    error: Error | null;
    hasError: boolean;
    errorMessage: string;
    isRetrying: boolean;
    retryCount: number;
    lastErrorTime: number;
}

export interface ErrorHandlingReturn extends ErrorState {
    handleError: (error: Error | string, options?: Partial<ErrorHandlingOptions>) => void;
    clearError: () => void;
    retry: () => Promise<void>;
    canRetry: boolean;
}

const DEFAULT_OPTIONS: Required<ErrorHandlingOptions> = {
    showToast: true,
    logError: true,
    context: '',
    customMessage: '',
    retryAction: async () => { },
    maxRetries: 3,
    retryDelay: 1000,
    onError: () => { },
    onRetry: () => { },
    onSuccess: () => { },
};

/**
 * Hook for unified error handling with retry logic
 */
export const useErrorHandling = (options: ErrorHandlingOptions = {}): ErrorHandlingReturn => {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [errorState, setErrorState] = useState<ErrorState>({
        error: null,
        hasError: false,
        errorMessage: '',
        isRetrying: false,
        retryCount: 0,
        lastErrorTime: 0,
    });

    /**
     * Calculate exponential backoff delay
     */
    const getRetryDelay = useCallback((attempt: number): number => {
        return mergedOptions.retryDelay * Math.pow(2, attempt - 1);
    }, [mergedOptions.retryDelay]);

    /**
     * Check if error is recoverable
     */
    const isRecoverableError = useCallback((error: Error): boolean => {
        // Network errors, timeout errors, and server errors are typically recoverable
        const recoverablePatterns = [
            /network/i,
            /timeout/i,
            /connection/i,
            /fetch/i,
            /5\d\d/, // 5xx server errors
            /ECONNRESET/,
            /ETIMEDOUT/,
        ];

        return recoverablePatterns.some(pattern => pattern.test(error.message));
    }, []);

    /**
     * Get user-friendly error message
     */
    const getErrorMessage = useCallback((error: Error | string, customMessage?: string): string => {
        if (customMessage) return customMessage;

        if (typeof error === 'string') return error;

        // Common error patterns and their user-friendly messages
        const errorPatterns: Array<[RegExp, string]> = [
            [/network/i, 'Verifique sua conexão com a internet.'],
            [/timeout/i, 'A operação demorou muito tempo. Tente novamente.'],
            [/unauthorized/i, 'Você não tem permissão para realizar esta operação.'],
            [/forbidden/i, 'Acesso negado. Verifique suas permissões.'],
            [/not found/i, 'O recurso solicitado não foi encontrado.'],
            [/validation/i, 'Verifique os dados informados e tente novamente.'],
            [/5\d\d/, 'O servidor encontrou um erro. Tente novamente em alguns minutos.'],
        ];

        for (const [pattern, message] of errorPatterns) {
            if (pattern.test(error.message)) {
                return message;
            }
        }

        return error.message || 'Ocorreu um erro inesperado.';
    }, []);

    /**
     * Handle error with appropriate processing
     */
    const handleError = useCallback((
        error: Error | string,
        handleOptions: Partial<ErrorHandlingOptions> = {}
    ) => {
        const errorObj = typeof error === 'string' ? new Error(error) : error;
        const currentOptions = { ...mergedOptions, ...handleOptions };

        // Log error if enabled
        if (currentOptions.logError) {
            console.error('Error handled:', {
                error: errorObj,
                context: currentOptions.context,
                timestamp: new Date().toISOString(),
            });
        }

        // Call custom error handler
        currentOptions.onError(errorObj);

        // Update error state
        setErrorState(prev => ({
            error: errorObj,
            hasError: true,
            errorMessage: getErrorMessage(errorObj, currentOptions.customMessage),
            isRetrying: false,
            retryCount: prev.retryCount,
            lastErrorTime: Date.now(),
        }));

        // Show toast notification if enabled
        if (currentOptions.showToast) {
            const message = getErrorMessage(errorObj, currentOptions.customMessage);
            showNotification({
                type: 'error',
                title: 'Erro',
                message,
            });
        }
    }, [mergedOptions, getErrorMessage]);

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setErrorState({
            error: null,
            hasError: false,
            errorMessage: '',
            isRetrying: false,
            retryCount: 0,
            lastErrorTime: 0,
        });
    }, []);

    /**
     * Retry the failed operation
     */
    const retry = useCallback(async (): Promise<void> => {
        if (!errorState.error || errorState.retryCount >= mergedOptions.maxRetries) {
            return;
        }

        const newRetryCount = errorState.retryCount + 1;

        // Update retry state
        setErrorState(prev => ({
            ...prev,
            isRetrying: true,
            retryCount: newRetryCount,
        }));

        // Call retry callback
        mergedOptions.onRetry(newRetryCount);

        try {
            // Calculate delay with exponential backoff
            const delay = getRetryDelay(newRetryCount);

            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }

            // Wait before retrying
            await new Promise(resolve => {
                retryTimeoutRef.current = setTimeout(resolve, delay);
            });

            // Execute retry action
            await mergedOptions.retryAction();

            // Clear error on successful retry
            clearError();
            mergedOptions.onSuccess();

            if (mergedOptions.showToast) {
                showSuccess('Sucesso', 'Operação concluída com sucesso.');
            }
        } catch (retryError) {
            // Handle retry error
            const errorObj = retryError instanceof Error ? retryError : new Error(String(retryError));

            setErrorState(prev => ({
                ...prev,
                isRetrying: false,
                error: errorObj,
                errorMessage: getErrorMessage(errorObj),
            }));

            if (mergedOptions.showToast) {
                const message = getErrorMessage(errorObj);
                showWarning('Falha na tentativa', `${message} (Tentativa ${newRetryCount} de ${mergedOptions.maxRetries})`);
            }

            mergedOptions.onError(errorObj);
        }
    }, [errorState, mergedOptions, getRetryDelay, clearError, getErrorMessage]);

    /**
     * Check if retry is possible
     */
    const canRetry = Boolean(
        errorState.error &&
        errorState.retryCount < mergedOptions.maxRetries &&
        isRecoverableError(errorState.error) &&
        !errorState.isRetrying
    );

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, []);

    return {
        ...errorState,
        handleError,
        clearError,
        retry,
        canRetry,
    };
};

/**
 * Hook for handling async operations with error handling
 */
export const useAsyncError = <T extends any[], R>(
    asyncFn: (...args: T) => Promise<R>,
    options: ErrorHandlingOptions = {}
) => {
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<R | null>(null);
    const errorHandling = useErrorHandling(options);

    const execute = useCallback(async (...args: T): Promise<R | null> => {
        try {
            setIsLoading(true);
            errorHandling.clearError();

            const result = await asyncFn(...args);
            setData(result);

            if (options.onSuccess) {
                options.onSuccess();
            }

            return result;
        } catch (error) {
            const errorObj = error instanceof Error ? error : new Error(String(error));
            errorHandling.handleError(errorObj);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [asyncFn, errorHandling, options]);

    const reset = useCallback(() => {
        setData(null);
        errorHandling.clearError();
        setIsLoading(false);
    }, [errorHandling]);

    return {
        execute,
        reset,
        data,
        isLoading,
        ...errorHandling,
    };
};

export default useErrorHandling;