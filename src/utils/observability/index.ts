/**
 * Observability module exports
 * Centralized exports for error context and Sentry integration
 */

export type { ErrorContext, ErrorContextOptions } from './errorContext';
export {
    ErrorContextManager,
    createErrorContext,
    getErrorContext,
    setErrorContext,
    clearErrorContext,
    setUserContext,
    clearUserContext,
    setComponentContext,
    setActionContext,
} from './errorContext';

export {
    initSentry,
    captureError,
    captureMessage,
    captureErrorWithContext,
    setSentryUser,
    clearSentryUser,
    addBreadcrumb,
    setTag,
    setExtra,
    setSentryContext,
    isSentryInitialized,
} from './sentryIntegration';
