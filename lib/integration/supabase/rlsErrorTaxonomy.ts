/**
 * RLS Error Taxonomy
 * Defines RLS-specific error types and their properties
 */

/**
 * RLS error types
 * Categorizes different types of RLS violations and errors
 */
export enum RlsErrorType {
    // Access Denied Errors
    SELECT_DENIED = 'RLS_SELECT_DENIED',
    INSERT_DENIED = 'RLS_INSERT_DENIED',
    UPDATE_DENIED = 'RLS_UPDATE_DENIED',
    DELETE_DENIED = 'RLS_DELETE_DENIED',

    // Policy Mismatch Errors
    POLICY_MISMATCH = 'RLS_POLICY_MISMATCH',
    ASSUMPTION_INVALID = 'RLS_ASSUMPTION_INVALID',

    // Scope Errors
    SCOPE_VIOLATION = 'RLS_SCOPE_VIOLATION',
    CROSS_ENTITY_ACCESS = 'RLS_CROSS_ENTITY_ACCESS',

    // Configuration Errors
    RLS_NOT_ENABLED = 'RLS_NOT_ENABLED',
    RLS_POLICY_MISSING = 'RLS_POLICY_MISSING',
}

/**
 * RLS error interface
 * Complete error information for RLS violations
 */
export interface RlsError {
    type: RlsErrorType;
    code: string;
    table: string;
    operation: string;
    role: string;
    userId: string;
    message: string;
    userMessage: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    isRetryable: boolean;
    recoveryAction: string;
}

/**
 * RLS error messages
 * User-friendly messages for each RLS error type
 */
export const RLS_ERROR_MESSAGES: Record<RlsErrorType, {
    title: string;
    message: string;
    action: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
}> = {
    [RlsErrorType.SELECT_DENIED]: {
        title: 'Access Denied',
        message: 'You do not have permission to view this data.',
        action: 'Contact Administrator',
        severity: 'high'
    },
    [RlsErrorType.INSERT_DENIED]: {
        title: 'Cannot Create',
        message: 'You do not have permission to create this record.',
        action: 'Contact Administrator',
        severity: 'high'
    },
    [RlsErrorType.UPDATE_DENIED]: {
        title: 'Cannot Update',
        message: 'You do not have permission to modify this record.',
        action: 'Contact Administrator',
        severity: 'high'
    },
    [RlsErrorType.DELETE_DENIED]: {
        title: 'Cannot Delete',
        message: 'You do not have permission to delete this record.',
        action: 'Contact Administrator',
        severity: 'high'
    },
    [RlsErrorType.POLICY_MISMATCH]: {
        title: 'Security Configuration Error',
        message: 'There is a mismatch between security policies. Please contact support.',
        action: 'Report Issue',
        severity: 'critical'
    },
    [RlsErrorType.ASSUMPTION_INVALID]: {
        title: 'Security Configuration Error',
        message: 'Security assumptions are invalid. This should not happen.',
        action: 'Report Issue',
        severity: 'critical'
    },
    [RlsErrorType.SCOPE_VIOLATION]: {
        title: 'Access Scope Violation',
        message: 'You are attempting to access data outside your allowed scope.',
        action: 'Contact Administrator',
        severity: 'high'
    },
    [RlsErrorType.CROSS_ENTITY_ACCESS]: {
        title: 'Cross-Entity Access Denied',
        message: 'You cannot access data from another entity.',
        action: 'Contact Administrator',
        severity: 'high'
    },
    [RlsErrorType.RLS_NOT_ENABLED]: {
        title: 'Security Not Configured',
        message: 'Row-level security is not enabled. Contact administrator.',
        action: 'Contact Administrator',
        severity: 'critical'
    },
    [RlsErrorType.RLS_POLICY_MISSING]: {
        title: 'Security Policy Missing',
        message: 'Required security policy is missing. Contact administrator.',
        action: 'Contact Administrator',
        severity: 'critical'
    }
};

/**
 * Create RLS error from context
 */
export function createRlsError(
    type: RlsErrorType,
    context: {
        table: string;
        operation: string;
        role: string;
        userId: string;
        code?: string;
    }
): RlsError {
    const messageConfig = RLS_ERROR_MESSAGES[type];

    return {
        type,
        code: context.code || type,
        table: context.table,
        operation: context.operation,
        role: context.role,
        userId: context.userId,
        message: messageConfig.message,
        userMessage: messageConfig.message,
        severity: messageConfig.severity,
        isRetryable: false, // RLS errors are never retryable
        recoveryAction: messageConfig.action
    };
}

/**
 * Check if error is RLS-related
 */
export function isRlsError(error: any): boolean {
    return (
        error?.code === 'PGRST302' || // RLS policy violation
        error?.code === 'PGRST303' || // RLS policy violation
        error?.code === '42501' ||   // insufficient_privilege
        error?.type?.startsWith('RLS_') ||
        error?.message?.toLowerCase().includes('row level security') ||
        error?.message?.toLowerCase().includes('permission denied')
    );
}

/**
 * Map Supabase error code to RLS error type
 */
export function mapToRlsErrorType(error: any): RlsErrorType | null {
    const code = error?.code;
    const message = error?.message?.toLowerCase() || '';

    // Authorization/permission errors
    if (code === 'PGRST302' || code === 'PGRST303' || code === '42501') {
        if (message.includes('select')) {
            return RlsErrorType.SELECT_DENIED;
        }
        if (message.includes('insert')) {
            return RlsErrorType.INSERT_DENIED;
        }
        if (message.includes('update')) {
            return RlsErrorType.UPDATE_DENIED;
        }
        if (message.includes('delete')) {
            return RlsErrorType.DELETE_DENIED;
        }
        return RlsErrorType.POLICY_MISMATCH;
    }

    // Configuration errors
    if (message.includes('rls not enabled')) {
        return RlsErrorType.RLS_NOT_ENABLED;
    }

    if (message.includes('policy missing')) {
        return RlsErrorType.RLS_POLICY_MISSING;
    }

    return null;
}
