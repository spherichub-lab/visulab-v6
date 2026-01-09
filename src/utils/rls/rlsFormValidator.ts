/**
 * RLS Form Validator
 * Validates form submissions against RLS policies
 * 
 * This module provides:
 * - RLS validation for form submissions
 * - Field-level RLS restrictions
 * - User-friendly feedback for RLS violations
 * - Automatic field disabling based on RLS policies
 */

import {
    validateCreateAccess,
    validateUpdateAccess,
    type RlsValidationResult,
    type UserRole
} from './rlsValidator';
import type { RlsContext } from './rlsValidator';

/**
 * Form field RLS restriction
 */
export interface FormFieldRlsRestriction {
    fieldName: string;
    isRestricted: boolean;
    reason?: string;
    allowedValues?: any[];
    pattern?: RegExp;
}

/**
 * Form RLS validation result
 */
export interface FormRlsValidationResult {
    isValid: boolean;
    restrictedFields: FormFieldRlsRestriction[];
    warnings: string[];
    errors: string[];
    rlsResult?: RlsValidationResult;
}

/**
 * Form RLS configuration
 */
export interface FormRlsConfig {
    tableName: string;
    userId: string;
    userRole: UserRole;
    empresaId?: string;
    isUpdate?: boolean;
    recordId?: string;
}

/**
 * RLS-aware form validator
 */
export class RlsFormValidator {
    /**
     * Validate form data against RLS policies
     */
    validateForm(
        formData: Record<string, any>,
        config: FormRlsConfig
    ): FormRlsValidationResult {
        const result: FormRlsValidationResult = {
            isValid: true,
            restrictedFields: [],
            warnings: [],
            errors: []
        };

        // Validate the operation
        const rlsResult = config.isUpdate
            ? validateUpdateAccess(
                config.tableName,
                config.userId,
                config.userRole,
                config.empresaId,
                formData
            )
            : validateCreateAccess(
                config.tableName,
                config.userId,
                config.userRole,
                config.empresaId,
                formData
            );

        result.rlsResult = rlsResult;

        // Check if RLS validation failed
        if (!rlsResult.isValid) {
            result.isValid = false;
            result.errors.push(...rlsResult.violations);
            result.warnings.push(...rlsResult.warnings);
        }

        // Check for restricted fields based on user role
        const restrictedFields = this.getRestrictedFields(config);
        result.restrictedFields = restrictedFields;

        // Validate each field
        for (const restriction of restrictedFields) {
            if (restriction.isRestricted && formData[restriction.fieldName] !== undefined) {
                // Field value is present but restricted
                const validationError = this.validateRestrictedField(
                    restriction,
                    formData[restriction.fieldName]
                );

                if (validationError) {
                    result.isValid = false;
                    result.errors.push(validationError);
                }
            }
        }

        return result;
    }

    /**
     * Get restricted fields for the current user context
     */
    getRestrictedFields(config: FormRlsConfig): FormFieldRlsRestriction[] {
        const restrictions: FormFieldRlsRestriction[] = [];

        // Role-based restrictions
        if (config.userRole === 'viewer') {
            // Viewers cannot modify any fields
            restrictions.push({
                fieldName: '*',
                isRestricted: true,
                reason: 'Viewers cannot modify data'
            });
        }

        // Table-specific restrictions
        switch (config.tableName) {
            case 'usuarios':
                // Non-admin users cannot modify role
                if (config.userRole !== 'admin') {
                    restrictions.push({
                        fieldName: 'role',
                        isRestricted: true,
                        reason: 'Only admins can change user roles'
                    });
                }
                // Users cannot change empresa_id
                if (config.userRole !== 'admin' && config.userRole !== 'manager') {
                    restrictions.push({
                        fieldName: 'empresa_id',
                        isRestricted: true,
                        reason: 'You cannot change the company'
                    });
                }
                break;

            case 'empresas':
                // Non-admin users cannot modify empresa status
                if (config.userRole !== 'admin') {
                    restrictions.push({
                        fieldName: 'status',
                        isRestricted: true,
                        reason: 'Only admins can change company status'
                    });
                }
                break;

            case 'faltas':
                // Users can only create faltas for themselves
                if (config.userRole === 'user' && !config.isUpdate) {
                    restrictions.push({
                        fieldName: 'usuario_id',
                        isRestricted: true,
                        reason: 'Users can only create records for themselves',
                        allowedValues: [config.userId]
                    });
                }
                // Users cannot change empresa_id
                if (config.userRole !== 'admin' && config.userRole !== 'manager') {
                    restrictions.push({
                        fieldName: 'empresa_id',
                        isRestricted: true,
                        reason: 'You cannot change the company',
                        allowedValues: [config.empresaId]
                    });
                }
                break;

            case 'compras':
                // Non-admin users cannot modify status
                if (config.userRole !== 'admin' && config.userRole !== 'manager') {
                    restrictions.push({
                        fieldName: 'status',
                        isRestricted: true,
                        reason: 'Only admins and managers can change purchase status'
                    });
                }
                break;
        }

        return restrictions;
    }

