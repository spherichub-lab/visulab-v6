/**
 * Retry Strategy
 * Framework-agnostic retry logic with exponential backoff and jitter
 * Can be used with any async operation, not tied to React Query
 */

import { Logger } from '../../utils/logger/logger';

/**
 * Retry configuration
 */
export interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    jitterFactor: number;
    retryableErrors?: string[]; // Error codes that should be retried
    nonRetryableErrors?: string[]; // Error codes that should NOT be retried
}

/**
 * Retry result
 */
export interface RetryResult<T> {
    success: boolean;
    data?: T;
    error?: any;
    attempts: number;
    totalDelay: number;
}

/**
 * Retry context
 */
export interface RetryContext {
    operation: string;
    attempt: number;
    maxAttempts: number;
    delay: number;
    error: any;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    jitterFactor: 0.1,
    retryableErrors: [
        // Network errors
        'NETWORK_ERROR',
        'CONNECTION_ERROR',
        'TIMEOUT',
        // Database connection errors
        '08000', // connection exception
        '08001', // SQL client unable to establish SQL connection
        '08003', // connection does not exist
        '08004', // SQL server rejected establishment of SQL connection
        '08006', // connection failure
        '08007', // transaction resolution unknown
        '08P01', // protocol violation
        // Resource errors
        '53000', // insufficient resources
        '53100', // disk full
        '53200', // out of memory
        '53300', // too many connections
        '53400', // configuration limit exceeded
        // Temporary errors
        '57P01', // admin shutdown
        '57P02', // crash shutdown
        '57P03', // cannot connect now
        'PGRST000' // Supabase connection error
    ],
    nonRetryableErrors: [
        // Authorization errors
        'PGRST302',
        'PGRST303',
        '42501',
        // Authentication errors
        'PGRST301',
        'PGRST116',
        // Validation errors
        '23505', // unique violation
        '23503', // foreign key violation
        '23502', // not null violation
        '23514', // check violation
        // Constraint violations (all 23xxx codes)
        '23'
    ]
};

/**
 * Retry strategy class
 */
export class RetryStrategy {
    private logger: Logger;
    private config: RetryConfig;

    constructor(config?: Partial<RetryConfig>, logger?: Logger) {
        this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
        this.logger = logger || new Logger('RetryStrategy');
    }

    /**
     * Execute operation with retry logic
     */
    async execute<T>(
        operation: string,
        fn: () => Promise<T>,
        context?: Record<string, any>
    ): Promise<T> {
        let lastError: any;
        let totalDelay = 0;

        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                this.logger.debug(`Executing operation: ${operation}`, {
                    attempt,
                    maxAttempts: this.config.maxRetries,
                    context
                });

                const result = await fn();

                if (attempt > 1) {
                    this.logger.info(`Operation succeeded after ${attempt} attempts: ${operation}`, {
                        totalDelay,
                        context
                    });
                }

                return result;
            } catch (error) {
                lastError = error;

                if (!this.shouldRetry(error, attempt, this.config.maxRetries)) {
                    this.logger.error(`Operation failed after ${attempt} attempts: ${operation}`, {
                        error: this.extractErrorMessage(error),
                        attempts: attempt,
                        context
                    });
                    throw error;
                }

                const delay = this.calculateDelay(attempt);
                totalDelay += delay;

                this.logger.warn(`Retrying operation: ${operation}`, {
                    attempt,
                    maxAttempts: this.config.maxRetries,
                    delay: Math.round(delay),
                    error: this.extractErrorMessage(error),
                    context
                });

                await this.sleep(delay);
            }
        }

        this.logger.error(`Operation failed after ${this.config.maxRetries} attempts: ${operation}`, {
            error: this.extractErrorMessage(lastError),
            totalDelay,
            context
        });

        throw lastError;
    }

    /**
     * Execute with detailed retry result
     */
    async executeWithResult<T>(
        operation: string,
        fn: () => Promise<T>,
        context?: Record<string, any>
    ): Promise<RetryResult<T>> {
        try {
            const data = await this.execute(operation, fn, context);
            return {
                success: true,
                data,
                attempts: 1,
                totalDelay: 0
            };
        } catch (error) {
            return {
                success: false,
                error,
                attempts: this.config.maxRetries,
                totalDelay: 0 // Will be updated in execute
            };
        }
    }

    /**
     * Check if error should be retried
     */
    shouldRetry(error: any, attempt: number, maxAttempts: number): boolean {
        // Don't retry if we've exceeded max attempts
        if (attempt >= maxAttempts) {
            return false;
        }

        const errorCode = this.extractErrorCode(error);

        // Check non-retryable errors first (explicit blocklist)
        if (this.config.nonRetryableErrors?.some(code =>
            errorCode?.startsWith(code) || errorCode === code
        )) {
            return false;
        }

        // Check retryable errors (allowlist)
        if (this.config.retryableErrors?.some(code =>
            errorCode?.startsWith(code) || errorCode === code
        )) {
            return true;
        }

        // Default: don't retry unknown errors
        return false;
    }

    /**
     * Calculate delay with exponential backoff and jitter
     */
    calculateDelay(attempt: number): number {
        const exponentialDelay = this.config.baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * this.config.jitterFactor * exponentialDelay;
        const delay = exponentialDelay + jitter;
        return Math.min(delay, this.config.maxDelay);
    }

    /**
     * Get retry configuration
     */
    getConfig(): RetryConfig {
        return { ...this.config };
    }

    /**
     * Update retry configuration
     */
    updateConfig(config: Partial<RetryConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Extract error code from error object
     */
    private extractErrorCode(error: any): string | undefined {
        if (typeof error === 'string') {
            return error;
        }
        return error?.code || error?.status?.toString();
    }

    /**
     * Extract error message
     */
    private extractErrorMessage(error: any): string {
        if (typeof error === 'string') {
            return error;
        }
        return error?.message || error?.toString() || 'Unknown error';
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Create retry strategy with default configuration
 */
export function createRetryStrategy(config?: Partial<RetryConfig>, logger?: Logger): RetryStrategy {
    return new RetryStrategy(config, logger);
}

/**
 * Execute operation with retry (convenience function)
 */
export async function retry<T>(
    operation: string,
    fn: () => Promise<T>,
    config?: Partial<RetryConfig>,
    context?: Record<string, any>
): Promise<T> {
    const strategy = createRetryStrategy(config);
    return strategy.execute(operation, fn, context);
}

/**
 * Execute operation with retry result (convenience function)
 */
export async function retryWithResult<T>(
    operation: string,
    fn: () => Promise<T>,
    config?: Partial<RetryConfig>,
    context?: Record<string, any>
): Promise<RetryResult<T>> {
    const strategy = createRetryStrategy(config);
    return strategy.executeWithResult(operation, fn, context);
}
