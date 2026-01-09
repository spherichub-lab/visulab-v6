/**
 * Type declarations for Sentry
 * These declarations are used when @sentry/react is not installed
 */

declare module '@sentry/react' {
    export interface BrowserTracingOptions {
        // Browser tracing options
    }

    export class BrowserTracing {
        constructor(options?: BrowserTracingOptions);
    }

    export interface ReplayOptions {
        maskAllText?: boolean;
        blockAllMedia?: boolean;
    }

    export class Replay {
        constructor(options?: ReplayOptions);
    }

    export interface InitOptions {
        dsn: string;
        environment?: string;
        tracesSampleRate?: number;
        release?: string;
        beforeSend?: (event: any, hint?: any) => any;
        integrations?: any[];
        replaysSessionSampleRate?: number;
        replaysOnErrorSampleRate?: number;
    }

    export function init(options: InitOptions): void;

    export function captureException(error: Error, options?: {
        extra?: Record<string, any>;
        tags?: Record<string, any>;
    }): void;

    export function captureMessage(message: string, options?: {
        level?: string;
        extra?: Record<string, any>;
        tags?: Record<string, any>;
    }): void;

    export function setUser(user: {
        id?: string;
        email?: string;
        username?: string;
    } | null): void;

    export function addBreadcrumb(breadcrumb: {
        message?: string;
        category?: string;
        level?: string;
        data?: Record<string, any>;
    }): void;

    export function setTag(key: string, value: string): void;

    export function setExtra(key: string, value: any): void;

    export function setContext(key: string, context: Record<string, any>): void;
}
