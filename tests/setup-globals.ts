/**
 * Global setup file that runs before any test imports
 * This file is loaded by vitest.config.ts with setupFiles option
 * It must be loaded before any other setup files to prevent side effects
 */

import { vi } from 'vitest';

// ============================================================================
// MOCK MODULES BEFORE ANY IMPORTS (HOISTED)
// ============================================================================

// Mock @/utils/observability
vi.mock('@/utils/observability', () => ({
    getErrorContext: () => ({ correlationId: 'test-correlation-id', environment: 'test' }),
    captureErrorWithContext: () => { },
    addBreadcrumb: () => { },
    setComponentContext: () => { },
    setActionContext: () => { },
    setErrorContext: () => { },
    clearErrorContext: () => { },
    setUserContext: () => { },
    clearUserContext: () => { },
    initSentry: () => { },
    captureError: () => { },
    captureMessage: () => { },
    setSentryUser: () => { },
    clearSentryUser: () => { },
    setTag: () => { },
    setExtra: () => { },
    setSentryContext: () => { },
    isSentryInitialized: () => false,
}));

// Mock @/utils/errorHandler
vi.mock('@/utils/errorHandler', () => ({
    configureErrorHandler: () => { },
    setNotificationCallback: () => { },
    setAuthRecoveryCallback: () => { },
    showNotification: () => 'mock-id',
    showSuccess: () => 'mock-id',
    showWarning: () => 'mock-id',
    showInfo: () => 'mock-id',
    handleApiError: () => { },
    handleApiErrorWithRetry: () => Promise.resolve(false),
    attemptTokenRefresh: () => Promise.resolve(false),
    getAuthErrorType: () => 'UNKNOWN',
    getAuthErrorMessage: () => 'Mock error message',
    checkOfflineStatus: () => false,
    setupOfflineDetection: () => () => { },
    createAppError: () => ({ name: 'AppError', message: 'Mock error', code: 'UNKNOWN_ERROR', statusCode: 500 }),
    isRecoverableError: () => false,
    getUserFriendlyMessage: () => 'Mock error message',
    handleError: () => { },
    handleBoundaryError: () => { },
    logError: () => { },
    AuthErrorType: {
        SESSION_EXPIRED: 'SESSION_EXPIRED',
        INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
        TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',
        PERMISSION_DENIED: 'PERMISSION_DENIED',
        NETWORK_ERROR: 'NETWORK_ERROR',
        OFFLINE: 'OFFLINE',
        UNKNOWN: 'UNKNOWN',
    },
}));

// Mock @sentry/react
vi.mock('@sentry/react', () => ({
    init: () => { },
    BrowserTracing: class { },
    Replay: class { },
    captureException: () => { },
    captureMessage: () => { },
    addBreadcrumb: () => { },
    setUser: () => { },
    setTag: () => { },
    setExtra: () => { },
    setContext: () => { },
}));

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        auth: {
            signInWithPassword: () => Promise.resolve({ data: { user: { id: 'test-id', email: 'test@example.com' }, session: { access_token: 'test-token', refresh_token: 'test-refresh', expires_at: Date.now() + 3600000 } }, error: null }),
            signOut: () => Promise.resolve({ error: null }),
            getUser: () => Promise.resolve({ data: { user: { id: 'test-id', email: 'test@example.com' } }, error: null }),
            getSession: () => Promise.resolve({ data: { session: { user: { id: 'test-id', email: 'test@example.com' }, access_token: 'test-token', refresh_token: 'test-refresh', expires_at: Date.now() + 3600000 } }, error: null }),
            refreshSession: () => Promise.resolve({ data: { session: { user: { id: 'test-id', email: 'test@example.com' }, access_token: 'test-token', refresh_token: 'test-refresh', expires_at: Date.now() + 3600000 } }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        },
    }),
}));

// Mock axios
vi.mock('axios', () => ({
    create: () => ({
        get: () => { },
        post: () => { },
        put: () => { },
        delete: () => { },
        interceptors: {
            request: { use: () => { }, eject: () => { } },
            response: { use: () => { }, eject: () => { } },
        },
    }),
    default: {
        get: () => { },
        post: () => { },
        put: () => { },
        delete: () => { },
    },
}));

// ============================================================================
// MOCK WINDOW AND NAVIGATOR
// ============================================================================

if (typeof window !== 'undefined') {
    // Mock navigator
    Object.defineProperty(window, 'navigator', {
        value: {
            userAgent: 'test-user-agent',
            onLine: true,
        },
        writable: true,
        configurable: true,
    });

    // Mock location
    Object.defineProperty(window, 'location', {
        value: {
            href: 'http://localhost:3000',
        },
        writable: true,
        configurable: true,
    });
}