    /**
     * Validate a restricted field value
     */
    private validateRestrictedField(
        restriction: FormFieldRlsRestriction,
        value: any
    ): string | null {
        if (!restriction.isRestricted) {
            return null;
        }

        // Check allowed values
        if (restriction.allowedValues && !restriction.allowedValues.includes(value)) {
            return `Field '${restriction.fieldName}' has restricted values. ${restriction.reason || ''}`;
        }

        // Check pattern
        if (restriction.pattern && !restriction.pattern.test(value)) {
            return `Field '${restriction.fieldName}' does not match required pattern. ${restriction.reason || ''}`;
        }

        // General restriction
        if (restriction.reason) {
            return `Field '${restriction.fieldName}' is restricted: ${restriction.reason}`;
        }

        return null;
    }

    /**
     * Check if a field should be disabled based on RLS
     */
    isFieldDisabled(
        fieldName: string,
        config: FormRlsConfig
    ): boolean {
        const restrictions = this.getRestrictedFields(config);
        const restriction = restrictions.find(r => r.fieldName === fieldName || r.fieldName === '*');

        return restriction?.isRestricted || false;
    }

    /**
     * Get user-friendly message for RLS restriction
     */
    getRestrictionMessage(fieldName: string, config: FormRlsConfig): string | null {
        const restrictions = this.getRestrictedFields(config);
        const restriction = restrictions.find(r => r.fieldName === fieldName || r.fieldName === '*');

        return restriction?.reason || null;
    }

    /**
     * Sanitize form data by removing restricted fields
     */
    sanitizeFormData(
        formData: Record<string, any>,
        config: FormRlsConfig
    ): Record<string, any> {
        const sanitized = { ...formData };
        const restrictions = this.getRestrictedFields(config);

        for (const restriction of restrictions) {
            if (restriction.isRestricted && restriction.fieldName !== '*') {
                delete sanitized[restriction.fieldName];
            }
        }

        return sanitized;
    }

    /**
     * Apply RLS restrictions to form fields
     */
    applyRlsToFormFields(
        fields: Array<{ name: string; disabled?: boolean;[key: string]: any }>,
        config: FormRlsConfig
    ): Array<{ name: string; disabled?: boolean;[key: string]: any }> {
        return fields.map(field => ({
            ...field,
            disabled: field.disabled || this.isFieldDisabled(field.name, config)
        }));
    }
}

// Singleton instance
const rlsFormValidator = new RlsFormValidator();

/**
 * Helper functions for form RLS validation
 */

/**
 * Validate form data against RLS policies
 */
export function validateFormWithRls(
    formData: Record<string, any>,
    config: FormRlsConfig
): FormRlsValidationResult {
    return rlsFormValidator.validateForm(formData, config);
}

/**
 * Check if a field should be disabled based on RLS
 */
export function isFormFieldDisabled(
    fieldName: string,
    config: FormRlsConfig
): boolean {
    return rlsFormValidator.isFieldDisabled(fieldName, config);
}

/**
 * Get restriction message for a field
 */
export function getFieldRestrictionMessage(
    fieldName: string,
    config: FormRlsConfig
): string | null {
    return rlsFormValidator.getRestrictionMessage(fieldName, config);
}

/**
 * Sanitize form data by removing restricted fields
 */
export function sanitizeFormData(
    formData: Record<string, any>,
    config: FormRlsConfig
): Record<string, any> {
    return rlsFormValidator.sanitizeFormData(formData, config);
}

/**
 * Apply RLS restrictions to form fields
 */
export function applyRlsToFormFields(
    fields: Array<{ name: string; disabled?: boolean;[key: string]: any }>,
    config: FormRlsConfig
): Array<{ name: string; disabled?: boolean;[key: string]: any }> {
    return rlsFormValidator.applyRlsToFormFields(fields, config);
}

// Export the validator instance for advanced usage
export { rlsFormValidator };
export default rlsFormValidator;
