/**
 * AuthErrorHandler - Auth error handling UI components
 * Provides user-friendly auth error displays with recovery options
 * 
 * COMPONENTS:
 * - AuthErrorDisplay: Shows auth errors with recovery actions
 * - SessionExpiryWarning: Modal for session expiry warning
 * - NetworkErrorDisplay: Shows network errors with retry option
 * - AuthLoadingSpinner: Loading state for auth operations
 */

import React, { useState, useEffect } from 'react';
import { Icon } from '../../../components/Icon';
import { Button } from '../ui/button/Button';
import { Modal } from '../ui/modal/Modal';
import { LoadingSpinner } from '../ui/loading/LoadingSpinner';
import { AuthErrorType, getAuthErrorMessage } from '../../utils/errorHandler';
import { cn } from '../../utils';

// ============================================================================
// TYPES
// ============================================================================

export interface AuthErrorDisplayProps {
    errorType: AuthErrorType;
    errorMessage?: string;
    onRetry?: () => void;
    onLogin?: () => void;
    onLogout?: () => void;
    className?: string;
}

export interface SessionExpiryWarningProps {
    timeRemaining: number; // Time in seconds
    onExtendSession?: () => void;
    onLogout?: () => void;
    isOpen: boolean;
    onClose?: () => void;
}

export interface NetworkErrorDisplayProps {
    errorMessage?: string;
    onRetry?: () => void;
    isRetrying?: boolean;
    className?: string;
}

export interface AuthLoadingSpinnerProps {
    message?: string;
    className?: string;
}

// ============================================================================
// AUTH ERROR DISPLAY COMPONENT
// ============================================================================

/**
 * AuthErrorDisplay - Displays auth errors with appropriate recovery actions
 */
