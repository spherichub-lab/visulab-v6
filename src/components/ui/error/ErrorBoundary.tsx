/**
 * ErrorBoundary - Error boundary component with fallback UI
 * Built with design tokens and accessibility in mind
 *
 * AUTH-AWARE ERROR BOUNDARY:
 * - Detects auth-specific errors (401, 403, session expired)
 * - Provides appropriate recovery actions (login, retry, refresh)
 * - Shows user-friendly messages based on error type
 * - Preserves error context for debugging
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icon } from '../../../../components/Icon';
import { Button } from '../button/Button';
import { cn } from '../../../utils';
import { handleBoundaryError, AuthErrorType, getAuthErrorType } from '../../../utils/errorHandler';

export interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: React.ComponentType<{ error: Error; retry: () => void; authErrorType?: AuthErrorType }>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    className?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    authErrorType?: AuthErrorType;
}

/**
 * Determine if error is auth-related
 */
const isAuthError = (error: Error): boolean => {
    const message = error.message.toLowerCase();
    return (
        message.includes('unauthorized') ||
        message.includes('authentication') ||
        message.includes('session expired') ||
        message.includes('token') ||
        message.includes('401') ||
        message.includes('403')
    );
};

/**
 * Get auth error type from error
 */
const getErrorAuthType = (error: Error): AuthErrorType => {
    const message = error.message.toLowerCase();

    if (message.includes('session expired') || message.includes('401')) {
        return AuthErrorType.SESSION_EXPIRED;
    }
    if (message.includes('permission') || message.includes('403')) {
        return AuthErrorType.PERMISSION_DENIED;
    }
    if (message.includes('invalid credential')) {
        return AuthErrorType.INVALID_CREDENTIALS;
    }
    if (message.includes('refresh')) {
        return AuthErrorType.TOKEN_REFRESH_FAILED;
    }

    return AuthErrorType.UNKNOWN;
};

/**
 * Get error icon based on error type
 */
const getErrorIcon = (authErrorType?: AuthErrorType): string => {
    switch (authErrorType) {
        case AuthErrorType.SESSION_EXPIRED:
        case AuthErrorType.INVALID_CREDENTIALS:
            return 'lock';
        case AuthErrorType.PERMISSION_DENIED:
            return 'block';
        case AuthErrorType.OFFLINE:
        case AuthErrorType.NETWORK_ERROR:
            return 'wifi_off';
        default:
            return 'error';
    }
};

/**
 * Get error title based on error type
 */
const getErrorTitle = (authErrorType?: AuthErrorType): string => {
    switch (authErrorType) {
        case AuthErrorType.SESSION_EXPIRED:
            return 'Sessão Expirada';
        case AuthErrorType.INVALID_CREDENTIALS:
            return 'Credenciais Inválidas';
        case AuthErrorType.PERMISSION_DENIED:
            return 'Acesso Negado';
        case AuthErrorType.TOKEN_REFRESH_FAILED:
            return 'Erro de Autenticação';
        case AuthErrorType.OFFLINE:
            return 'Sem Conexão';
        case AuthErrorType.NETWORK_ERROR:
            return 'Erro de Conexão';
        default:
            return 'Ops! Algo deu errado';
    }
};

/**
 * Get error message based on error type
 */
const getErrorMessage = (error: Error, authErrorType?: AuthErrorType): string => {
    switch (authErrorType) {
        case AuthErrorType.SESSION_EXPIRED:
            return 'Sua sessão expirou. Por favor, faça login novamente para continuar.';
        case AuthErrorType.INVALID_CREDENTIALS:
            return 'As credenciais informadas são inválidas. Verifique seu email e senha.';
        case AuthErrorType.PERMISSION_DENIED:
            return 'Você não tem permissão para acessar este recurso.';
        case AuthErrorType.TOKEN_REFRESH_FAILED:
            return 'Não foi possível renovar sua sessão. Faça login novamente.';
        case AuthErrorType.OFFLINE:
            return 'Você está offline. Verifique sua conexão com a internet.';
        case AuthErrorType.NETWORK_ERROR:
            return 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
        default:
            return 'Ocorreu um erro inesperado. Nossa equipe foi notificada e estamos trabalhando para resolver isso.';
    }
};

/**
 * Default error fallback component
 */
