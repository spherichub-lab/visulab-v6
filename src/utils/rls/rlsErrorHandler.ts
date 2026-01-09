/**
 * RLS Error Handler
 * Handle RLS policy violation errors and provide user-friendly messages
 * 
 * This handler:
 * - Handles RLS policy violation errors (403 responses)
 * - Provides user-friendly messages for RLS violations
 * - Logs RLS violations for audit purposes
 * - Implements retry logic for transient RLS errors
 */

import { Logger } from '../../../lib/utils/logger/logger';
import { AuthorizationError } from '../../../lib/utils/errors/applicationErrors';
import type { RlsContext, RlsValidationResult } from './rlsValidator';

// RLS error types
export type RlsErrorType =
    | 'policy_violation'
    | 'access_denied'
    | 'permission_required'
    | 'company_restriction'
    | 'user_restriction'
    | 'role_restriction'
    | 'unknown';

// RLS error details
export interface RlsErrorDetails {
    type: RlsErrorType;
    code: string;
    message: string;
    userMessage: string;
    context: RlsContext;
    isRetryable: boolean;
    retryCount?: number;
    maxRetries?: number;
    originalError?: any;
}

// RLS error handler options
export interface RlsErrorHandlerOptions {
    enableRetry?: boolean;
    maxRetries?: number;
    retryDelay?: number;
    enableAuditLogging?: boolean;
}

// RLS error handler result
export interface RlsErrorHandlerResult {
    shouldRetry: boolean;
    delayMs: number;
    userMessage: string;
    logToAudit: boolean;
}

/**
 * RLS Error Handler class
 */
export class RlsErrorHandler {
    private logger: Logger;
    private options: Required<RlsErrorHandlerOptions>;

    constructor(options: RlsErrorHandlerOptions = {}) {
        this.logger = new Logger('RlsErrorHandler');
        this.options = {
            enableRetry: options.enableRetry ?? true,
            maxRetries: options.maxRetries ?? 3,
            retryDelay: options.retryDelay ?? 1000,
            enableAuditLogging: options.enableAuditLogging ?? true
        };
    }

    /**
     * Handle an RLS error
     */
    handleError(
        error: any,
        context: RlsContext,
        retryCount: number = 0
    ): RlsErrorHandlerResult {
        const errorDetails = this.parseError(error, context, retryCount);

        // Log the error
        this.logRlsError(errorDetails);

        // Determine if we should retry
        const shouldRetry = this.options.enableRetry &&
            errorDetails.isRetryable &&
            retryCount < this.options.maxRetries;

        // Calculate retry delay with exponential backoff
        const delayMs = this.calculateRetryDelay(retryCount);

        return {
            shouldRetry,
            delayMs,
            userMessage: errorDetails.userMessage,
            logToAudit: this.options.enableAuditLogging
        };
    }

    /**
     * Handle RLS validation result
     */
    handleValidationResult(result: RlsValidationResult): RlsErrorHandlerResult {
        if (result.isValid) {
            return {
                shouldRetry: false,
                delayMs: 0,
                userMessage: '',
                logToAudit: false
            };
        }

        const errorDetails = this.createErrorFromValidation(result);

        // Log the error
        this.logRlsError(errorDetails);

        return {
            shouldRetry: false, // Validation errors are not retryable
            delayMs: 0,
            userMessage: errorDetails.userMessage,
            logToAudit: this.options.enableAuditLogging
        };
    }

    /**
     * Parse an error and create RLS error details
     */
    private parseError(
        error: any,
        context: RlsContext,
        retryCount: number
    ): RlsErrorDetails {
        // Check if it's an AuthorizationError
        if (error instanceof AuthorizationError) {
            return this.parseAuthorizationError(error, context, retryCount);
        }

        // Check if it's a Supabase error
        if (error?.code) {
            return this.parseSupabaseError(error, context, retryCount);
        }

        // Check for network errors (retryable)
        if (this.isNetworkError(error)) {
            return {
                type: 'unknown',
                code: 'NETWORK_ERROR',
                message: 'Network error occurred during RLS check',
                userMessage: 'Erro de conexão. Verifique sua internet e tente novamente.',
                context,
                isRetryable: true,
                retryCount,
                maxRetries: this.options.maxRetries,
                originalError: error
            };
        }

        // Default error handling
        return {
            type: 'unknown',
            code: 'UNKNOWN_RLS_ERROR',
            message: error?.message || 'Unknown RLS error occurred',
            userMessage: 'Ocorreu um erro de segurança. Tente novamente ou entre em contato com o suporte.',
            context,
            isRetryable: false,
            retryCount,
            maxRetries: this.options.maxRetries,
            originalError: error
        };
    }

