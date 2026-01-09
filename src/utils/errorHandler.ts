/**
 * Error handling utilities for frontend
 * Provides centralized error processing and user feedback
 *
 * AUTH ERROR HANDLING IMPROVEMENTS:
 * - Token refresh on 401 before redirect
 * - Retry mechanism for transient auth errors (max 3 retries)
 * - Offline detection and handling
 * - Error recovery workflows
 * - Detailed error context for debugging
 */

import React from 'react';
import { ApiError, ErrorCode } from '../types/api/api.types';
import {
    getErrorContext,
    captureErrorWithContext,
    addBreadcrumb,
    setComponentContext,
    setActionContext
} from './observability';

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Auth error types for more specific handling
export enum AuthErrorType {
    SESSION_EXPIRED = 'SESSION_EXPIRED',
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    NETWORK_ERROR = 'NETWORK_ERROR',
    OFFLINE = 'OFFLINE',
    UNKNOWN = 'UNKNOWN',
}

// Auth error context for debugging
export interface AuthErrorContext {
    errorType: AuthErrorType;
    isRetrying: boolean;
    retryCount: number;
    maxRetries: number;
    isOffline: boolean;
    timestamp: number;
    requestId?: string;
    endpoint?: string;
}

// Token refresh state for handling concurrent requests
interface TokenRefreshState {
    isRefreshing: boolean;
    promise: Promise<boolean> | null;
    pendingRequests: Array<{ resolve: (value: any) => void; reject: (error: any) => void }>;
}

// Global token refresh state
let tokenRefreshState: TokenRefreshState = {
    isRefreshing: false,
    promise: null,
    pendingRequests: [] as Array<{ resolve: (value: any) => void; reject: (error: any) => void }>,
};

// Offline detection state
let isOffline = false;
let offlineCheckInterval: NodeJS.Timeout | null = null;

// Retry configuration
const MAX_AUTH_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // Base delay in ms
const OFFLINE_CHECK_INTERVAL = 5000; // Check every 5 seconds

// Auth error recovery callback
type AuthRecoveryCallback = (action: 'retry' | 'login' | 'logout' | 'refresh') => void;
let authRecoveryCallback: AuthRecoveryCallback | null = null;

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

// Error handler configuration
export interface ErrorHandlerConfig {
    enableLogging: boolean;
    enableNotifications: boolean;
    defaultNotificationDuration: number;
    redirectToLoginOnAuthError: boolean;
    enableTokenRefresh: boolean;
    enableOfflineDetection: boolean;
    maxAuthRetries: number;
}

// Default configuration
const defaultConfig: ErrorHandlerConfig = {
    enableLogging: true,
    enableNotifications: true,
    defaultNotificationDuration: 5000,
    redirectToLoginOnAuthError: true,
    enableTokenRefresh: true,
    enableOfflineDetection: true,
    maxAuthRetries: MAX_AUTH_RETRIES,
};

// Global configuration
let globalConfig: ErrorHandlerConfig = defaultConfig;

// Notification callback
let notificationCallback: ((notification: Notification) => void) | null = null;

/**
 * Configure global error handler settings
 */
export const configureErrorHandler = (config: Partial<ErrorHandlerConfig>): void => {
    globalConfig = { ...globalConfig, ...config };
};

/**
 * Set notification callback for displaying errors to users
 */
export const setNotificationCallback = (callback: (notification: Notification) => void): void => {
    notificationCallback = callback;
};

/**
 * Set auth recovery callback for handling auth errors
 */
export const setAuthRecoveryCallback = (callback: AuthRecoveryCallback): void => {
    authRecoveryCallback = callback;
};

/**
 * Show notification to user
 */
export const showNotification = (notification: Omit<Notification, 'id'>): string => {
    const id = Math.random().toString(36).substring(7);
    const fullNotification: Notification = {
        id,
        duration: globalConfig.defaultNotificationDuration,
        ...notification,
    };

    if (globalConfig.enableNotifications && notificationCallback) {
        notificationCallback(fullNotification);
    }

    return id;
};

/**
 * Check if browser is offline
 */
export const checkOfflineStatus = (): boolean => {
    return !navigator.onLine;
};

/**
 * Setup offline detection
 */
