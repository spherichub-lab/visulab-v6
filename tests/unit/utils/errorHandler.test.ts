/**
 * ErrorHandler Unit Tests
 * Tests for auth error handling improvements including:
 * - Token refresh on 401
 * - Retry mechanism for transient errors
 * - Offline detection
 * - Auth error message generation
 * - Error recovery workflows
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    handleApiError,
    handleApiErrorWithRetry,
    attemptTokenRefresh,
    getAuthErrorType,
    getAuthErrorMessage,
    checkOfflineStatus,
    setupOfflineDetection,
    configureErrorHandler,
    setNotificationCallback,
    setAuthRecoveryCallback,
    showNotification,
    showSuccess,
    showWarning,
    showInfo,
    createAppError,
    isRecoverableError,
    getUserFriendlyMessage,
    AuthErrorType,
    type AuthErrorContext,
} from '@/utils/errorHandler';
import { ApiError, ErrorCode } from '@/types/api/api.types';
import {
    createMock401Error,
    createMock403Error,
    createMockNetworkError,
    createMockValidationError,
} from '../../utils/authMocks';

// ============================================================================
// TEST SETUP
// ============================================================================

beforeEach(() => {
    // Mock window.addEventListener to prevent side effects
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();

    // Reset error handler configuration
    configureErrorHandler({
        enableLogging: false,
        enableNotifications: false,
        enableTokenRefresh: true,
        enableOfflineDetection: false,
        maxAuthRetries: 3,
    });

    // Clear notification callback
    setNotificationCallback(null);
    setAuthRecoveryCallback(null);
});

afterEach(() => {
    vi.clearAllMocks();
});

// ============================================================================
// TESTS
// ============================================================================

describe('ErrorHandler - Auth Error Type Detection', () => {
    it('should detect SESSION_EXPIRED for 401 errors', () => {
        const error: ApiError = {
            code: ErrorCode.AUTHENTICATION_ERROR,
            message: 'Session expired',
            statusCode: 401,
        };

        const errorType = getAuthErrorType(error);
        expect(errorType).toBe(AuthErrorType.SESSION_EXPIRED);
    });

    it('should detect PERMISSION_DENIED for 403 errors', () => {
        const error: ApiError = {
            code: ErrorCode.AUTHORIZATION_ERROR,
            message: 'Permission denied',
            statusCode: 403,
        };

        const errorType = getAuthErrorType(error);
        expect(errorType).toBe(AuthErrorType.PERMISSION_DENIED);
    });

    it('should detect NETWORK_ERROR for network errors', () => {
        const error: ApiError = {
            code: ErrorCode.NETWORK_ERROR,
            message: 'Network error',
            statusCode: 0,
        };

        const errorType = getAuthErrorType(error);
        expect(errorType).toBe(AuthErrorType.NETWORK_ERROR);
    });

    it('should detect INVALID_CREDENTIALS from message', () => {
        const error: ApiError = {
            code: ErrorCode.AUTHENTICATION_ERROR,
            message: 'Invalid credentials provided',
            statusCode: 401,
        };

        const errorType = getAuthErrorType(error);
        expect(errorType).toBe(AuthErrorType.INVALID_CREDENTIALS);
    });

    it('should detect TOKEN_REFRESH_FAILED from message', () => {
        const error: ApiError = {
            code: ErrorCode.AUTHENTICATION_ERROR,
            message: 'Token refresh failed',
            statusCode: 401,
        };

        const errorType = getAuthErrorType(error);
        expect(errorType).toBe(AuthErrorType.TOKEN_REFRESH_FAILED);
    });

    it('should detect UNKNOWN for unrecognized errors', () => {
        const error: ApiError = {
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Unknown error',
            statusCode: 500,
        };

        const errorType = getAuthErrorType(error);
        expect(errorType).toBe(AuthErrorType.UNKNOWN);
    });
});

describe('ErrorHandler - Auth Error Message Generation', () => {
    it('should return message for SESSION_EXPIRED', () => {
        const message = getAuthErrorMessage(AuthErrorType.SESSION_EXPIRED);
        expect(message).toContain('expirou');
        expect(message).toContain('login novamente');
    });

    it('should return message for INVALID_CREDENTIALS', () => {
        const message = getAuthErrorMessage(AuthErrorType.INVALID_CREDENTIALS);
        expect(message).toContain('Email ou senha incorretos');
    });

    it('should return message for TOKEN_REFRESH_FAILED', () => {
        const message = getAuthErrorMessage(AuthErrorType.TOKEN_REFRESH_FAILED);
        expect(message).toContain('renovar sua sessão');
    });

    it('should return message for PERMISSION_DENIED', () => {
        const message = getAuthErrorMessage(AuthErrorType.PERMISSION_DENIED);
        expect(message).toContain('permissão');
    });

    it('should return message for NETWORK_ERROR', () => {
        const message = getAuthErrorMessage(AuthErrorType.NETWORK_ERROR);
        expect(message).toContain('conexão');
    });

    it('should return message for OFFLINE', () => {
        const message = getAuthErrorMessage(AuthErrorType.OFFLINE);
        expect(message).toContain('offline');
    });

    it('should return original message for UNKNOWN with fallback', () => {
        const originalMessage = 'Custom error message';
        const message = getAuthErrorMessage(AuthErrorType.UNKNOWN, originalMessage);
        expect(message).toBe(originalMessage);
    });

    it('should return default message for UNKNOWN without fallback', () => {
        const message = getAuthErrorMessage(AuthErrorType.UNKNOWN);
        expect(message).toContain('autenticação');
    });
});

describe('ErrorHandler - Token Refresh on 401', () => {
    it('should attempt token refresh on 401 error', async () => {
        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        vi.spyOn(supabaseAuthService, 'refreshSession').mockResolvedValue({
            accessToken: 'new-token',
            refreshToken: 'new-refresh-token',
            expiresAt: Date.now() + 3600000,
        } as any);

        const success = await attemptTokenRefresh();
        expect(success).toBe(true);
        expect(supabaseAuthService.refreshSession).toHaveBeenCalled();
    });

    it('should return false when token refresh fails', async () => {
        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        vi.spyOn(supabaseAuthService, 'refreshSession').mockResolvedValue(null as any);

        const success = await attemptTokenRefresh();
        expect(success).toBe(false);
    });

    it('should return false when token refresh throws error', async () => {
        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        vi.spyOn(supabaseAuthService, 'refreshSession').mockRejectedValue(
            new Error('Refresh failed')
        );

        const success = await attemptTokenRefresh();
        expect(success).toBe(false);
    });

    it('should verify token refresh via SupabaseAuthService', async () => {
        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');

        const newToken = 'new-access-token';
        vi.spyOn(supabaseAuthService, 'refreshSession').mockResolvedValue({
            accessToken: newToken,
            refreshToken: 'new-refresh-token',
            expiresAt: Date.now() + 3600000,
        } as any);

        const success = await attemptTokenRefresh();

        expect(success).toBe(true);
        expect(supabaseAuthService.refreshSession).toHaveBeenCalled();
    });

    it('should handle concurrent refresh attempts', async () => {
        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        const refreshSpy = vi.spyOn(supabaseAuthService, 'refreshSession').mockResolvedValue({
            accessToken: 'new-token',
            refreshToken: 'new-refresh-token',
            expiresAt: Date.now() + 3600000,
        } as any);

        // Start multiple concurrent refresh attempts
        const [result1, result2, result3] = await Promise.all([
            attemptTokenRefresh(),
            attemptTokenRefresh(),
            attemptTokenRefresh(),
        ]);

        expect(result1).toBe(true);
        expect(result2).toBe(true);
        expect(result3).toBe(true);
        // Should only call refresh once
        expect(refreshSpy).toHaveBeenCalledTimes(1);
    });
});

describe('ErrorHandler - Retry Mechanism', () => {
    it('should retry recoverable errors', async () => {
        const retryCallback = vi.fn()
            .mockRejectedValueOnce(createMockNetworkError())
            .mockResolvedValueOnce({ success: true });

        const error = createMockNetworkError();
        const result = await handleApiErrorWithRetry(error, 'test', retryCallback, 0);

        expect(result).toBe(true);
        expect(retryCallback).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-recoverable errors', async () => {
        const retryCallback = vi.fn();

        const error: ApiError = {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Validation failed',
            statusCode: 400,
        };

        const result = await handleApiErrorWithRetry(error, 'test', retryCallback, 0);

        expect(result).toBe(false);
        expect(retryCallback).not.toHaveBeenCalled();
    });

    it('should respect max retry limit', async () => {
        const retryCallback = vi.fn().mockRejectedValue(createMockNetworkError());

        const error = createMockNetworkError();
        const result = await handleApiErrorWithRetry(error, 'test', retryCallback, 0);

        expect(result).toBe(false);
        expect(retryCallback).toHaveBeenCalledTimes(3); // maxAuthRetries = 3
    });

    it('should use exponential backoff for retries', async () => {
        const retryCallback = vi.fn()
            .mockRejectedValueOnce(createMockNetworkError())
            .mockRejectedValueOnce(createMockNetworkError())
            .mockResolvedValueOnce({ success: true });

        const error = createMockNetworkError();
        const startTime = Date.now();

        await handleApiErrorWithRetry(error, 'test', retryCallback, 0);

        const elapsed = Date.now() - startTime;
        // Should have waited for backoff delays (1000ms + 2000ms)
        expect(elapsed).toBeGreaterThanOrEqual(3000);
    });

    it('should try token refresh before retrying auth errors', async () => {
        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        vi.spyOn(supabaseAuthService, 'refreshSession').mockResolvedValue({
            accessToken: 'new-token',
            refreshToken: 'new-refresh-token',
            expiresAt: Date.now() + 3600000,
        } as any);

        const retryCallback = vi.fn().mockResolvedValue({ success: true });

        const error = createMock401Error();
        const result = await handleApiErrorWithRetry(error, 'test', retryCallback, 0);

        expect(result).toBe(true);
        expect(supabaseAuthService.refreshSession).toHaveBeenCalled();
        expect(retryCallback).toHaveBeenCalled();
    });
});

describe('ErrorHandler - Offline Detection', () => {
    it('should detect offline status', () => {
        // Mock navigator.onLine
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: false,
        });

        const isOffline = checkOfflineStatus();
        expect(isOffline).toBe(true);

        // Reset
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true,
        });
    });

    it('should detect online status', () => {
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true,
        });

        const isOffline = checkOfflineStatus();
        expect(isOffline).toBe(false);
    });

    it('should setup offline detection listeners', () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

        const cleanup = setupOfflineDetection();

        expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
        expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

        cleanup();
        addEventListenerSpy.mockRestore();
    });

    it('should show notification when going offline', () => {
        configureErrorHandler({
            enableNotifications: true,
            enableOfflineDetection: true,
        });

        const notificationCallback = vi.fn();
        setNotificationCallback(notificationCallback);

        setupOfflineDetection();

        // Simulate going offline
        const offlineEvent = new Event('offline');
        window.dispatchEvent(offlineEvent);

        expect(notificationCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'warning',
                title: 'Sem Conexão',
            })
        );
    });

    it('should show notification when coming online', () => {
        configureErrorHandler({
            enableNotifications: true,
            enableOfflineDetection: true,
        });

        const notificationCallback = vi.fn();
        setNotificationCallback(notificationCallback);

        setupOfflineDetection();

        // Simulate going offline first
        window.dispatchEvent(new Event('offline'));

        // Then come online
        const onlineEvent = new Event('online');
        window.dispatchEvent(onlineEvent);

        expect(notificationCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'success',
                title: 'Conexão Restaurada',
            })
        );
    });
});

describe('ErrorHandler - API Error Handling', () => {
    it('should handle NETWORK_ERROR', () => {
        const error: ApiError = {
            code: ErrorCode.NETWORK_ERROR,
            message: 'Network error',
            statusCode: 0,
        };

        const notificationCallback = vi.fn();
        setNotificationCallback(notificationCallback);

        handleApiError(error, 'test');

        expect(notificationCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'error',
                title: 'Erro de Conexão',
            })
        );
    });

    it('should handle TIMEOUT_ERROR', () => {
        const error: ApiError = {
            code: ErrorCode.TIMEOUT_ERROR,
            message: 'Request timeout',
            statusCode: 408,
        };

        const notificationCallback = vi.fn();
        setNotificationCallback(notificationCallback);

        handleApiError(error, 'test');

        expect(notificationCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'warning',
                title: 'Tempo Esgotado',
            })
        );
    });

    it('should handle AUTHENTICATION_ERROR with token refresh', async () => {
        const { supabaseAuthService } = await import('@/services/auth/SupabaseAuthService');
        vi.spyOn(supabaseAuthService, 'refreshSession').mockResolvedValue({
            accessToken: 'new-token',
            refreshToken: 'new-refresh-token',
            expiresAt: Date.now() + 3600000,
        } as any);

        const error: ApiError = {
            code: ErrorCode.AUTHENTICATION_ERROR,
            message: 'Unauthorized',
            statusCode: 401,
        };

        const retryCallback = vi.fn().mockResolvedValue({ success: true });
        const notificationCallback = vi.fn();
        setNotificationCallback(notificationCallback);

        handleApiError(error, 'test', retryCallback);

        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(supabaseAuthService.refreshSession).toHaveBeenCalled();
        expect(notificationCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'success',
                title: 'Sessão Renovada',
            })
        );
    });

    it('should handle AUTHORIZATION_ERROR', () => {
        const error: ApiError = {
            code: ErrorCode.AUTHORIZATION_ERROR,
            message: 'Forbidden',
            statusCode: 403,
        };

        const notificationCallback = vi.fn();
        setNotificationCallback(notificationCallback);

        handleApiError(error, 'test');

        expect(notificationCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'error',
                title: 'Acesso Negado',
            })
        );
    });

    it('should handle VALIDATION_ERROR', () => {
        const error: ApiError = {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Validation failed',
            statusCode: 400,
            details: { message: 'Email is required' },
        };

        const notificationCallback = vi.fn();
        setNotificationCallback(notificationCallback);

        handleApiError(error, 'test');

        expect(notificationCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'warning',
                title: 'Dados Inválidos',
            })
        );
    });

    it('should handle NOT_FOUND_ERROR', () => {
        const error: ApiError = {
            code: ErrorCode.NOT_FOUND_ERROR,
            message: 'Not found',
            statusCode: 404,
        };

        const notificationCallback = vi.fn();
        setNotificationCallback(notificationCallback);

        handleApiError(error, 'test');

        expect(notificationCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'info',
                title: 'Não Encontrado',
            })
        );
    });

    it('should handle SERVER_ERROR', () => {
        const error: ApiError = {
            code: ErrorCode.SERVER_ERROR,
            message: 'Internal server error',
            statusCode: 500,
        };

        const notificationCallback = vi.fn();
        setNotificationCallback(notificationCallback);

        handleApiError(error, 'test');

        expect(notificationCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'error',
                title: 'Erro do Servidor',
            })
        );
    });
});

describe('ErrorHandler - Notification Helpers', () => {
    it('should show success notification', () => {
        const notificationCallback = vi.fn();
        setNotificationCallback(notificationCallback);

        const id = showSuccess('Success title', 'Success message');

        expect(id).toBeDefined();
        expect(notificationCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'success',
                title: 'Success title',
                message: 'Success message',
            })
        );
    });

    it('should show warning notification', () => {
        const notificationCallback = vi.fn();
        setNotificationCallback(notificationCallback);

        const id = showWarning('Warning title', 'Warning message');

        expect(id).toBeDefined();
        expect(notificationCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'warning',
                title: 'Warning title',
                message: 'Warning message',
            })
        );
    });

    it('should show info notification', () => {
        const notificationCallback = vi.fn();
        setNotificationCallback(notificationCallback);

        const id = showInfo('Info title', 'Info message');

        expect(id).toBeDefined();
        expect(notificationCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'info',
                title: 'Info title',
                message: 'Info message',
            })
        );
    });

    it('should generate unique notification IDs', () => {
        const notificationCallback = vi.fn();
        setNotificationCallback(notificationCallback);

        const id1 = showSuccess('Title 1');
        const id2 = showSuccess('Title 2');
        const id3 = showSuccess('Title 3');

        expect(id1).not.toBe(id2);
        expect(id2).not.toBe(id3);
    });
});

describe('ErrorHandler - AppError Creation', () => {
    it('should create AppError with default values', () => {
        const error = createAppError('Test error');

        expect(error.message).toBe('Test error');
        expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
        expect(error.statusCode).toBe(500);
        expect(error.name).toBe('AppError');
    });

    it('should create AppError with custom values', () => {
        const error = createAppError(
            'Test error',
            ErrorCode.VALIDATION_ERROR,
            'test-context'
        );

        expect(error.message).toBe('Test error');
        expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(error.context).toBe('test-context');
    });
});

describe('ErrorHandler - Recoverable Error Detection', () => {
    it('should identify NETWORK_ERROR as recoverable', () => {
        const error: ApiError = {
            code: ErrorCode.NETWORK_ERROR,
            message: 'Network error',
            statusCode: 0,
        };

        expect(isRecoverableError(error)).toBe(true);
    });

    it('should identify TIMEOUT_ERROR as recoverable', () => {
        const error: ApiError = {
            code: ErrorCode.TIMEOUT_ERROR,
            message: 'Timeout',
            statusCode: 408,
        };

        expect(isRecoverableError(error)).toBe(true);
    });

    it('should identify SERVER_ERROR as recoverable', () => {
        const error: ApiError = {
            code: ErrorCode.SERVER_ERROR,
            message: 'Server error',
            statusCode: 500,
        };

        expect(isRecoverableError(error)).toBe(true);
    });

    it('should identify VALIDATION_ERROR as not recoverable', () => {
        const error: ApiError = {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Validation failed',
            statusCode: 400,
        };

        expect(isRecoverableError(error)).toBe(false);
    });

    it('should identify AUTHENTICATION_ERROR as not recoverable', () => {
        const error: ApiError = {
            code: ErrorCode.AUTHENTICATION_ERROR,
            message: 'Unauthorized',
            statusCode: 401,
        };

        expect(isRecoverableError(error)).toBe(false);
    });
});

describe('ErrorHandler - User Friendly Messages', () => {
    it('should return friendly message for NETWORK_ERROR', () => {
        const error: ApiError = {
            code: ErrorCode.NETWORK_ERROR,
            message: 'Network error',
            statusCode: 0,
        };

        const message = getUserFriendlyMessage(error);
        expect(message).toContain('conexão');
    });

    it('should return friendly message for TIMEOUT_ERROR', () => {
        const error: ApiError = {
            code: ErrorCode.TIMEOUT_ERROR,
            message: 'Timeout',
            statusCode: 408,
        };

        const message = getUserFriendlyMessage(error);
        expect(message).toContain('tempo');
    });

    it('should return friendly message for AUTHENTICATION_ERROR', () => {
        const error: ApiError = {
            code: ErrorCode.AUTHENTICATION_ERROR,
            message: 'Unauthorized',
            statusCode: 401,
        };

        const message = getUserFriendlyMessage(error);
        expect(message).toContain('login');
    });

    it('should return friendly message for AUTHORIZATION_ERROR', () => {
        const error: ApiError = {
            code: ErrorCode.AUTHORIZATION_ERROR,
            message: 'Forbidden',
            statusCode: 403,
        };

        const message = getUserFriendlyMessage(error);
        expect(message).toContain('permissão');
    });

    it('should return friendly message for VALIDATION_ERROR', () => {
        const error: ApiError = {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Validation failed',
            statusCode: 400,
        };

        const message = getUserFriendlyMessage(error);
        expect(message).toContain('verifique');
    });
});

describe('ErrorHandler - Auth Recovery Callback', () => {
    it('should call auth recovery callback on auth error', () => {
        const error: ApiError = {
            code: ErrorCode.AUTHENTICATION_ERROR,
            message: 'Unauthorized',
            statusCode: 401,
        };

        const recoveryCallback = vi.fn();
        setAuthRecoveryCallback(recoveryCallback);

        const notificationCallback = vi.fn();
        setNotificationCallback(notificationCallback);

        configureErrorHandler({
            enableTokenRefresh: false, // Disable auto refresh to test callback
        });

        handleApiError(error, 'test');

        // Get action from notification
        const notificationCall = notificationCallback.mock.calls[0][0];
        const action = notificationCall.action;

        if (action) {
            action.onClick();
        }

        expect(recoveryCallback).toHaveBeenCalledWith('login');
    });
});
