/**
 * RLS Error Handler Unit Tests
 * Tests for RLS error handling including:
 * - RLS policy violation errors (403 responses)
 * - User-friendly messages for RLS violations
 * - Retry logic for transient RLS errors
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    RlsErrorHandler,
    handleRlsError,
    handleRlsValidationResult,
    createRlsUserMessage,
    createRlsAuthorizationError,
    isRlsErrorRetryable,
    type RlsErrorType,
    type RlsErrorDetails,
} from '@/utils/rls/rlsErrorHandler';
import type { RlsContext, RlsValidationResult } from '@/utils/rls/rlsValidator';
import { AuthorizationError } from '../../../../lib/utils/errors/applicationErrors';

// ============================================================================
// MOCKS
// ============================================================================

// Mock Logger
vi.mock('@/lib/utils/logger/logger', () => ({
    Logger: vi.fn().mockImplementation(() => ({
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    })),
}));

// ============================================================================
// TEST SETUP
// ============================================================================

const createRlsContext = (overrides: Partial<RlsContext> = {}): RlsContext => ({
    userId: 'user-1',
    userRole: 'user',
    operation: 'read',
    tableName: 'empresas',
    timestamp: new Date().toISOString(),
    ...overrides,
});

const createRlsValidationResult = (overrides: Partial<RlsValidationResult> = {}): RlsValidationResult => ({
    isValid: true,
    status: 'enforced',
    violations: [],
    warnings: [],
    context: createRlsContext(),
    ...overrides,
});

beforeEach(() => {
    vi.clearAllMocks();
});

// ============================================================================
// TESTS
// ============================================================================

describe('RlsErrorHandler - Error Parsing', () => {
    it('should parse AuthorizationError correctly', () => {
        const handler = new RlsErrorHandler();
        const error = new AuthorizationError('Permission denied', 'AUTHORIZATION_ERROR');
        const context = createRlsContext();

        const result = handler.handleError(error, context, 0);

        expect(result.userMessage).toContain('permissão');
        expect(result.shouldRetry).toBe(false);
    });

    it('should parse company restriction from AuthorizationError', () => {
        const handler = new RlsErrorHandler();
        const error = new AuthorizationError('Cannot access empresa data', 'AUTHORIZATION_ERROR');
        const context = createRlsContext();

        const result = handler.handleError(error, context, 0);

        expect(result.userMessage).toContain('empresa');
        expect(result.logToAudit).toBe(true);
    });

    it('should parse user restriction from AuthorizationError', () => {
        const handler = new RlsErrorHandler();
        const error = new AuthorizationError('Cannot access user data', 'AUTHORIZATION_ERROR');
        const context = createRlsContext();

        const result = handler.handleError(error, context, 0);

        expect(result.userMessage).toContain('usuário');
        expect(result.logToAudit).toBe(true);
    });

    it('should parse role restriction from AuthorizationError', () => {
        const handler = new RlsErrorHandler();
        const error = new AuthorizationError('Insufficient role permissions', 'AUTHORIZATION_ERROR');
        const context = createRlsContext();

        const result = handler.handleError(error, context, 0);

        expect(result.userMessage).toContain('cargo');
        expect(result.logToAudit).toBe(true);
    });

    it('should parse network error as retryable', () => {
        const handler = new RlsErrorHandler();
        const error = new TypeError('Failed to fetch');
        const context = createRlsContext();

        const result = handler.handleError(error, context, 0);

        expect(result.userMessage).toContain('conexão');
        expect(result.shouldRetry).toBe(true);
        expect(result.logToAudit).toBe(true);
    });

    it('should parse connection error as retryable', () => {
        const handler = new RlsErrorHandler();
        const error = { code: '08001', message: 'Connection failed' };
        const context = createRlsContext();

        const result = handler.handleError(error, context, 0);

        expect(result.userMessage).toContain('conexão');
        expect(result.shouldRetry).toBe(true);
    });

    it('should parse Supabase RLS policy violation', () => {
        const handler = new RlsErrorHandler();
        const error = { code: '42501', message: 'new row violates row-level security policy' };
        const context = createRlsContext();

        const result = handler.handleError(error, context, 0);

        expect(result.userMessage).toContain('política de segurança');
        expect(result.shouldRetry).toBe(false);
        expect(result.logToAudit).toBe(true);
    });

    it('should parse permission denied error', () => {
        const handler = new RlsErrorHandler();
        const error = { code: '42501', message: 'permission denied' };
        const context = createRlsContext();

        const result = handler.handleError(error, context, 0);

        expect(result.userMessage).toContain('Permissão negada');
        expect(result.shouldRetry).toBe(false);
        expect(result.logToAudit).toBe(true);
    });
});

describe('RlsErrorHandler - Validation Result Handling', () => {
    it('should handle valid validation result', () => {
        const handler = new RlsErrorHandler();
        const result = createRlsValidationResult({ isValid: true });

        const errorResult = handler.handleValidationResult(result);

        expect(errorResult.shouldRetry).toBe(false);
        expect(errorResult.userMessage).toBe('');
        expect(errorResult.logToAudit).toBe(false);
    });

    it('should handle invalid validation result', () => {
        const handler = new RlsErrorHandler();
        const result = createRlsValidationResult({
            isValid: false,
            status: 'bypassed',
            violations: ['User cannot access this data'],
        });

        const errorResult = handler.handleValidationResult(result);

        expect(errorResult.shouldRetry).toBe(false);
        expect(errorResult.userMessage).toContain('política de segurança');
        expect(errorResult.logToAudit).toBe(true);
    });

    it('should handle validation result with company violation', () => {
        const handler = new RlsErrorHandler();
        const result = createRlsValidationResult({
            isValid: false,
            status: 'bypassed',
            violations: ['User cannot access empresa data'],
        });

        const errorResult = handler.handleValidationResult(result);

        expect(errorResult.userMessage).toContain('empresa');
    });

    it('should handle validation result with user violation', () => {
        const handler = new RlsErrorHandler();
        const result = createRlsValidationResult({
            isValid: false,
            status: 'bypassed',
            violations: ['User cannot access user data'],
        });

        const errorResult = handler.handleValidationResult(result);

        expect(errorResult.userMessage).toContain('usuário');
    });

    it('should handle validation result with role violation', () => {
        const handler = new RlsErrorHandler();
        const result = createRlsValidationResult({
            isValid: false,
            status: 'bypassed',
            violations: ['User role insufficient for this operation'],
        });

        const errorResult = handler.handleValidationResult(result);

        expect(errorResult.userMessage).toContain('cargo');
    });
});

describe('RlsErrorHandler - Retry Logic', () => {
    it('should retry recoverable errors', () => {
        const handler = new RlsErrorHandler({ enableRetry: true, maxRetries: 3 });
        const error = new TypeError('Failed to fetch');
        const context = createRlsContext();

        const result = handler.handleError(error, context, 0);

        expect(result.shouldRetry).toBe(true);
        expect(result.delayMs).toBeGreaterThan(0);
    });

    it('should not retry non-recoverable errors', () => {
        const handler = new RlsErrorHandler({ enableRetry: true });
        const error = new AuthorizationError('Permission denied', 'AUTHORIZATION_ERROR');
        const context = createRlsContext();

        const result = handler.handleError(error, context, 0);

        expect(result.shouldRetry).toBe(false);
    });

    it('should respect max retry limit', () => {
        const handler = new RlsErrorHandler({ enableRetry: true, maxRetries: 2 });
        const error = new TypeError('Failed to fetch');
        const context = createRlsContext();

        const result = handler.handleError(error, context, 2);

        expect(result.shouldRetry).toBe(false);
    });

    it('should use exponential backoff for retry delay', () => {
        const handler = new RlsErrorHandler({ retryDelay: 1000 });
        const error = new TypeError('Failed to fetch');
        const context = createRlsContext();

        const result1 = handler.handleError(error, context, 0);
        const result2 = handler.handleError(error, context, 1);
        const result3 = handler.handleError(error, context, 2);

        expect(result2.delayMs).toBeGreaterThan(result1.delayMs);
        expect(result3.delayMs).toBeGreaterThan(result2.delayMs);
    });

    it('should add jitter to retry delay', () => {
        const handler = new RlsErrorHandler({ retryDelay: 1000 });
        const error = new TypeError('Failed to fetch');
        const context = createRlsContext();

        const result1 = handler.handleError(error, context, 0);
        const result2 = handler.handleError(error, context, 0);

        // Delays should not be exactly the same due to jitter
        expect(result1.delayMs).not.toBe(result2.delayMs);
    });

    it('should cap retry delay at max', () => {
        const handler = new RlsErrorHandler({ retryDelay: 1000 });
        const error = new TypeError('Failed to fetch');
        const context = createRlsContext();

        const result = handler.handleError(error, context, 10); // High retry count

        expect(result.delayMs).toBeLessThanOrEqual(30000); // 30 seconds max
    });
});

describe('RlsErrorHandler - User Message Generation', () => {
    it('should generate message for read operation', () => {
        const handler = new RlsErrorHandler();
        const errorDetails: RlsErrorDetails = {
            type: 'access_denied',
            code: 'AUTHORIZATION_ERROR',
            message: 'Permission denied',
            userMessage: 'You do not have permission',
            context: createRlsContext({ operation: 'read' }),
            isRetryable: false,
        };

        const message = handler.createUserMessage(errorDetails);

        expect(message).toContain('visualizar');
    });

    it('should generate message for create operation', () => {
        const handler = new RlsErrorHandler();
        const errorDetails: RlsErrorDetails = {
            type: 'access_denied',
            code: 'AUTHORIZATION_ERROR',
            message: 'Permission denied',
            userMessage: 'You do not have permission',
            context: createRlsContext({ operation: 'create' }),
            isRetryable: false,
        };

        const message = handler.createUserMessage(errorDetails);

        expect(message).toContain('criar novos registros');
    });

    it('should generate message for update operation', () => {
        const handler = new RlsErrorHandler();
        const errorDetails: RlsErrorDetails = {
            type: 'access_denied',
            code: 'AUTHORIZATION_ERROR',
            message: 'Permission denied',
            userMessage: 'You do not have permission',
            context: createRlsContext({ operation: 'update' }),
            isRetryable: false,
        };

        const message = handler.createUserMessage(errorDetails);

        expect(message).toContain('modificar');
    });

    it('should generate message for delete operation', () => {
        const handler = new RlsErrorHandler();
        const errorDetails: RlsErrorDetails = {
            type: 'access_denied',
            code: 'AUTHORIZATION_ERROR',
            message: 'Permission denied',
            userMessage: 'You do not have permission',
            context: createRlsContext({ operation: 'delete' }),
            isRetryable: false,
        };

        const message = handler.createUserMessage(errorDetails);

        expect(message).toContain('excluir');
    });
});

describe('RlsErrorHandler - Authorization Error Creation', () => {
    it('should create AuthorizationError from error details', () => {
        const handler = new RlsErrorHandler();
        const errorDetails: RlsErrorDetails = {
            type: 'company_restriction',
            code: 'AUTHORIZATION_ERROR',
            message: 'Cannot access empresa data',
            userMessage: 'You do not have permission',
            context: createRlsContext(),
            isRetryable: false,
        };

        const authError = handler.createAuthorizationError(errorDetails);

        expect(authError).toBeInstanceOf(AuthorizationError);
        expect(authError.message).toBe(errorDetails.userMessage);
        expect(authError.code).toBe(errorDetails.code);
        expect(authError.context).toEqual({
            type: errorDetails.type,
            context: errorDetails.context,
            originalError: errorDetails.originalError,
        });
    });
});

describe('RlsErrorHandler - Helper Functions', () => {
    it('should handle RLS error via helper function', () => {
        const error = new AuthorizationError('Permission denied', 'AUTHORIZATION_ERROR');
        const context = createRlsContext();

        const result = handleRlsError(error, context, 0);

        expect(result.userMessage).toBeDefined();
        expect(result.shouldRetry).toBeDefined();
        expect(result.logToAudit).toBeDefined();
    });

    it('should handle RLS validation result via helper function', () => {
        const result = createRlsValidationResult({
            isValid: false,
            status: 'bypassed',
            violations: ['Access denied'],
        });

        const errorResult = handleRlsValidationResult(result);

        expect(errorResult.shouldRetry).toBe(false);
        expect(errorResult.userMessage).toBeDefined();
        expect(errorResult.logToAudit).toBe(true);
    });

    it('should create user message via helper function', () => {
        const handler = new RlsErrorHandler();
        const errorDetails: RlsErrorDetails = {
            type: 'access_denied',
            code: 'AUTHORIZATION_ERROR',
            message: 'Permission denied',
            userMessage: 'You do not have permission',
            context: createRlsContext(),
            isRetryable: false,
        };

        const message = createRlsUserMessage(errorDetails);

        expect(message).toContain('permissão');
    });

    it('should create authorization error via helper function', () => {
        const errorDetails: RlsErrorDetails = {
            type: 'access_denied',
            code: 'AUTHORIZATION_ERROR',
            message: 'Permission denied',
            userMessage: 'You do not have permission',
            context: createRlsContext(),
            isRetryable: false,
        };

        const authError = createRlsAuthorizationError(errorDetails);

        expect(authError).toBeInstanceOf(AuthorizationError);
    });

    it('should check if error is retryable via helper function', () => {
        const networkError = new TypeError('Failed to fetch');
        const isRetryable = isRlsErrorRetryable(networkError);

        expect(isRetryable).toBe(true);
    });

    it('should return false for non-retryable errors via helper function', () => {
        const authError = new AuthorizationError('Permission denied', 'AUTHORIZATION_ERROR');
        const isRetryable = isRlsErrorRetryable(authError);

        expect(isRetryable).toBe(false);
    });
});

describe('RlsErrorHandler - Options', () => {
    it('should use default options when not provided', () => {
        const handler = new RlsErrorHandler();

        const error = new TypeError('Failed to fetch');
        const context = createRlsContext();

        const result = handler.handleError(error, context, 0);

        expect(result.shouldRetry).toBe(true); // Default enableRetry is true
    });

    it('should respect custom enableRetry option', () => {
        const handler = new RlsErrorHandler({ enableRetry: false });

        const error = new TypeError('Failed to fetch');
        const context = createRlsContext();

        const result = handler.handleError(error, context, 0);

        expect(result.shouldRetry).toBe(false);
    });

    it('should respect custom maxRetries option', () => {
        const handler = new RlsErrorHandler({ maxRetries: 5 });

        const error = new TypeError('Failed to fetch');
        const context = createRlsContext();

        const result = handler.handleError(error, context, 4);

        expect(result.shouldRetry).toBe(true); // 4 < 5
    });

    it('should respect custom retryDelay option', () => {
        const handler = new RlsErrorHandler({ retryDelay: 500 });

        const error = new TypeError('Failed to fetch');
        const context = createRlsContext();

        const result = handler.handleError(error, context, 0);

        expect(result.delayMs).toBeGreaterThan(0);
        expect(result.delayMs).toBeLessThan(1000); // Should be around 500ms
    });

    it('should respect custom enableAuditLogging option', () => {
        const handler = new RlsErrorHandler({ enableAuditLogging: false });

        const error = new AuthorizationError('Permission denied', 'AUTHORIZATION_ERROR');
        const context = createRlsContext();

        const result = handler.handleError(error, context, 0);

        expect(result.logToAudit).toBe(false);
    });
});

describe('RlsErrorHandler - Error Logging', () => {
    it('should log RLS errors with context', () => {
        const handler = new RlsErrorHandler();
        const error = new AuthorizationError('Permission denied', 'AUTHORIZATION_ERROR');
        const context = createRlsContext();

        handler.handleError(error, context, 0);

        const Logger = require('@/lib/utils/logger/logger').Logger;
        const mockLogger = Logger.mock.results[0].value;
        expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should include error type in log', () => {
        const handler = new RlsErrorHandler();
        const error = new AuthorizationError('Permission denied', 'AUTHORIZATION_ERROR');
        const context = createRlsContext();

        handler.handleError(error, context, 0);

        const Logger = require('@/lib/utils/logger/logger').Logger;
        const mockLogger = Logger.mock.results[0].value;
        const logCall = mockLogger.error.mock.calls[0][0];

        expect(logCall).toHaveProperty('type');
    });

    it('should include context in log', () => {
        const handler = new RlsErrorHandler();
        const error = new AuthorizationError('Permission denied', 'AUTHORIZATION_ERROR');
        const context = createRlsContext();

        handler.handleError(error, context, 0);

        const Logger = require('@/lib/utils/logger/logger').Logger;
        const mockLogger = Logger.mock.results[0].value;
        const logCall = mockLogger.error.mock.calls[0][0];

        expect(logCall).toHaveProperty('context');
    });

    it('should include retry count in log', () => {
        const handler = new RlsErrorHandler();
        const error = new TypeError('Failed to fetch');
        const context = createRlsContext();

        handler.handleError(error, context, 2);

        const Logger = require('@/lib/utils/logger/logger').Logger;
        const mockLogger = Logger.mock.results[0].value;
        const logCall = mockLogger.error.mock.calls[0][0];

        expect(logCall.retryCount).toBe(2);
    });
});
