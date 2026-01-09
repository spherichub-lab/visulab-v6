/**
 * Supabase Error Handler
 * Standardized error mapping and recovery for Supabase operations
 */

import { Logger } from '../../utils/logger/logger';
import { ApplicationError, DatabaseError, ValidationError, AuthenticationError, AuthorizationError } from '../../utils/errors/applicationErrors';

export interface SupabaseError {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
}

export interface ParsedError {
    type: 'database' | 'validation' | 'authentication' | 'authorization' | 'network' | 'unknown';
    code: string;
    message: string;
    originalError: any;
    isRetryable: boolean;
}

export class SupabaseErrorHandler {
    private logger: Logger;

    constructor() {
        this.logger = new Logger('SupabaseErrorHandler');
    }

    /**
     * Handle and categorize Supabase errors
     */
    public handleError(error: any): ApplicationError {
        const parsedError = this.parseError(error);

        this.logger.error('Supabase error occurred', {
            type: parsedError.type,
            code: parsedError.code,
            message: parsedError.message,
            isRetryable: parsedError.isRetryable
        });

        switch (parsedError.type) {
            case 'database':
                return new DatabaseError(parsedError.message, parsedError.code);
            case 'validation':
                return new ValidationError(parsedError.message, parsedError.code);
            case 'authentication':
                return new AuthenticationError(parsedError.message, parsedError.code);
            case 'authorization':
                return new AuthorizationError(parsedError.message, parsedError.code);
            default:
                return new DatabaseError(parsedError.message, parsedError.code);
        }
    }

    /**
     * Parse and categorize error
     */
    private parseError(error: any): ParsedError {
        // Handle Supabase specific errors
        if (error?.code) {
            return this.parseSupabaseError(error);
        }

        // Handle network errors
        if (this.isNetworkError(error)) {
            return {
                type: 'network',
                code: 'NETWORK_ERROR',
                message: 'Network connection error. Please check your connection.',
                originalError: error,
                isRetryable: true
            };
        }

        // Handle authentication errors
        if (this.isAuthenticationError(error)) {
            return {
                type: 'authentication',
                code: 'AUTH_ERROR',
                message: 'Authentication failed. Please log in again.',
                originalError: error,
                isRetryable: false
            };
        }

        // Handle validation errors
        if (this.isValidationError(error)) {
            return {
                type: 'validation',
                code: 'VALIDATION_ERROR',
                message: error.message || 'Validation failed',
                originalError: error,
                isRetryable: false
            };
        }

        // Default to database error
        return {
            type: 'database',
            code: 'UNKNOWN_DB_ERROR',
            message: error?.message || 'An unknown database error occurred',
            originalError: error,
            isRetryable: false
        };
    }

    /**
     * Parse Supabase specific errors
     */
    private parseSupabaseError(error: SupabaseError): ParsedError {
        const code = error.code || 'UNKNOWN';

        // Database constraint violations
        if (code.startsWith('23')) {
            return {
                type: 'validation',
                code: 'CONSTRAINT_VIOLATION',
                message: this.getConstraintViolationMessage(error),
                originalError: error,
                isRetryable: false
            };
        }

        // Authentication errors
        if (code === 'PGRST301' || code === 'PGRST116') {
            return {
                type: 'authentication',
                code: 'AUTH_REQUIRED',
                message: 'Authentication required. Please log in.',
                originalError: error,
                isRetryable: false
            };
        }

        // Authorization errors
        if (code === 'PGRST302' || code === 'PGRST303') {
            return {
                type: 'authorization',
                code: 'ACCESS_DENIED',
                message: 'Access denied. You do not have permission to perform this action.',
                originalError: error,
                isRetryable: false
            };
        }

        // Not found errors
        if (code === 'PGRST116') {
            return {
                type: 'validation',
                code: 'NOT_FOUND',
                message: 'The requested resource was not found.',
                originalError: error,
                isRetryable: false
            };
        }

        // Connection errors
        if (code === 'PGRST000') {
            return {
                type: 'network',
                code: 'CONNECTION_ERROR',
                message: 'Connection to database failed. Please try again.',
                originalError: error,
                isRetryable: true
            };
        }

        // Default database error
        return {
            type: 'database',
            code: code,
            message: error.message || 'A database error occurred',
            originalError: error,
            isRetryable: this.isRetryableDatabaseError(code)
        };
    }

    /**
     * Get user-friendly message for constraint violations
     */
    private getConstraintViolationMessage(error: SupabaseError): string {
        const message = error.message?.toLowerCase() || '';
        const details = error.details?.toLowerCase() || '';

        if (message.includes('unique') || details.includes('unique')) {
            return 'This record already exists. Please use a different value.';
        }

        if (message.includes('foreign key') || details.includes('foreign key')) {
            return 'Referenced record does not exist. Please check your data.';
        }

        if (message.includes('not null') || details.includes('not null')) {
            return 'Required field is missing. Please fill in all required fields.';
        }

        if (message.includes('check') || details.includes('check')) {
            return 'Invalid data provided. Please check your input values.';
        }

        return 'Data validation failed. Please check your input and try again.';
    }

    /**
     * Check if error is a network error
     */
    private isNetworkError(error: any): boolean {
        return (
            error instanceof TypeError &&
            (error.message.includes('fetch') ||
                error.message.includes('network') ||
                error.message.includes('connection'))
        ) || (
                error?.name === 'TypeError' &&
                error?.message?.includes('Failed to fetch')
            );
    }

    /**
     * Check if error is an authentication error
     */
    private isAuthenticationError(error: any): boolean {
        return (
            error?.message?.includes('JWT') ||
            error?.message?.includes('token') ||
            error?.message?.includes('unauthorized') ||
            error?.message?.includes('authentication')
        );
    }

    /**
     * Check if error is a validation error
     */
    private isValidationError(error: any): boolean {
        return (
            error?.name === 'ValidationError' ||
            error?.message?.includes('validation') ||
            error?.message?.includes('invalid')
        );
    }

    /**
     * Check if database error is retryable
     */
    private isRetryableDatabaseError(code: string): boolean {
        const retryableCodes = [
            '08000', // connection exception
            '08001', // SQL client unable to establish SQL connection
            '08003', // connection does not exist
            '08004', // SQL server rejected establishment of SQL connection
            '08006', // connection failure
            '08007', // transaction resolution unknown
            '08P01', // protocol violation
            '53000', // insufficient resources
            '53100', // disk full
            '53200', // out of memory
            '53300', // too many connections
            '53400', // configuration limit exceeded
            '57P01', // admin shutdown
            '57P02', // crash shutdown
            '57P03'  // cannot connect now
        ];

        return retryableCodes.some(retryableCode => code.startsWith(retryableCode));
    }

    /**
     * Get retry delay for exponential backoff
     */
    public getRetryDelay(attempt: number, baseDelay: number = 1000): number {
        const maxDelay = 30000; // 30 seconds max
        const delay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
        return Math.min(delay + jitter, maxDelay);
    }

    /**
     * Check if error should be retried
     */
    public shouldRetry(error: any, attempt: number, maxAttempts: number = 3): boolean {
        if (attempt >= maxAttempts) {
            return false;
        }

        const parsedError = this.parseError(error);
        return parsedError.isRetryable;
    }

    /**
     * Create error response for API
     */
    public createErrorResponse(error: any): {
        success: false;
        error: {
            code: string;
            message: string;
            details?: any;
        };
    } {
        const appError = this.handleError(error);

        return {
            success: false,
            error: {
                code: appError.code,
                message: appError.message,
                details: error?.details
            }
        };
    }
}