export const setupOfflineDetection = (): (() => void) => {
    const handleOnline = () => {
        if (isOffline) {
            isOffline = false;
            console.log('Connection restored');
            addBreadcrumb('Connection restored', 'network', 'info');
            showNotification({
                type: 'success',
                title: 'Conexão Restaurada',
                message: 'Sua conexão com a internet foi restaurada.',
            });
        }
    };

    const handleOffline = () => {
        isOffline = true;
        console.log('Connection lost');
        addBreadcrumb('Connection lost', 'network', 'warning');
        showNotification({
            type: 'warning',
            title: 'Sem Conexão',
            message: 'Você está offline. Algumas funcionalidades podem não funcionar.',
            duration: 0, // Don't auto-dismiss
        });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    isOffline = checkOfflineStatus();

    // Set up periodic check
    if (globalConfig.enableOfflineDetection) {
        offlineCheckInterval = setInterval(() => {
            const currentStatus = checkOfflineStatus();
            if (currentStatus !== isOffline) {
                if (currentStatus) {
                    handleOffline();
                } else {
                    handleOnline();
                }
            }
        }, OFFLINE_CHECK_INTERVAL);
    }

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        if (offlineCheckInterval) {
            clearInterval(offlineCheckInterval);
            offlineCheckInterval = null;
        }
    };
};

/**
 * Log error to console (or external logging service)
 */
export const logError = (error: Error | ApiError, context?: string, authErrorContext?: AuthErrorContext): void => {
    if (!globalConfig.enableLogging) return;

    const errorContext = getErrorContext();

    const logData = {
        ...errorContext,
        context,
        error: {
            name: (error as Error).name,
            message: error.message,
            stack: (error as Error).stack,
            ...(error as ApiError).code && { code: (error as ApiError).code },
            ...(error as ApiError).statusCode && { statusCode: (error as ApiError).statusCode },
        },
        ...(authErrorContext && { authErrorContext }),
    };

    console.error('Application Error:', logData);

    // Capture error in Sentry with context
    captureErrorWithContext(error as Error, {
        component: context,
        action: errorContext.action,
        ...(authErrorContext && { authErrorContext: JSON.stringify(authErrorContext) }),
    });

    // In production, you might want to send this to a logging service
    // Example: sendToErrorReportingService(logData);
};

/**
 * Determine auth error type from error
 */
export const getAuthErrorType = (error: ApiError): AuthErrorType => {
    if (error.statusCode === 401) {
        return AuthErrorType.SESSION_EXPIRED;
    }
    if (error.statusCode === 403) {
        return AuthErrorType.PERMISSION_DENIED;
    }
    if (error.code === ErrorCode.NETWORK_ERROR) {
        return isOffline ? AuthErrorType.OFFLINE : AuthErrorType.NETWORK_ERROR;
    }
    if (error.message?.toLowerCase().includes('invalid') || error.message?.toLowerCase().includes('credential')) {
        return AuthErrorType.INVALID_CREDENTIALS;
    }
    if (error.message?.toLowerCase().includes('refresh')) {
        return AuthErrorType.TOKEN_REFRESH_FAILED;
    }
    return AuthErrorType.UNKNOWN;
};

/**
 * Get user-friendly message for auth error type
 */
export const getAuthErrorMessage = (errorType: AuthErrorType, originalMessage?: string): string => {
    const messages: Record<AuthErrorType, string> = {
        [AuthErrorType.SESSION_EXPIRED]: 'Sua sessão expirou. Por favor, faça login novamente.',
        [AuthErrorType.INVALID_CREDENTIALS]: 'Email ou senha incorretos. Verifique suas credenciais.',
        [AuthErrorType.TOKEN_REFRESH_FAILED]: 'Não foi possível renovar sua sessão. Faça login novamente.',
        [AuthErrorType.PERMISSION_DENIED]: 'Você não tem permissão para realizar esta operação.',
        [AuthErrorType.NETWORK_ERROR]: 'Erro de conexão. Verifique sua internet e tente novamente.',
        [AuthErrorType.OFFLINE]: 'Você está offline. Conecte-se à internet para continuar.',
        [AuthErrorType.UNKNOWN]: originalMessage || 'Ocorreu um erro de autenticação.',
    };
    return messages[errorType] || originalMessage || 'Erro desconhecido.';
};