const DefaultErrorFallback: React.FC<{
    error: Error;
    retry: () => void;
    authErrorType?: AuthErrorType
}> = ({ error, retry, authErrorType }) => {
    const icon = getErrorIcon(authErrorType);
    const title = getErrorTitle(authErrorType);
    const message = getErrorMessage(error, authErrorType);
    const isAuthRelated = authErrorType !== undefined;

    return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
                {/* Error Icon */}
                <div className={`h-20 w-20 rounded-full flex items-center justify-center mb-6 mx-auto border ${isAuthRelated
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30'
                    }`}>
                    <Icon
                        name={icon}
                        className={`!text-3xl ${isAuthRelated
                                ? 'text-amber-500'
                                : 'text-red-500'
                            }`}
                    />
                </div>

                {/* Error Title */}
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {title}
                </h2>

                {/* Error Message */}
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                    {message}
                </p>

                {/* Error Details (Development Only) */}
                {process.env.NODE_ENV === 'development' && (
                    <details className="mb-6 text-left">
                        <summary className="cursor-pointer text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-2">
                            Ver detalhes do erro
                        </summary>
                        <div className="mt-2 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 overflow-auto max-h-32">
                            <div className="mb-2">
                                <strong>Erro:</strong> {error.message}
                            </div>
                            {error.stack && (
                                <div>
                                    <strong>Stack:</strong>
                                    <pre className="whitespace-pre-wrap">{error.stack}</pre>
                                </div>
                            )}
                        </div>
                    </details>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {/* Auth-specific actions */}
                    {isAuthRelated && (
                        <Button
                            onClick={() => {
                                window.location.href = '/login';
                            }}
                            variant="primary"
                            size="md"
                            icon="login"
                        >
                            Fazer Login
                        </Button>
                    )}

                    {/* Retry button */}
                    <Button
                        onClick={retry}
                        variant={isAuthRelated ? 'secondary' : 'primary'}
                        size="md"
                        icon="refresh"
                    >
                        Tentar Novamente
                    </Button>

                    {/* Reload page button */}
                    <Button
                        onClick={() => window.location.reload()}
                        variant="secondary"
                        size="md"
                        icon="refresh"
                    >
                        Recarregar Página
                    </Button>
                </div>

                {/* Help Text */}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-6">
                    Se o problema persistir, entre em contato com o suporte técnico.
                </p>
            </div>
        </div>
    );
};

/**
 * Error Boundary Component
 */
export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
    children,
    fallback: FallbackComponent = DefaultErrorFallback,
    onError,
    className,
}) => {
    const [errorState, setErrorState] = React.useState<ErrorBoundaryState>({
        hasError: false,
        error: null,
        errorInfo: null,
        authErrorType: undefined,
    });

    // Handle error
    const handleError = React.useCallback((error: Error, errorInfo: ErrorInfo) => {
        // Determine if this is an auth error
        const authErrorType = isAuthError(error) ? getErrorAuthType(error) : undefined;

        // Update state with error info
        setErrorState({
            hasError: true,
            error,
            errorInfo,
            authErrorType,
        });

        // Call custom error handler
        if (onError) {
            onError(error, errorInfo);
        }

        // Use global error handler
        handleBoundaryError(error, errorInfo);

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
            if (authErrorType) {
                console.log('Auth error type detected:', authErrorType);
            }
        }
    }, [onError]);

    // Reset error boundary state
    const resetErrorBoundary = React.useCallback(() => {
        setErrorState({
            hasError: false,
            error: null,
            errorInfo: null,
            authErrorType: undefined,
        });
    }, []);

    // Error boundary wrapper
    const ErrorBoundaryWrapper = ({ children }: { children: ReactNode }) => {
        try {
            return <>{children}</>;
        } catch (error) {
            const errorObj = error instanceof Error ? error : new Error(String(error));
            const errorInfo: ErrorInfo = {
                componentStack: '',
                errorBoundary: null,
                error: errorObj,
            };
            handleError(errorObj, errorInfo);
            return null;
        }
    };

    if (errorState.hasError && errorState.error) {
        return (
            <div className={cn('min-h-screen bg-white dark:bg-surface-dark', className)}>
                <FallbackComponent
                    error={errorState.error}
                    retry={resetErrorBoundary}
                    authErrorType={errorState.authErrorType}
                />
            </div>
        );
    }

    return <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>;
};

export default ErrorBoundary;