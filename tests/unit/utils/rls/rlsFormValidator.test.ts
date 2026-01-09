/**
 * RLS Form Validator Unit Tests
 * Tests for RLS form validation including:
 * - RLS validation for form submissions
 * - Field-level RLS restrictions
 * - User-friendly feedback for RLS violations
 * - Automatic field disabling based on RLS policies
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    validateFormWithRls,
    isFormFieldDisabled,
    getFieldRestrictionMessage,
    sanitizeFormData,
    applyRlsToFormFields,
    type FormRlsConfig,
    type FormRlsValidationResult,
} from '@/utils/rls/rlsFormValidator';
import type { UserRole } from '@/utils/rls/rlsValidator';

// ============================================================================
// TEST SETUP
// ============================================================================

const createConfig = (overrides: Partial<FormRlsConfig> = {}): FormRlsConfig => ({
    tableName: 'usuarios',
    userId: 'user-1',
    userRole: 'user',
    empresaId: 'empresa-1',
    isUpdate: false,
    ...overrides,
});

beforeEach(() => {
    vi.clearAllMocks();
});

// ============================================================================
// TESTS
// ============================================================================

describe('RlsFormValidator - Form Validation', () => {
    it('should validate form for admin user', () => {
        const { validateCreateAccess } = require('@/utils/rls/rlsValidator');
        validateCreateAccess.mockReturnValue({
            isValid: true,
            status: 'enforced',
            violations: [],
            warnings: [],
            context: {
                userId: 'user-1',
                userRole: 'admin',
                operation: 'create',
                tableName: 'usuarios',
                timestamp: new Date().toISOString(),
            },
        });

        const formData = { name: 'Test User', email: 'test@example.com' };
        const config = createConfig({ userRole: 'admin' });

        const result = validateFormWithRls(formData, config);

        expect(result.isValid).toBe(true);
        expect(result.restrictedFields).toHaveLength(0);
    });

    it('should validate form for manager user', () => {
        const { validateCreateAccess } = require('@/utils/rls/rlsValidator');
        validateCreateAccess.mockReturnValue({
            isValid: true,
            status: 'enforced',
            violations: [],
            warnings: [],
            context: {
                userId: 'user-1',
                userRole: 'manager',
                operation: 'create',
                tableName: 'usuarios',
                timestamp: new Date().toISOString(),
            },
        });

        const formData = { name: 'Test User', empresa_id: 'empresa-1' };
        const config = createConfig({ userRole: 'manager' });

        const result = validateFormWithRls(formData, config);

        expect(result.isValid).toBe(true);
    });

    it('should invalidate form for viewer user', () => {
        const { validateCreateAccess } = require('@/utils/rls/rlsValidator');
        validateCreateAccess.mockReturnValue({
            isValid: false,
            status: 'bypassed',
            violations: ['Viewers cannot modify data'],
            warnings: [],
            context: {
                userId: 'user-1',
                userRole: 'viewer',
                operation: 'create',
                tableName: 'usuarios',
                timestamp: new Date().toISOString(),
            },
        });

        const formData = { name: 'Test User' };
        const config = createConfig({ userRole: 'viewer' });

        const result = validateFormWithRls(formData, config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual(
            expect.stringContaining('cannot modify data')
        );
    });

    it('should invalidate form when RLS validation fails', () => {
        const { validateCreateAccess } = require('@/utils/rls/rlsValidator');
        validateCreateAccess.mockReturnValue({
            isValid: false,
            status: 'bypassed',
            violations: ['Empresa access denied'],
            warnings: [],
            context: {
                userId: 'user-1',
                userRole: 'user',
                operation: 'create',
                tableName: 'usuarios',
                timestamp: new Date().toISOString(),
            },
        });

        const formData = { name: 'Test User', empresa_id: 'empresa-2' };
        const config = createConfig();

        const result = validateFormWithRls(formData, config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual(
            expect.stringContaining('Empresa access denied')
        );
    });
});

describe('RlsFormValidator - Restricted Fields', () => {
    it('should identify restricted fields for viewer user', () => {
        const config = createConfig({ userRole: 'viewer' });

        const result = validateFormWithRls({}, config);

        const allFieldsRestricted = result.restrictedFields.some(
            f => f.fieldName === '*'
        );

        expect(allFieldsRestricted).toBe(true);
    });

    it('should restrict role field for non-admin users on usuarios table', () => {
        const config = createConfig({ userRole: 'user', tableName: 'usuarios' });

        const result = validateFormWithRls({}, config);

        const roleField = result.restrictedFields.find(f => f.fieldName === 'role');
        expect(roleField?.isRestricted).toBe(true);
        expect(roleField?.reason).toContain('admin');
    });

    it('should restrict empresa_id field for non-manager users on usuarios table', () => {
        const config = createConfig({ userRole: 'user', tableName: 'usuarios' });

        const result = validateFormWithRls({}, config);

        const empresaField = result.restrictedFields.find(f => f.fieldName === 'empresa_id');
        expect(empresaField?.isRestricted).toBe(true);
    });

    it('should restrict usuario_id field for users on faltas table', () => {
        const config = createConfig({ userRole: 'user', tableName: 'faltas', isUpdate: false });

        const result = validateFormWithRls({}, config);

        const usuarioField = result.restrictedFields.find(f => f.fieldName === 'usuario_id');
        expect(usuarioField?.isRestricted).toBe(true);
        expect(usuarioField?.allowedValues).toEqual(['user-1']);
    });

    it('should restrict status field for non-admin users on empresas table', () => {
        const config = createConfig({ userRole: 'user', tableName: 'empresas' });

        const result = validateFormWithRls({}, config);

        const statusField = result.restrictedFields.find(f => f.fieldName === 'status');
        expect(statusField?.isRestricted).toBe(true);
    });

    it('should restrict status field for non-manager users on compras table', () => {
        const config = createConfig({ userRole: 'user', tableName: 'compras' });

        const result = validateFormWithRls({}, config);

        const statusField = result.restrictedFields.find(f => f.fieldName === 'status');
        expect(statusField?.isRestricted).toBe(true);
    });
});

describe('RlsFormValidator - Field Validation', () => {
    it('should validate restricted field values', () => {
        const config = createConfig({ userRole: 'user', tableName: 'faltas', isUpdate: false });
        const formData = { usuario_id: 'different-user' };

        const result = validateFormWithRls(formData, config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual(
            expect.stringContaining('usuario_id')
        );
    });

    it('should validate empresa_id field values', () => {
        const config = createConfig({ userRole: 'user', tableName: 'usuarios' });
        const formData = { empresa_id: 'empresa-2' };

        const result = validateFormWithRls(formData, config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual(
            expect.stringContaining('empresa')
        );
    });

    it('should allow valid restricted field values', () => {
        const config = createConfig({ userRole: 'user', tableName: 'faltas', isUpdate: false });
        const formData = { usuario_id: 'user-1', empresa_id: 'empresa-1' };

        const result = validateFormWithRls(formData, config);

        expect(result.isValid).toBe(true);
    });

    it('should not validate unrestricted fields', () => {
        const config = createConfig({ userRole: 'user', tableName: 'usuarios' });
        const formData = { name: 'Test User', email: 'test@example.com' };

        const result = validateFormWithRls(formData, config);

        expect(result.isValid).toBe(true);
    });
});

describe('RlsFormValidator - Field Disabling', () => {
    it('should disable all fields for viewer user', () => {
        const config = createConfig({ userRole: 'viewer' });

        const isDisabled = isFormFieldDisabled('any-field', config);

        expect(isDisabled).toBe(true);
    });

    it('should disable role field for non-admin users', () => {
        const config = createConfig({ userRole: 'user', tableName: 'usuarios' });

        const isDisabled = isFormFieldDisabled('role', config);

        expect(isDisabled).toBe(true);
    });

    it('should not disable role field for admin users', () => {
        const config = createConfig({ userRole: 'admin', tableName: 'usuarios' });

        const isDisabled = isFormFieldDisabled('role', config);

        expect(isDisabled).toBe(false);
    });

    it('should disable empresa_id field for non-manager users', () => {
        const config = createConfig({ userRole: 'user', tableName: 'usuarios' });

        const isDisabled = isFormFieldDisabled('empresa_id', config);

        expect(isDisabled).toBe(true);
    });

    it('should not disable empresa_id field for admin users', () => {
        const config = createConfig({ userRole: 'admin', tableName: 'usuarios' });

        const isDisabled = isFormFieldDisabled('empresa_id', config);

        expect(isDisabled).toBe(false);
    });

    it('should not disable unrestricted fields', () => {
        const config = createConfig({ userRole: 'user', tableName: 'usuarios' });

        const isDisabled = isFormFieldDisabled('name', config);

        expect(isDisabled).toBe(false);
    });
});

describe('RlsFormValidator - Restriction Messages', () => {
    it('should return restriction message for role field', () => {
        const config = createConfig({ userRole: 'user', tableName: 'usuarios' });

        const message = getFieldRestrictionMessage('role', config);

        expect(message).toContain('admin');
    });

    it('should return restriction message for empresa_id field', () => {
        const config = createConfig({ userRole: 'user', tableName: 'usuarios' });

        const message = getFieldRestrictionMessage('empresa_id', config);

        expect(message).toContain('company');
    });

    it('should return null for unrestricted fields', () => {
        const config = createConfig({ userRole: 'user', tableName: 'usuarios' });

        const message = getFieldRestrictionMessage('name', config);

        expect(message).toBeNull();
    });

    it('should return null for unknown fields', () => {
        const config = createConfig({ userRole: 'user', tableName: 'usuarios' });

        const message = getFieldRestrictionMessage('unknown-field', config);

        expect(message).toBeNull();
    });
});

describe('RlsFormValidator - Form Data Sanitization', () => {
    it('should remove restricted fields from form data', () => {
        const config = createConfig({ userRole: 'user', tableName: 'usuarios' });
        const formData = {
            name: 'Test User',
            email: 'test@example.com',
            role: 'admin', // Restricted
            empresa_id: 'empresa-2', // Restricted
        };

        const sanitized = sanitizeFormData(formData, config);

        expect(sanitized.name).toBe('Test User');
        expect(sanitized.email).toBe('test@example.com');
        expect(sanitized.role).toBeUndefined();
        expect(sanitized.empresa_id).toBeUndefined();
    });

    it('should keep unrestricted fields', () => {
        const config = createConfig({ userRole: 'user', tableName: 'usuarios' });
        const formData = {
            name: 'Test User',
            email: 'test@example.com',
        };

        const sanitized = sanitizeFormData(formData, config);

        expect(sanitized.name).toBe('Test User');
        expect(sanitized.email).toBe('test@example.com');
    });

    it('should return empty object when all fields are restricted', () => {
        const config = createConfig({ userRole: 'viewer', tableName: 'usuarios' });
        const formData = {
            name: 'Test User',
            email: 'test@example.com',
            role: 'admin',
        };

        const sanitized = sanitizeFormData(formData, config);

        expect(Object.keys(sanitized)).toHaveLength(0);
    });
});

describe('RlsFormValidator - Apply RLS to Form Fields', () => {
    it('should apply RLS restrictions to form fields', () => {
        const config = createConfig({ userRole: 'user', tableName: 'usuarios' });
        const fields = [
            { name: 'name', disabled: false },
            { name: 'email', disabled: false },
            { name: 'role', disabled: false },
        ];

        const updatedFields = applyRlsToFormFields(fields, config);

        expect(updatedFields[0].disabled).toBe(false);
        expect(updatedFields[1].disabled).toBe(false);
        expect(updatedFields[2].disabled).toBe(true); // role should be disabled
    });

    it('should preserve existing disabled state', () => {
        const config = createConfig({ userRole: 'user', tableName: 'usuarios' });
        const fields = [
            { name: 'name', disabled: true },
            { name: 'email', disabled: false },
            { name: 'role', disabled: false },
        ];

        const updatedFields = applyRlsToFormFields(fields, config);

        expect(updatedFields[0].disabled).toBe(true); // Already disabled
        expect(updatedFields[1].disabled).toBe(false);
        expect(updatedFields[2].disabled).toBe(true); // RLS disabled
    });

    it('should not modify unrestricted fields', () => {
        const config = createConfig({ userRole: 'admin', tableName: 'usuarios' });
        const fields = [
            { name: 'name', disabled: false },
            { name: 'email', disabled: false },
            { name: 'role', disabled: false },
        ];

        const updatedFields = applyRlsToFormFields(fields, config);

        expect(updatedFields[0].disabled).toBe(false);
        expect(updatedFields[1].disabled).toBe(false);
        expect(updatedFields[2].disabled).toBe(false); // Admin can access role
    });
});

describe('RlsFormValidator - Table-Specific Restrictions', () => {
    it('should apply usuarios table restrictions', () => {
        const config = createConfig({ userRole: 'user', tableName: 'usuarios' });
        const result = validateFormWithRls({}, config);

        expect(result.restrictedFields.length).toBeGreaterThan(0);
    });

    it('should apply empresas table restrictions', () => {
        const config = createConfig({ userRole: 'user', tableName: 'empresas' });
        const result = validateFormWithRls({}, config);

        const statusField = result.restrictedFields.find(f => f.fieldName === 'status');
        expect(statusField?.isRestricted).toBe(true);
    });

    it('should apply faltas table restrictions', () => {
        const config = createConfig({ userRole: 'user', tableName: 'faltas', isUpdate: false });
        const result = validateFormWithRls({}, config);

        const usuarioField = result.restrictedFields.find(f => f.fieldName === 'usuario_id');
        expect(usuarioField?.isRestricted).toBe(true);
    });

    it('should apply compras table restrictions', () => {
        const config = createConfig({ userRole: 'user', tableName: 'compras' });
        const result = validateFormWithRls({}, config);

        const statusField = result.restrictedFields.find(f => f.fieldName === 'status');
        expect(statusField?.isRestricted).toBe(true);
    });
});

describe('RlsFormValidator - Create vs Update', () => {
    it('should validate create operations', () => {
        const { validateCreateAccess } = require('@/utils/rls/rlsValidator');
        validateCreateAccess.mockReturnValue({
            isValid: true,
            status: 'enforced',
            violations: [],
            warnings: [],
            context: {
                userId: 'user-1',
                userRole: 'user',
                operation: 'create',
                tableName: 'faltas',
                timestamp: new Date().toISOString(),
            },
        });

        const config = createConfig({ isUpdate: false });
        const result = validateFormWithRls({}, config);

        expect(result.rlsResult?.context.operation).toBe('create');
    });

    it('should validate update operations', () => {
        const { validateUpdateAccess } = require('@/utils/rls/rlsValidator');
        validateUpdateAccess.mockReturnValue({
            isValid: true,
            status: 'enforced',
            violations: [],
            warnings: [],
            context: {
                userId: 'user-1',
                userRole: 'user',
                operation: 'update',
                tableName: 'faltas',
                timestamp: new Date().toISOString(),
            },
        });

        const config = createConfig({ isUpdate: true });
        const result = validateFormWithRls({}, config);

        expect(result.rlsResult?.context.operation).toBe('update');
    });
});

describe('RlsFormValidator - Warnings and Errors', () => {
    it('should include RLS warnings in validation result', () => {
        const { validateCreateAccess } = require('@/utils/rls/rlsValidator');
        validateCreateAccess.mockReturnValue({
            isValid: true,
            status: 'enforced',
            violations: [],
            warnings: ['Restricted access warning'],
            context: {
                userId: 'user-1',
                userRole: 'user',
                operation: 'create',
                tableName: 'usuarios',
                timestamp: new Date().toISOString(),
            },
        });

        const config = createConfig();
        const result = validateFormWithRls({}, config);

        expect(result.warnings).toContainEqual('Restricted access warning');
    });

    it('should include RLS violations as errors', () => {
        const { validateCreateAccess } = require('@/utils/rls/rlsValidator');
        validateCreateAccess.mockReturnValue({
            isValid: false,
            status: 'bypassed',
            violations: ['Access denied'],
            warnings: [],
            context: {
                userId: 'user-1',
                userRole: 'user',
                operation: 'create',
                tableName: 'usuarios',
                timestamp: new Date().toISOString(),
            },
        });

        const config = createConfig();
        const result = validateFormWithRls({}, config);

        expect(result.errors).toEqual(['Access denied']);
    });
});