/**
 * Attempt to refresh auth token
 * Returns true if refresh was successful, false otherwise
 */
export const attemptTokenRefresh = async (): Promise<boolean> => {
    if (!globalConfig.enableTokenRefresh) {
        return false;
    }

    // If already refreshing, return the existing promise
    if (tokenRefreshState.isRefreshing && tokenRefreshState.promise) {
        try {
            await tokenRefreshState.promise;
            return true;
        } catch {
            return false;
        }
    }

    // Start refresh process
    tokenRefreshState.isRefreshing = true;
    tokenRefreshState.promise = (async () => {
        try {
            // Import auth service dynamically to avoid circular dependencies
            const { supabaseAuthService } = await import('../services/auth/SupabaseAuthService');
            const session = await supabaseAuthService.refreshSession();

            if (session) {
                // Supabase SDK handles token management automatically
                // Token refresh is handled by Supabase SDK via SupabaseAuthService
                console.log('Token refreshed successfully via error handler');
                addBreadcrumb('Token refreshed', 'auth', 'info');

                // Resolve all pending requests
                tokenRefreshState.pendingRequests.forEach(({ resolve }) => resolve(true));
                tokenRefreshState.pendingRequests = [];

                return true;
            } else {
                throw new Error('Token refresh returned null session');
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            addBreadcrumb('Token refresh failed', 'auth', 'error');

            // Reject all pending requests
            tokenRefreshState.pendingRequests.forEach(({ reject }) => reject(error));
            tokenRefreshState.pendingRequests = [];

            return false;
        } finally {
            tokenRefreshState.isRefreshing = false;
            tokenRefreshState.promise = null;
        }
    })();

    return tokenRefreshState.promise;
};

/**
 * Handle API errors with appropriate user feedback
 * Enhanced with token refresh, retry mechanism, and offline detection
 */
export const handleApiError = (
    error: ApiError,
    context?: string,
    retryCallback?: () => Promise<void>
): void => {
    // Set component context for better tracking
    if (context) {
        setComponentContext(context);
    }

    // Add breadcrumb for better error tracking
    addBreadcrumb(`API Error: ${error.code}`, 'api', 'error', {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
    });

    // Determine auth error type
    const authErrorType = getAuthErrorType(error);

    // Create auth error context
    const authErrorContext: AuthErrorContext = {
        errorType: authErrorType,
        isRetrying: false,
        retryCount: 0,
        maxRetries: globalConfig.maxAuthRetries,
        isOffline: isOffline,
        timestamp: Date.now(),
    };

    logError(error, context, authErrorContext);

    // Check if offline
    if (isOffline && authErrorType === AuthErrorType.NETWORK_ERROR) {
        showNotification({
            type: 'warning',
            title: 'Sem Conexão',
            message: 'Você está offline. Conecte-se à internet e tente novamente.',
            action: retryCallback ? {
                label: 'Tentar Novamente',
                onClick: () => retryCallback(),
            } : undefined,
            duration: 0,
        });
        return;
    }

    const errorHandlers: Record<ErrorCode, () => void> = {
        [ErrorCode.NETWORK_ERROR]: () => {
            const message = getAuthErrorMessage(authErrorType);
            showNotification({
                type: 'error',
                title: 'Erro de Conexão',
                message,
                duration: 8000,
                action: retryCallback ? {
                    label: 'Tentar Novamente',
                    onClick: () => retryCallback(),
                } : undefined,
            });
        },

        [ErrorCode.TIMEOUT_ERROR]: () => {
            showNotification({
                type: 'warning',
                title: 'Tempo Esgotado',
                message: 'A operação demorou muito tempo para responder. Tente novamente.',
                action: retryCallback ? {
                    label: 'Tentar Novamente',
                    onClick: () => retryCallback(),
                } : undefined,
            });
        },

        [ErrorCode.AUTHENTICATION_ERROR]: async () => {
            // Try to refresh token before redirecting
            if (globalConfig.enableTokenRefresh) {
                const refreshSuccess = await attemptTokenRefresh();

                if (refreshSuccess) {
                    // Token refreshed successfully, retry the request
                    if (retryCallback) {
                        showNotification({
                            type: 'success',
                            title: 'Sessão Renovada',
                            message: 'Sua sessão foi renovada automaticamente.',
                            duration: 3000,
                        });
                        try {
                            await retryCallback();
                            return;
                        } catch (retryError) {
                            // Retry failed, proceed with error handling
                            console.error('Retry after token refresh failed:', retryError);
                        }
                    }
                }
            }

            // Token refresh failed or not enabled, show error and redirect
            const message = getAuthErrorMessage(authErrorType, error.message);
            showNotification({
                type: 'error',
                title: 'Sessão Expirada',
                message,
                action: {
                    label: 'Fazer Login',
                    onClick: () => {
                        if (authRecoveryCallback) {
                            authRecoveryCallback('login');
                        } else {
                            window.location.href = '/login';
                        }
                    },
                },
            });

            if (globalConfig.redirectToLoginOnAuthError) {
                // Auto-redirect after a delay
                setTimeout(() => {
                    if (authRecoveryCallback) {
                        authRecoveryCallback('login');
                    } else {
                        window.location.href = '/login';
                    }
                }, 3000);
            }
        },

        [ErrorCode.AUTHORIZATION_ERROR]: () => {
            const message = getAuthErrorMessage(authErrorType);
            showNotification({
                type: 'error',
                title: 'Acesso Negado',
                message,
            });
        },

        [ErrorCode.VALIDATION_ERROR]: () => {
            showNotification({
                type: 'warning',
                title: 'Dados Inválidos',
                message: error.details?.message || error.message || 'Verifique os dados informados.',
            });
        },

        [ErrorCode.NOT_FOUND_ERROR]: () => {
            showNotification({
                type: 'info',
                title: 'Não Encontrado',
                message: 'O recurso solicitado não foi encontrado.',
            });
        },

        [ErrorCode.SERVER_ERROR]: () => {
            showNotification({
                type: 'error',
                title: 'Erro do Servidor',
                message: 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.',
                duration: 8000,
                action: retryCallback ? {
                    label: 'Tentar Novamente',
                    onClick: () => retryCallback(),
                } : undefined,
            });
        },

        [ErrorCode.UNKNOWN_ERROR]: () => {
            const message = getAuthErrorMessage(authErrorType, error.message);
            showNotification({
                type: 'error',
                title: 'Erro Inesperado',
                message,
                action: retryCallback ? {
                    label: 'Tentar Novamente',
                    onClick: () => retryCallback(),
                } : undefined,
            });
        },
    };

    const handler = errorHandlers[error.code as ErrorCode];
    if (handler) {
        handler();
    } else {
        // Fallback for unknown errors
        showNotification({
            type: 'error',
            title: 'Erro',
            message: error.message || 'Ocorreu um erro desconhecido.',
        });
    }
};

/**
 * Handle API error with retry mechanism
 * Automatically retries transient errors up to max retries
 */
export const handleApiErrorWithRetry = async (
    error: ApiError,
    context?: string,
    retryCallback?: () => Promise<void>,
    retryCount: number = 0
): Promise<boolean> => {
    // Check if error is recoverable and we haven't exceeded max retries
    const isRecoverable = isRecoverableError(error);
    const isAuthError = error.code === ErrorCode.AUTHENTICATION_ERROR;

    // For auth errors, try token refresh first
    if (isAuthError && globalConfig.enableTokenRefresh && retryCount === 0) {
        const refreshSuccess = await attemptTokenRefresh();
        if (refreshSuccess && retryCallback) {
            try {
                await retryCallback();
                return true; // Success after token refresh
            } catch (retryError) {
                console.error('Retry after token refresh failed:', retryError);
            }
        }
    }

    // For recoverable errors, retry with exponential backoff
    if (isRecoverable && retryCount < globalConfig.maxAuthRetries) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount);

        addBreadcrumb(`Retrying request (attempt ${retryCount + 1}/${globalConfig.maxAuthRetries})`, 'api', 'info');

        await new Promise(resolve => setTimeout(resolve, delay));

        if (retryCallback) {
            try {
                await retryCallback();
                return true; // Success after retry
            } catch (retryError) {
                console.error(`Retry ${retryCount + 1} failed:`, retryError);
                // Recursive retry with incremented count
                return handleApiErrorWithRetry(
                    error as ApiError,
                    context,
                    retryCallback,
                    retryCount + 1
                );
            }
        }
    }

    // All retries exhausted or error is not recoverable
    handleApiError(error, context, retryCallback);
    return false;
};

