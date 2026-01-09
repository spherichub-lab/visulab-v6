/**
 * RLS (Row Level Security) Utilities Module
 * 
 * This module provides frontend-side RLS enforcement to ensure the UI respects
 * RLS expectations. It includes validation, error handling, and audit logging.
 * 
 * Main exports:
 * - RLS validation utilities (rlsValidator.ts)
 * - RLS error handling (rlsErrorHandler.ts)
 */

// Export types from rlsValidator
export type {
    UserRole,
    RlsPolicyStatus,
    RlsContext,
    RlsValidationResult,
    RlsAuditLog,
    RlsPolicyConfig
} from './rlsValidator';

// Export types from rlsErrorHandler
export type {
    RlsErrorType,
    RlsErrorDetails,
    RlsErrorHandlerOptions,
    RlsErrorHandlerResult
} from './rlsErrorHandler';

// Export types from rlsFormValidator
export type {
    FormFieldRlsRestriction,
    FormRlsValidationResult,
    FormRlsConfig
} from './rlsFormValidator';

// Export RLS validator
export {
    RlsValidator,
    rlsValidator,
    validateReadAccess,
    validateCreateAccess,
    validateUpdateAccess,
    validateDeleteAccess,
    applyRlsFilters,
    checkRlsStatus,
    getRlsAuditLogs,
    getRlsAuditStats,
    clearRlsAuditLogs
} from './rlsValidator';

// Export RLS error handler
export {
    RlsErrorHandler,
    rlsErrorHandler,
    handleRlsError,
    handleRlsValidationResult,
    createRlsUserMessage,
    createRlsAuthorizationError,
    isRlsErrorRetryable
} from './rlsErrorHandler';

// Export RLS form validator
export {
    RlsFormValidator,
    rlsFormValidator,
    validateFormWithRls,
    isFormFieldDisabled,
    getFieldRestrictionMessage,
    sanitizeFormData,
    applyRlsToFormFields
} from './rlsFormValidator';

// Default export is the validator
export { default } from './rlsValidator';
