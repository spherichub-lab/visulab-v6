/**
 * Service Logger
 * Structured logging hooks for service operations
 * No UI concerns - pure logging utilities
 */

import { Logger } from './logger';

/**
 * Service operation context
 */
export interface ServiceOperationContext {
    serviceName: string;
    operation: string;
    entityId?: string;
    entityType?: string;
    userId?: string;
    metadata?: Record<string, any>;
}

/**
 * Service operation result
 */
export interface ServiceOperationResult {
    success: boolean;
    duration: number;
    error?: any;
    data?: any;
}

/**
 * Service logger class
 * Provides structured logging for service operations
 */
export class ServiceLogger {
    private logger: Logger;

    constructor(serviceName: string) {
        this.logger = new Logger(`Service:${serviceName}`);
    }

    /**
     * Log service operation start
     */
    logOperationStart(context: ServiceOperationContext): void {
        this.logger.info(`Operation started: ${context.operation}`, {
            service: context.serviceName,
            operation: context.operation,
            entityId: context.entityId,
            entityType: context.entityType,
            userId: context.userId,
            metadata: context.metadata
        });
    }

    /**
     * Log service operation success
     */
    logOperationSuccess(
        context: ServiceOperationContext,
        result: ServiceOperationResult
    ): void {
        this.logger.info(`Operation succeeded: ${context.operation}`, {
            service: context.serviceName,
            operation: context.operation,
            entityId: context.entityId,
            entityType: context.entityType,
            userId: context.userId,
            duration: result.duration,
            dataCount: Array.isArray(result.data) ? result.data.length : 1
        });
    }

    /**
     * Log service operation failure
     */
    logOperationFailure(
        context: ServiceOperationContext,
        result: ServiceOperationResult
    ): void {
        this.logger.error(`Operation failed: ${context.operation}`, {
            service: context.serviceName,
            operation: context.operation,
            entityId: context.entityId,
            entityType: context.entityType,
            userId: context.userId,
            duration: result.duration,
            error: this.extractErrorInfo(result.error)
        });
    }

    /**
     * Log service operation retry
     */
    logOperationRetry(
        context: ServiceOperationContext,
        attempt: number,
        maxAttempts: number,
        delay: number,
        error: any
    ): void {
        this.logger.warn(`Operation retrying: ${context.operation}`, {
            service: context.serviceName,
            operation: context.operation,
            entityId: context.entityId,
            entityType: context.entityType,
            userId: context.userId,
            attempt,
            maxAttempts,
            delay: Math.round(delay),
            error: this.extractErrorInfo(error)
        });
    }

    /**
     * Log service health check
     */
    logHealthCheck(serviceName: string, status: 'healthy' | 'degraded' | 'unhealthy', details?: any): void {
        const level = status === 'healthy' ? 'info' : status === 'degraded' ? 'warn' : 'error';
        this.logger[level](`Health check: ${serviceName}`, {
            service: serviceName,
            status,
            details
        });
    }

    /**
     * Log service initialization
     */
    logInitialization(serviceName: string, metadata?: Record<string, any>): void {
        this.logger.info(`Service initialized: ${serviceName}`, {
            service: serviceName,
            metadata
        });
    }

    /**
     * Log service disposal
     */
    logDisposal(serviceName: string): void {
        this.logger.info(`Service disposed: ${serviceName}`, {
            service: serviceName
        });
    }

    /**
     * Log validation error
     */
    logValidationError(
        context: ServiceOperationContext,
        validationErrors: Record<string, string[]>
    ): void {
        this.logger.warn(`Validation failed: ${context.operation}`, {
            service: context.serviceName,
            operation: context.operation,
            entityId: context.entityId,
            entityType: context.entityType,
            userId: context.userId,
            validationErrors
        });
    }

    /**
     * Log RLS violation
     */
    logRlsViolation(
        context: ServiceOperationContext,
        rlsError: {
            table: string;
            operation: string;
            role: string;
            code: string;
            message: string;
        }
    ): void {
        this.logger.error(`RLS violation detected: ${context.operation}`, {
            service: context.serviceName,
            operation: context.operation,
            entityId: context.entityId,
            entityType: context.entityType,
            userId: context.userId,
            rlsError
        });
    }

    /**
     * Log database query
     */
    logDatabaseQuery(
        context: ServiceOperationContext,
        query: {
            table: string;
            operation: 'select' | 'insert' | 'update' | 'delete';
            filters?: Record<string, any>;
            limit?: number;
        }
    ): void {
        this.logger.debug(`Database query: ${query.operation}`, {
            service: context.serviceName,
            operation: context.operation,
            table: query.table,
            queryOperation: query.operation,
            filters: this.sanitizeFilters(query.filters),
            limit: query.limit
        });
    }

    /**
     * Log cache hit/miss
     */
    logCacheOperation(
        context: ServiceOperationContext,
        operation: 'hit' | 'miss' | 'set' | 'invalidate',
        key: string
    ): void {
        this.logger.debug(`Cache ${operation}: ${key}`, {
            service: context.serviceName,
            operation: context.operation,
            cacheOperation: operation,
            key
        });
    }

    /**
     * Create operation context
     */
    createContext(
        serviceName: string,
        operation: string,
        additional?: Partial<ServiceOperationContext>
    ): ServiceOperationContext {
        return {
            serviceName,
            operation,
            ...additional
        };
    }

    /**
     * Execute operation with automatic logging
     */
    async executeWithLogging<T>(
        context: ServiceOperationContext,
        fn: () => Promise<T>
    ): Promise<T> {
        const startTime = performance.now();
        this.logOperationStart(context);

        try {
            const result = await fn();
            const duration = performance.now() - startTime;

            this.logOperationSuccess(context, {
                success: true,
                duration,
                data: result
            });

            return result;
        } catch (error) {
            const duration = performance.now() - startTime;

            this.logOperationFailure(context, {
                success: false,
                duration,
                error
            });

            throw error;
        }
    }

    /**
     * Extract error information for logging
     */
    private extractErrorInfo(error: any): any {
        if (!error) {
            return null;
        }

        if (typeof error === 'string') {
            return { message: error };
        }

        return {
            message: error.message,
            code: error.code,
            status: error.status,
            statusCode: error.statusCode,
            type: error.name || error.constructor?.name
        };
    }

    /**
     * Sanitize filters for logging (remove sensitive data)
     */
    private sanitizeFilters(filters?: Record<string, any>): Record<string, any> | undefined {
        if (!filters) {
            return undefined;
        }

        const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
        const sanitized: Record<string, any> = {};

        for (const [key, value] of Object.entries(filters)) {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                sanitized[key] = '[REDACTED]';
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }
}

/**
 * Create service logger
 */
export function createServiceLogger(serviceName: string): ServiceLogger {
    return new ServiceLogger(serviceName);
}

/**
 * Default service logger factory
 */
export class ServiceLoggerFactory {
    private static loggers: Map<string, ServiceLogger> = new Map();

    static get(serviceName: string): ServiceLogger {
        if (!this.loggers.has(serviceName)) {
            this.loggers.set(serviceName, new ServiceLogger(serviceName));
        }
        return this.loggers.get(serviceName)!;
    }

    static clear(): void {
        this.loggers.clear();
    }
}