/**
 * Handle generic JavaScript errors
 */
export const handleError = (error: Error, context?: string): void => {
    // Set component context for better tracking
    if (context) {
        setComponentContext(context);
    }

    // Add breadcrumb for better error tracking
    addBreadcrumb(`Error: ${error.message}`, 'error', 'error', {
        name: error.name,
    });

    logError(error, context);

    showNotification({
        type: 'error',
        title: 'Erro',
        message: error.message || 'Ocorreu um erro inesperado.',
    });
};

/**
 * Create error boundary fallback component handler
 */
export const handleBoundaryError = (error: Error, errorInfo: React.ErrorInfo): void => {
    // Set component context for better tracking
    setComponentContext('ErrorBoundary');

    // Add breadcrumb for better error tracking
    addBreadcrumb('Error Boundary caught error', 'error-boundary', 'error', {
        componentStack: errorInfo.componentStack,
    });

    logError(error, 'Error Boundary');

    // Log additional error info
    console.error('Error Boundary Info:', errorInfo);

    showNotification({
        type: 'error',
        title: 'Erro na Aplicação',
        message: 'Ocorreu um erro inesperado. A página será recarregada.',
        action: {
            label: 'Recarregar',
            onClick: () => {
                window.location.reload();
            },
        },
    });
};

