/**
 * ErrorContextManager - Manages error context and correlation IDs
 * Provides centralized error context enrichment for observability
 */

export interface ErrorContext {
    correlationId: string;
    userId?: string;
    sessionId?: string;
    component?: string;
    action?: string;
    timestamp: string;
    environment: string;
    userAgent?: string;
    url?: string;
}

export interface ErrorContextOptions {
    userId?: string;
    sessionId?: string;
    component?: string;
    action?: string;
}

/**
 * ErrorContextManager - Singleton for managing error context
 */
export class ErrorContextManager {
    private static instance: ErrorContextManager;
    private context: Partial<ErrorContext> = {};
    private sessionId: string;

    private constructor() {
        this.sessionId = this.generateSessionId();
        this.context = {
            sessionId: this.sessionId,
            environment: this.getEnvironment(),
            userAgent: this.getUserAgent(),
            url: this.getCurrentUrl(),
        };
    }

    /**
     * Get singleton instance
     */
    static getInstance(): ErrorContextManager {
        if (!ErrorContextManager.instance) {
            ErrorContextManager.instance = new ErrorContextManager();
        }
        return ErrorContextManager.instance;
    }

    /**
     * Set error context
     */
    setContext(options: ErrorContextOptions): void {
        this.context = { ...this.context, ...options };
    }

    /**
     * Get current error context
     */
    getContext(): ErrorContext {
        return {
            correlationId: this.generateCorrelationId(),
            timestamp: new Date().toISOString(),
            environment: this.getEnvironment(),
            userAgent: this.getUserAgent(),
            url: this.getCurrentUrl(),
            ...this.context,
        };
    }

    /**
     * Get partial context (without auto-generated fields)
     */
    getPartialContext(): Partial<ErrorContext> {
        return { ...this.context };
    }

    /**
     * Clear context
     */
    clearContext(): void {
        this.context = {
            sessionId: this.sessionId,
            environment: this.getEnvironment(),
            userAgent: this.getUserAgent(),
            url: this.getCurrentUrl(),
        };
    }

    /**
     * Set user context
     */
    setUser(userId: string): void {
        this.context.userId = userId;
    }

    /**
     * Clear user context
     */
    clearUser(): void {
        delete this.context.userId;
    }

    /**
     * Set component context
     */
    setComponent(component: string): void {
        this.context.component = component;
    }

    /**
     * Set action context
     */
    setAction(action: string): void {
        this.context.action = action;
    }

    /**
     * Generate correlation ID
     */
    private generateCorrelationId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Generate session ID
     */
    private generateSessionId(): string {
        return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Get environment
     */
    private getEnvironment(): string {
        return process.env.NODE_ENV || 'development';
    }

    /**
     * Get user agent
     */
    private getUserAgent(): string {
        if (typeof window !== 'undefined') {
            return window.navigator.userAgent;
        }
        return 'server';
    }

    /**
     * Get current URL
     */
    private getCurrentUrl(): string {
        if (typeof window !== 'undefined') {
            return window.location.href;
        }
        return 'server';
    }
}

/**
 * Create error context helper
 */
export function createErrorContext(options?: ErrorContextOptions): ErrorContext {
    const manager = ErrorContextManager.getInstance();
    if (options) {
        manager.setContext(options);
    }
    return manager.getContext();
}

/**
 * Get current error context
 */
export function getErrorContext(): ErrorContext {
    return ErrorContextManager.getInstance().getContext();
}

/**
 * Set error context
 */
export function setErrorContext(options: ErrorContextOptions): void {
    ErrorContextManager.getInstance().setContext(options);
}

/**
 * Clear error context
 */
export function clearErrorContext(): void {
    ErrorContextManager.getInstance().clearContext();
}

/**
 * Set user context
 */
export function setUserContext(userId: string): void {
    ErrorContextManager.getInstance().setUser(userId);
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
    ErrorContextManager.getInstance().clearUser();
}

/**
 * Set component context
 */
export function setComponentContext(component: string): void {
    ErrorContextManager.getInstance().setComponent(component);
}

/**
 * Set action context
 */
export function setActionContext(action: string): void {
    ErrorContextManager.getInstance().setAction(action);
}

export default ErrorContextManager;