export const AuthErrorDisplay: React.FC<AuthErrorDisplayProps> = ({
    errorType,
    errorMessage,
    onRetry,
    onLogin,
    onLogout,
    className,
}) => {
    const message = errorMessage || getAuthErrorMessage(errorType);

    const getErrorIcon = (): string => {
        switch (errorType) {
            case AuthErrorType.SESSION_EXPIRED:
            case AuthErrorType.INVALID_CREDENTIALS:
                return 'lock';
            case AuthErrorType.PERMISSION_DENIED:
                return 'block';
            case AuthErrorType.TOKEN_REFRESH_FAILED:
                return 'sync_problem';
            case AuthErrorType.OFFLINE:
            case AuthErrorType.NETWORK_ERROR:
                return 'wifi_off';
            default:
                return 'error';
        }
    };

    const getErrorColor = (): string => {
        switch (errorType) {
            case AuthErrorType.SESSION_EXPIRED:
            case AuthErrorType.INVALID_CREDENTIALS:
                return 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 text-amber-500';
            case AuthErrorType.PERMISSION_DENIED:
                return 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-500';
            case AuthErrorType.OFFLINE:
            case AuthErrorType.NETWORK_ERROR:
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 text-blue-500';
            default:
                return 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-500';
        }
    };

    const getErrorTitle = (): string => {
        switch (errorType) {
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
                return 'Erro';
        }
    };

    return (
        <div className={cn('p-6 rounded-xl border', getErrorColor(), className)}>
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                    <Icon name={getErrorIcon()} className="!text-2xl" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold mb-1">
                        {getErrorTitle()}
                    </h3>
                    <p className="text-sm opacity-90 mb-4">
                        {message}
                    </p>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                        {errorType === AuthErrorType.SESSION_EXPIRED && onLogin && (
                            <Button
                                onClick={onLogin}
                                variant="primary"
                                size="sm"
                                icon="login"
                            >
                                Fazer Login
                            </Button>
                        )}

                        {errorType === AuthErrorType.PERMISSION_DENIED && onLogout && (
                            <Button
                                onClick={onLogout}
                                variant="secondary"
                                size="sm"
                                icon="logout"
                            >
                                Sair
                            </Button>
                        )}

                        {(errorType === AuthErrorType.OFFLINE ||
                            errorType === AuthErrorType.NETWORK_ERROR) && onRetry && (
                                <Button
                                    onClick={onRetry}
                                    variant="primary"
                                    size="sm"
                                    icon="refresh"
                                >
                                    Tentar Novamente
                                </Button>
                            )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// SESSION EXPIRY WARNING MODAL
// ============================================================================

/**
 * SessionExpiryWarning - Modal warning about session expiry
 */
export const SessionExpiryWarning: React.FC<SessionExpiryWarningProps> = ({
    timeRemaining,
    onExtendSession,
    onLogout,
    isOpen,
    onClose,
}) => {
    const [timeLeft, setTimeLeft] = useState(timeRemaining);

    useEffect(() => {
        if (!isOpen) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen]);

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const isUrgent = timeLeft <= 60; // Less than 1 minute

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose || (() => { })}
            title="Sessão Expirando em Breve"
            size="sm"
        >
            <div className="text-center py-4">
                {/* Timer Display */}
                <div className={cn(
                    'inline-flex items-center justify-center w-32 h-32 rounded-full mb-6',
                    isUrgent
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : 'bg-amber-100 dark:bg-amber-900/30'
                )}>
                    <div className="text-center">
                        <div className={cn(
                            'text-4xl font-bold',
                            isUrgent ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                        )}>
                            {formatTime(timeLeft)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            restantes
                        </div>
                    </div>
                </div>

                {/* Warning Message */}
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                    {isUrgent
                        ? 'Sua sessão expirará muito em breve! Estenda agora para não perder seu trabalho.'
                        : 'Sua sessão está expirando em breve. Você gostaria de estendê-la?'
                    }
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={() => {
                            onExtendSession?.();
                            onClose?.();
                        }}
                        variant="primary"
                        size="md"
                        icon="refresh"
                    >
                        Estender Sessão
                    </Button>

                    <Button
                        onClick={() => {
                            onLogout?.();
                            onClose?.();
                        }}
                        variant="secondary"
                        size="md"
                        icon="logout"
                    >
                        Sair
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

// ============================================================================
// NETWORK ERROR DISPLAY
// ============================================================================

/**
 * NetworkErrorDisplay - Displays network errors with retry option
 */
export const NetworkErrorDisplay: React.FC<NetworkErrorDisplayProps> = ({
    errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
    onRetry,
    isRetrying = false,
    className,
}) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <div className={cn(
            'p-6 rounded-xl border bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30',
            className
        )}>
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                    <Icon
                        name={isOnline ? 'wifi' : 'wifi_off'}
                        className="!text-2xl text-blue-500"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                        {isOnline ? 'Erro de Conexão' : 'Sem Conexão'}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        {errorMessage}
                    </p>

                    {/* Status */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className={cn(
                            'w-2 h-2 rounded-full',
                            isOnline ? 'bg-green-500' : 'bg-red-500'
                        )} />
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {isOnline ? 'Conectado' : 'Offline'}
                        </span>
                    </div>

                    {/* Actions */}
                    {onRetry && (
                        <Button
                            onClick={onRetry}
                            variant="primary"
                            size="sm"
                            icon={isRetrying ? undefined : 'refresh'}
                            disabled={isRetrying || !isOnline}
                        >
                            {isRetrying ? (
                                <span className="flex items-center gap-2">
                                    <LoadingSpinner size="sm" />
                                    Tentando...
                                </span>
                            ) : (
                                'Tentar Novamente'
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// AUTH LOADING SPINNER
// ============================================================================

/**
 * AuthLoadingSpinner - Loading state for auth operations
 */
export const AuthLoadingSpinner: React.FC<AuthLoadingSpinnerProps> = ({
    message = 'Carregando...',
    className,
}) => {
    return (
        <div className={cn('flex flex-col items-center justify-center p-8', className)}>
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
                {message}
            </p>
        </div>
    );
};

// ============================================================================
// AUTH ERROR WRAPPER COMPONENT
// ============================================================================

export interface AuthErrorWrapperProps {
    errorType: AuthErrorType;
    errorMessage?: string;
    children: React.ReactNode;
    onRetry?: () => void;
    onLogin?: () => void;
    onLogout?: () => void;
}

/**
 * AuthErrorWrapper - Wraps content and shows auth errors when present
 */
export const AuthErrorWrapper: React.FC<AuthErrorWrapperProps> = ({
    errorType,
    errorMessage,
    children,
    onRetry,
    onLogin,
    onLogout,
}) => {
    const [showError, setShowError] = useState(true);

    if (showError) {
        return (
            <AuthErrorDisplay
                errorType={errorType}
                errorMessage={errorMessage}
                onRetry={() => {
                    onRetry?.();
                    setShowError(false);
                }}
                onLogin={() => {
                    onLogin?.();
                    setShowError(false);
                }}
                onLogout={() => {
                    onLogout?.();
                    setShowError(false);
                }}
            />
        );
    }

    return <>{children}</>;
};

export default {
    AuthErrorDisplay,
    SessionExpiryWarning,
    NetworkErrorDisplay,
    AuthLoadingSpinner,
    AuthErrorWrapper,
};