    /**
     * Parse AuthorizationError
     */
    private parseAuthorizationError(
        error: AuthorizationError,
        context: RlsContext,
        retryCount: number
    ): RlsErrorDetails {
        const message = error.message.toLowerCase();
        let type: RlsErrorType = 'access_denied';
        let userMessage = 'Você não tem permissão para realizar esta ação.';

        if (message.includes('empresa') || message.includes('company')) {
            type = 'company_restriction';
            userMessage = 'Você não tem permissão para acessar dados desta empresa.';
        } else if (message.includes('user')) {
            type = 'user_restriction';
            userMessage = 'Você não tem permissão para acessar dados deste usuário.';
        } else if (message.includes('role') || message.includes('cargo')) {
            type = 'role_restriction';
            userMessage = 'Seu cargo não tem permissão para realizar esta ação.';
        }

        return {
            type,
            code: error.code || 'AUTHORIZATION_ERROR',
            message: error.message,
            userMessage,
            context,
            isRetryable: false,
            retryCount,
            maxRetries: this.options.maxRetries,
            originalError: error
        };
    }

    /**
     * Parse Supabase error
     */
    private parseSupabaseError(
        error: any,
        context: RlsContext,
        retryCount: number
    ): RlsErrorDetails {
        const code = error.code || 'UNKNOWN';
        const message = error.message || '';

        // RLS policy violation (PostgreSQL error code 42501)
        if (code === '42501' || message.includes('new row violates row-level security policy')) {
            return {
                type: 'policy_violation',
                code: 'RLS_POLICY_VIOLATION',
                message: message,
                userMessage: 'Violação de política de segurança. Você não tem permissão para esta operação.',
                context,
                isRetryable: false,
                retryCount,
                maxRetries: this.options.maxRetries,
                originalError: error
            };
        }

        // Permission denied
        if (code === '42501' || message.includes('permission denied')) {
            return {
                type: 'permission_required',
                code: 'PERMISSION_DENIED',
                message: message,
                userMessage: 'Permissão negada. Entre em contato com o administrador.',
                context,
                isRetryable: false,
                retryCount,
                maxRetries: this.options.maxRetries,
                originalError: error
            };
        }

        // Connection errors (retryable)
        if (this.isConnectionError(code)) {
            return {
                type: 'unknown',
                code: 'CONNECTION_ERROR',
                message: message,
                userMessage: 'Erro de conexão com o banco de dados. Tente novamente.',
                context,
                isRetryable: true,
                retryCount,
                maxRetries: this.options.maxRetries,
                originalError: error
            };
        }

        // Default Supabase error
        return {
            type: 'access_denied',
            code: code,
            message: message,
            userMessage: 'Erro de acesso. Verifique suas permissões e tente novamente.',
            context,
            isRetryable: false,
            retryCount,
            maxRetries: this.options.maxRetries,
            originalError: error
        };
    }

