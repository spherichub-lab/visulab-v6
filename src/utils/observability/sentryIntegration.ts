/**
 * Sentry Integration - Error tracking and monitoring
 * Provides integration with Sentry for production error tracking
 * 
 * Note: This module requires @sentry/react to be installed.
 * Install with: npm install @sentry/react
 */

import { ErrorContext, ErrorContextManager } from './errorContext';

// Type definitions for Sentry (will be resolved when package is installed)
type SentrySeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

interface SentryEvent {
    contexts?: Record<string, any>;
    extra?: Record<string, any>;
    tags?: Record<string, string>;
}

interface SentryEventHint {
    extra?: Record<string, any>;
}

interface SentryUser {
    id?: string;
    email?: string;
    username?: string;
}

interface SentryBreadcrumb {
    message?: string;
    category?: string;
    level?: SentrySeverityLevel;
    data?: Record<string, any>;
}

// Lazy import of Sentry
let SentryModule: any = null;

/**
 * Initialize Sentry
 */
export function initSentry(config: {
    dsn: string;
    environment?: string;
    tracesSampleRate?: number;
    release?: string;
}): void {
    if (!config.dsn || config.dsn === 'undefined' || config.dsn === '') {
        console.warn('Sentry DSN not configured. Skipping Sentry initialization.');
        return;
    }

    // Lazy load Sentry only when needed
    try {
        // Dynamic import to avoid build errors if package is not installed
        import('@sentry/react').then((sentry) => {
            SentryModule = sentry;

            sentry.init({
                dsn: config.dsn,
                environment: config.environment || process.env.NODE_ENV || 'development',
                tracesSampleRate: config.tracesSampleRate || 0.1,
                release: config.release || process.env.VITE_APP_VERSION,
                beforeSend: defaultBeforeSend,
                integrations: [
                    new sentry.BrowserTracing(),
                    new sentry.Replay({
                        maskAllText: false,
                        blockAllMedia: false,
                    }),
                ],
                replaysSessionSampleRate: 0.1,
                replaysOnErrorSampleRate: 1.0,
            });
        }).catch((error) => {
            console.warn('Failed to load Sentry:', error);
        });
    } catch (error) {
        console.warn('Sentry package not installed. Install with: npm install @sentry/react');
    }
}

/**
 * Default beforeSend handler
 */
function defaultBeforeSend(event: SentryEvent, hint?: SentryEventHint): SentryEvent | null {
    // Enrich event with error context
    const context = ErrorContextManager.getInstance().getContext();

    event.contexts = {
        ...event.contexts,
        app: {
            correlationId: context.correlationId,
            userId: context.userId,
            sessionId: context.sessionId,
            component: context.component,
            action: context.action,
            environment: context.environment,
            url: context.url,
        },
    };

    // Filter out certain errors in development
    if (process.env.NODE_ENV === 'development') {
        // Don't send errors in development
        return null;
    }

    return event;
}

/**
 * Capture error with context
 */
export function captureError(error: Error, context?: Record<string, any>): void {
    if (SentryModule) {
        SentryModule.captureException(error, {
            extra: context,
            tags: {
                ...context,
            },
        });
    } else {
        console.error('Error captured:', error, context);
    }
}

/**
 * Capture message with context
 */
export function captureMessage(message: string, level: SentrySeverityLevel = 'info', context?: Record<string, any>): void {
    if (SentryModule) {
        SentryModule.captureMessage(message, {
            level,
            extra: context,
            tags: {
                ...context,
            },
        });
    } else {
        console.log(`[${level.toUpperCase()}] ${message}`, context);
    }
}

/**
 * Capture error with error context
 */
export function captureErrorWithContext(error: Error, errorContext?: Partial<ErrorContext>): void {
    const manager = ErrorContextManager.getInstance();
    const context = errorContext ? { ...manager.getContext(), ...errorContext } : manager.getContext();

    if (SentryModule) {
        SentryModule.captureException(error, {
            extra: {
                correlationId: context.correlationId,
                userId: context.userId,
                sessionId: context.sessionId,
                component: context.component,
                action: context.action,
                environment: context.environment,
                url: context.url,
                userAgent: context.userAgent,
            },
            tags: {
                component: context.component,
                action: context.action,
                userId: context.userId,
            },
        });
    } else {
        console.error('Error captured with context:', error, context);
    }
}

/**
 * Set user context in Sentry
 */
export function setSentryUser(userId: string, email?: string, username?: string): void {
    if (SentryModule) {
        SentryModule.setUser({
            id: userId,
            email,
            username,
        });
    } else {
        console.log('User context set:', { userId, email, username });
    }
}

/**
 * Clear user context in Sentry
 */
export function clearSentryUser(): void {
    if (SentryModule) {
        SentryModule.setUser(null);
    } else {
        console.log('User context cleared');
    }
}

/**
 * Add breadcrumb to Sentry
 */
export function addBreadcrumb(
    message: string,
    category?: string,
    level?: SentrySeverityLevel,
    data?: Record<string, any>
): void {
    if (SentryModule) {
        SentryModule.addBreadcrumb({
            message,
            category,
            level,
            data,
        });
    } else {
        console.log(`Breadcrumb: [${category || 'default'}] ${message}`, data);
    }
}

/**
 * Set tag in Sentry
 */
export function setTag(key: string, value: string): void {
    if (SentryModule) {
        SentryModule.setTag(key, value);
    } else {
        console.log(`Tag set: ${key} = ${value}`);
    }
}

/**
 * Set extra data in Sentry
 */
export function setExtra(key: string, value: any): void {
    if (SentryModule) {
        SentryModule.setExtra(key, value);
    } else {
        console.log(`Extra set: ${key} =`, value);
    }
}

/**
 * Set context in Sentry
 */
export function setSentryContext(key: string, context: Record<string, any>): void {
    if (SentryModule) {
        SentryModule.setContext(key, context);
    } else {
        console.log(`Context set: ${key}`, context);
    }
}

/**
 * Check if Sentry is initialized
 */
export function isSentryInitialized(): boolean {
    return SentryModule !== null;
}

export default {
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
};