/**
 * Success notification helper
 */
export const showSuccess = (title: string, message?: string): string => {
    return showNotification({
        type: 'success',
        title,
        message,
    });
};

/**
 * Warning notification helper
 */
export const showWarning = (title: string, message?: string): string => {
    return showNotification({
        type: 'warning',
        title,
        message,
    });
};

/**
 * Info notification helper
 */
export const showInfo = (title: string, message?: string): string => {
    return showNotification({
        type: 'info',
        title,
        message,
    });
};

/**
 * Error class for application-specific errors
 */
export class AppError extends Error {
    public readonly code: ErrorCode;
    public readonly statusCode: number;
    public readonly context?: string;

    constructor(
        message: string,
        code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
        statusCode: number = 500,
        context?: string
    ) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
    }
}

/**
 * Create application error with context
 */
export const createAppError = (
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    context?: string
): AppError => {
    return new AppError(message, code, 500, context);
};

/**
 * Check if error is recoverable
 */
export const isRecoverableError = (error: ApiError): boolean => {
    const recoverableErrors = [
        ErrorCode.NETWORK_ERROR,
        ErrorCode.TIMEOUT_ERROR,
        ErrorCode.SERVER_ERROR,
    ];

    return recoverableErrors.includes(error.code as ErrorCode);
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyMessage = (error: ApiError): string => {
    const messages: Record<ErrorCode, string> = {
        [ErrorCode.NETWORK_ERROR]: 'Verifique sua conexão com a internet.',
        [ErrorCode.TIMEOUT_ERROR]: 'A operação demorou muito tempo. Tente novamente.',
        [ErrorCode.AUTHENTICATION_ERROR]: 'Faça login novamente para continuar.',
        [ErrorCode.AUTHORIZATION_ERROR]: 'Você não tem permissão para esta ação.',
        [ErrorCode.VALIDATION_ERROR]: 'Verifique os dados informados.',
        [ErrorCode.NOT_FOUND_ERROR]: 'O recurso não foi encontrado.',
        [ErrorCode.SERVER_ERROR]: 'Tente novamente mais tarde.',
        [ErrorCode.UNKNOWN_ERROR]: 'Ocorreu um erro inesperado.',
    };

    return messages[error.code as ErrorCode] || error.message;
};

export default {
    configureErrorHandler,
    setNotificationCallback,
    setAuthRecoveryCallback,
    handleApiError,
    handleApiErrorWithRetry,
    handleError,
    handleBoundaryError,
    showNotification,
    showSuccess,
    showWarning,
    showInfo,
    createAppError,
    isRecoverableError,
    getUserFriendlyMessage,
    getAuthErrorType,
    getAuthErrorMessage,
    attemptTokenRefresh,
    checkOfflineStatus,
    setupOfflineDetection,
};