    /**
     * Create error details from validation result
     */
    private createErrorFromValidation(result: RlsValidationResult): RlsErrorDetails {
        const firstViolation = result.violations[0] || '';
        let type: RlsErrorType = 'policy_violation';
        let userMessage = 'Violação de política de segurança.';

        if (firstViolation.toLowerCase().includes('empresa') || firstViolation.toLowerCase().includes('company')) {
            type = 'company_restriction';
            userMessage = 'Você não tem permissão para acessar dados desta empresa.';
        } else if (firstViolation.toLowerCase().includes('user')) {
            type = 'user_restriction';
            userMessage = 'Você não tem permissão para acessar dados deste usuário.';
        } else if (firstViolation.toLowerCase().includes('role') || firstViolation.toLowerCase().includes('cargo')) {
            type = 'role_restriction';
            userMessage = 'Seu cargo não tem permissão para esta operação.';
        }

        return {
            type,
            code: 'RLS_VALIDATION_FAILED',
            message: result.violations.join('; '),
            userMessage,
            context: result.context,
            isRetryable: false,
            retryCount: 0,
            maxRetries: 0
        };
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
     * Check if error is a connection error
     */
    private isConnectionError(code: string): boolean {
        const connectionErrorCodes = [
            '08000', // connection exception
            '08001', // SQL client unable to establish SQL connection
            '08003', // connection does not exist
            '08004', // SQL server rejected establishment of SQL connection
            '08006', // connection failure
            '08007', // transaction resolution unknown
            '08P01', // protocol violation
            '57P01', // admin shutdown
            '57P02', // crash shutdown
            '57P03'  // cannot connect now
        ];

        return connectionErrorCodes.some(c => code.startsWith(c));
    }

    /**
     * Calculate retry delay with exponential backoff
     */
    private calculateRetryDelay(retryCount: number): number {
        const baseDelay = this.options.retryDelay;
        const maxDelay = 30000; // 30 seconds max
        const delay = baseDelay * Math.pow(2, retryCount);
        const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
        return Math.min(delay + jitter, maxDelay);
    }

    /**
     * Log RLS error
     */
    private logRlsError(errorDetails: RlsErrorDetails): void {
        this.logger.error('RLS error occurred', {
            type: errorDetails.type,
            code: errorDetails.code,
            message: errorDetails.message,
            context: {
                userId: errorDetails.context.userId,
                userRole: errorDetails.context.userRole,
                empresaId: errorDetails.context.empresaId,
                operation: errorDetails.context.operation,
                tableName: errorDetails.context.tableName
            },
            isRetryable: errorDetails.isRetryable,
            retryCount: errorDetails.retryCount
        });
    }

    /**
     * Create user-friendly error message
     */
    createUserMessage(errorDetails: RlsErrorDetails): string {
        const { userMessage, context } = errorDetails;

        // Add context-specific information
        let message = userMessage;

        if (context.operation === 'read') {
            message += ' Você não tem permissão para visualizar estes dados.';
        } else if (context.operation === 'create') {
            message += ' Você não tem permissão para criar novos registros.';
        } else if (context.operation === 'update') {
            message += ' Você não tem permissão para modificar estes dados.';
        } else if (context.operation === 'delete') {
            message += ' Você não tem permissão para excluir estes dados.';
        }

        return message;
    }

    /**
     * Create AuthorizationError from RLS error details
     */
    createAuthorizationError(errorDetails: RlsErrorDetails): AuthorizationError {
        return new AuthorizationError(
            errorDetails.userMessage,
            errorDetails.code,
            {
                type: errorDetails.type,
                context: errorDetails.context,
                originalError: errorDetails.originalError
            }
        );
    }
}

// Singleton instance
const rlsErrorHandler = new RlsErrorHandler();

/**
 * Helper functions for common RLS error handling
 */

/**
 * Handle an RLS error
 */
export function handleRlsError(
    error: any,
    context: RlsContext,
    retryCount: number = 0
): RlsErrorHandlerResult {
    return rlsErrorHandler.handleError(error, context, retryCount);
}

/**
 * Handle RLS validation result
 */
export function handleRlsValidationResult(result: RlsValidationResult): RlsErrorHandlerResult {
    return rlsErrorHandler.handleValidationResult(result);
}

/**
 * Create user-friendly error message
 */
export function createRlsUserMessage(errorDetails: RlsErrorDetails): string {
    return rlsErrorHandler.createUserMessage(errorDetails);
}

/**
 * Create AuthorizationError from RLS error
 */
export function createRlsAuthorizationError(errorDetails: RlsErrorDetails): AuthorizationError {
    return rlsErrorHandler.createAuthorizationError(errorDetails);
}

/**
 * Check if error is retryable
 */
export function isRlsErrorRetryable(error: any): boolean {
    const context: RlsContext = {
        userId: '',
        userRole: 'user',
        operation: 'read',
        tableName: '',
        timestamp: new Date().toISOString()
    };

    const result = rlsErrorHandler.handleError(error, context, 0);
    return result.shouldRetry;
}

// Export the handler instance for advanced usage
export { rlsErrorHandler };
export default rlsErrorHandler;
