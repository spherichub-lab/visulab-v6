/**
 * RLS Validator Unit Tests
 * Tests for RLS validation utilities including:
 * - RLS validation utilities
 * - Role-based query filtering
 * - RLS error handling
 * - RLS audit logging
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    RlsValidator,
    validateReadAccess,
    validateCreateAccess,
    validateUpdateAccess,
    validateDeleteAccess,
    applyRlsFilters,
    checkRlsStatus,
    getRlsAuditLogs,
    getRlsAuditStats,
    clearRlsAuditLogs,
    rlsValidator,
    type UserRole,
    type RlsValidationResult,
    type RlsContext,
    type RlsPolicyStatus,
    type RlsAuditLog,
} from '@/utils/rls/rlsValidator';

// ============================================================================
// TEST SETUP
// ============================================================================

beforeEach(() => {
    clearRlsAuditLogs();
});

afterEach(() => {
    vi.clearAllMocks();
});

// ============================================================================
// TESTS
// ============================================================================

describe('RlsValidator - Read Access Validation', () => {
    it('should allow read access for admin user', () => {
        const result = validateReadAccess('empresas', 'user-1', 'admin', 'empresa-1');

        expect(result.isValid).toBe(true);
        expect(result.status).toBe('enforced');
        expect(result.violations).toHaveLength(0);
    });

    it('should allow read access for manager user', () => {
        const result = validateReadAccess('usuarios', 'user-2', 'manager', 'empresa-1');

        expect(result.isValid).toBe(true);
        expect(result.status).toBe('enforced');
    });

    it('should allow read access for user with empresaId', () => {
        const result = validateReadAccess('faltas', 'user-3', 'user', 'empresa-1');

        expect(result.isValid).toBe(true);
        expect(result.status).toBe('enforced');
    });

    it('should deny read access for user without empresaId when required', () => {
        const result = validateReadAccess('usuarios', 'user-4', 'user');

        expect(result.isValid).toBe(false);
        expect(result.status).toBe('bypassed');
        expect(result.violations).toContainEqual(
            expect.stringContaining('Empresa ID is required')
        );
    });

    it('should allow read access for viewer user', () => {
        const result = validateReadAccess('indices', 'user-5', 'viewer');

        expect(result.isValid).toBe(true);
        expect(result.status).toBe('enforced');
    });

    it('should return warning for unknown table', () => {
        const result = validateReadAccess('unknown_table', 'user-1', 'admin');

        expect(result.isValid).toBe(true);
        expect(result.status).toBe('unknown');
        expect(result.warnings).toContainEqual(
            expect.stringContaining('No RLS policy configuration')
        );
    });
});

describe('RlsValidator - Create Access Validation', () => {
    it('should allow create access for admin user', () => {
        const data = { name: 'Test', empresa_id: 'empresa-1' };
        const result = validateCreateAccess('empresas', 'user-1', 'admin', 'empresa-1', data);

        expect(result.isValid).toBe(true);
        expect(result.status).toBe('enforced');
    });

    it('should allow create access for manager user', () => {
        const data = { name: 'Test', empresa_id: 'empresa-1' };
        const result = validateCreateAccess('usuarios', 'user-2', 'manager', 'empresa-1', data);

        expect(result.isValid).toBe(true);
        expect(result.status).toBe('enforced');
    });

    it('should deny create access for user creating data for different empresa', () => {
        const data = { name: 'Test', empresa_id: 'empresa-2' };
        const result = validateCreateAccess('usuarios', 'user-3', 'user', 'empresa-1', data);

        expect(result.isValid).toBe(false);
        expect(result.status).toBe('bypassed');
        expect(result.violations).toContainEqual(
            expect.stringContaining('cannot create data for empresa')
        );
    });

    it('should deny create access for user without empresaId when required', () => {
        const data = { name: 'Test' };
        const result = validateCreateAccess('usuarios', 'user-4', 'user', undefined, data);

        expect(result.isValid).toBe(false);
        expect(result.status).toBe('bypassed');
    });

    it('should deny create access for viewer user', () => {
        const data = { name: 'Test' };
        const result = validateCreateAccess('empresas', 'user-5', 'viewer', 'empresa-1', data);

        expect(result.isValid).toBe(false);
        expect(result.status).toBe('bypassed');
        expect(result.violations).toContainEqual(
            expect.stringContaining('cannot perform create operation')
        );
    });
});

describe('RlsValidator - Update Access Validation', () => {
    it('should allow update access for admin user', () => {
        const data = { name: 'Updated', empresa_id: 'empresa-1' };
        const result = validateUpdateAccess('empresas', 'user-1', 'admin', 'empresa-1', data);

        expect(result.isValid).toBe(true);
        expect(result.status).toBe('enforced');
    });

    it('should deny update access for user updating different empresa', () => {
        const data = { empresa_id: 'empresa-2' };
        const result = validateUpdateAccess('usuarios', 'user-3', 'user', 'empresa-1', data);

        expect(result.isValid).toBe(false);
        expect(result.status).toBe('bypassed');
        expect(result.violations).toContainEqual(
            expect.stringContaining('cannot update data for empresa')
        );
    });

    it('should deny update access for viewer user', () => {
        const data = { name: 'Updated' };
        const result = validateUpdateAccess('empresas', 'user-5', 'viewer', 'empresa-1', data);

        expect(result.isValid).toBe(false);
        expect(result.status).toBe('bypassed');
        expect(result.violations).toContainEqual(
            expect.stringContaining('cannot perform update operation')
        );
    });
});

describe('RlsValidator - Delete Access Validation', () => {
    it('should allow delete access for admin user', () => {
        const result = validateDeleteAccess('empresas', 'user-1', 'admin', 'empresa-1');

        expect(result.isValid).toBe(true);
        expect(result.status).toBe('enforced');
    });

    it('should allow delete access for user on faltas table', () => {
        const result = validateDeleteAccess('faltas', 'user-3', 'user', 'empresa-1');

        expect(result.isValid).toBe(true);
        expect(result.status).toBe('enforced');
    });

    it('should warn delete access for user on non-faltas table', () => {
        const result = validateDeleteAccess('usuarios', 'user-3', 'user', 'empresa-1');

        expect(result.isValid).toBe(true);
        expect(result.status).toBe('enforced');
        expect(result.warnings).toContainEqual(
            expect.stringContaining('restricted delete access')
        );
    });

    it('should deny delete access for viewer user', () => {
        const result = validateDeleteAccess('empresas', 'user-5', 'viewer', 'empresa-1');

        expect(result.isValid).toBe(false);
        expect(result.status).toBe('bypassed');
        expect(result.violations).toContainEqual(
            expect.stringContaining('cannot perform delete operation')
        );
    });
});

describe('RlsValidator - Role-Based Query Filtering', () => {
    it('should not add filters for admin user', () => {
        const existingFilters = { status: 'active' };
        const filters = applyRlsFilters('empresas', 'admin', 'empresa-1', 'user-1', existingFilters);

        expect(filters).toEqual(existingFilters);
    });

    it('should add empresa_id filter for manager user', () => {
        const existingFilters = { status: 'active' };
        const filters = applyRlsFilters('usuarios', 'manager', 'empresa-1', 'user-1', existingFilters);

        expect(filters.empresa_id).toBe('empresa-1');
        expect(filters.status).toBe('active');
    });

    it('should add empresa_id and user_id filters for user', () => {
        const existingFilters = { status: 'active' };
        const filters = applyRlsFilters('faltas', 'user', 'empresa-1', 'user-1', existingFilters);

        expect(filters.empresa_id).toBe('empresa-1');
        expect(filters.usuario_id).toBe('user-1');
        expect(filters.status).toBe('active');
    });

    it('should add empresa_id filter for user on empresas table', () => {
        const existingFilters = {};
        const filters = applyRlsFilters('empresas', 'user', 'empresa-1', 'user-1', existingFilters);

        expect(filters.id).toBe('empresa-1');
    });

    it('should not add filters for viewer on indices table', () => {
        const existingFilters = {};
        const filters = applyRlsFilters('indices', 'viewer', undefined, 'user-1', existingFilters);

        expect(filters).toEqual(existingFilters);
    });
});

describe('RlsValidator - RLS Policy Status Check', () => {
    it('should return enforced for admin user', () => {
        const status = checkRlsStatus('empresas', 'admin', 'empresa-1');

        expect(status).toBe('enforced');
    });

    it('should return enforced for user with empresaId', () => {
        const status = checkRlsStatus('usuarios', 'user', 'empresa-1');

        expect(status).toBe('enforced');
    });

    it('should return bypassed for user without empresaId', () => {
        const status = checkRlsStatus('usuarios', 'user', undefined);

        expect(status).toBe('bypassed');
    });

    it('should return bypassed for unauthorized role', () => {
        const status = checkRlsStatus('empresas', 'viewer', 'empresa-1');

        expect(status).toBe('bypassed');
    });

    it('should return unknown for unknown table', () => {
        const status = checkRlsStatus('unknown_table', 'admin', 'empresa-1');

        expect(status).toBe('unknown');
    });
});

describe('RlsValidator - Audit Logging', () => {
    it('should log validation result to audit', () => {
        const result = validateReadAccess('empresas', 'user-1', 'admin', 'empresa-1');

        const logs = getRlsAuditLogs();

        expect(logs).toHaveLength(1);
        expect(logs[0].result).toEqual(result);
        expect(logs[0].context.tableName).toBe('empresas');
    });

    it('should log multiple validation results', () => {
        validateReadAccess('empresas', 'user-1', 'admin', 'empresa-1');
        validateCreateAccess('usuarios', 'user-2', 'manager', 'empresa-1', {});
        validateUpdateAccess('faltas', 'user-3', 'user', 'empresa-1', {});

        const logs = getRlsAuditLogs();

        expect(logs).toHaveLength(3);
    });

    it('should filter audit logs by userId', () => {
        validateReadAccess('empresas', 'user-1', 'admin', 'empresa-1');
        validateReadAccess('usuarios', 'user-2', 'manager', 'empresa-1');

        const logs = getRlsAuditLogs({ context: { userId: 'user-1' } } as Partial<RlsAuditLog>);

        expect(logs).toHaveLength(1);
        expect(logs[0].context.userId).toBe('user-1');
    });

    it('should filter audit logs by tableName', () => {
        validateReadAccess('empresas', 'user-1', 'admin', 'empresa-1');
        validateReadAccess('usuarios', 'user-2', 'manager', 'empresa-1');

        const logs = getRlsAuditLogs({ context: { tableName: 'empresas' } } as Partial<RlsAuditLog>);

        expect(logs).toHaveLength(1);
        expect(logs[0].context.tableName).toBe('empresas');
    });

    it('should filter audit logs by operation', () => {
        validateCreateAccess('empresas', 'user-1', 'admin', 'empresa-1', {});
        validateReadAccess('empresas', 'user-2', 'manager', 'empresa-1');

        const logs = getRlsAuditLogs({ context: { operation: 'create' } } as Partial<RlsAuditLog>);

        expect(logs).toHaveLength(1);
        expect(logs[0].context.operation).toBe('create');
    });

    it('should filter audit logs by status', () => {
        validateReadAccess('empresas', 'user-1', 'admin', 'empresa-1');
        validateReadAccess('usuarios', 'user-2', 'viewer', undefined);

        const logs = getRlsAuditLogs({ result: { status: 'bypassed' } } as Partial<RlsAuditLog>);

        expect(logs).toHaveLength(1);
        expect(logs[0].result.status).toBe('bypassed');
    });

    it('should provide audit statistics', () => {
        validateReadAccess('empresas', 'user-1', 'admin', 'empresa-1');
        validateCreateAccess('usuarios', 'user-2', 'viewer', 'empresa-1', {});
        validateReadAccess('faltas', 'user-3', 'user', 'empresa-1');

        const stats = getRlsAuditStats();

        expect(stats.total).toBe(3);
        expect(stats.violations).toBe(1);
        expect(stats.enforced).toBe(2);
        expect(stats.violationRate).toBeCloseTo(33.33, 1);
    });

    it('should clear audit logs', () => {
        validateReadAccess('empresas', 'user-1', 'admin', 'empresa-1');
        validateReadAccess('usuarios', 'user-2', 'manager', 'empresa-1');

        expect(getRlsAuditLogs()).toHaveLength(2);

        clearRlsAuditLogs();

        expect(getRlsAuditLogs()).toHaveLength(0);
    });
});

describe('RlsValidator - Policy Configuration', () => {
    it('should get policy config for known table', () => {
        const config = rlsValidator.getPolicyConfig('empresas');

        expect(config).toBeDefined();
        expect(config?.tableName).toBe('empresas');
        expect(config?.allowedRoles).toContain('admin');
    });

    it('should return undefined for unknown table', () => {
        const config = rlsValidator.getPolicyConfig('unknown_table');

        expect(config).toBeUndefined();
    });

    it('should get all policy configs', () => {
        const configs = rlsValidator.getAllPolicyConfigs();

        expect(configs).toHaveProperty('empresas');
        expect(configs).toHaveProperty('usuarios');
        expect(configs).toHaveProperty('faltas');
        expect(configs).toHaveProperty('compras');
    });
});

describe('RlsValidator - Admin Bypass', () => {
    it('should bypass RLS for admin user on empresas', () => {
        const data = { empresa_id: 'different-empresa' };
        const result = validateCreateAccess('empresas', 'admin-1', 'admin', 'empresa-1', data);

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContainEqual(
            expect.stringContaining('Admin user bypassing RLS policy')
        );
    });

    it('should bypass RLS for admin user on usuarios', () => {
        const data = { usuario_id: 'different-user', empresa_id: 'different-empresa' };
        const result = validateUpdateAccess('usuarios', 'admin-1', 'admin', 'empresa-1', data);

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContainEqual(
            expect.stringContaining('Admin user bypassing RLS policy')
        );
    });
});

describe('RlsValidator - Error Handling', () => {
    it('should handle validation errors gracefully', () => {
        const validator = new RlsValidator();

        // Force an error by passing invalid data
        const result = validator.validateOperation(
            'read',
            'empresas',
            'user-1',
            'invalid-role' as any,
            'empresa-1'
        );

        expect(result.isValid).toBe(false);
        expect(result.status).toBe('error');
        expect(result.violations.length).toBeGreaterThan(0);
    });
});

describe('RlsValidator - Data Validation', () => {
    it('should validate empresa_id in create data', () => {
        const data = { empresa_id: 'empresa-2' };
        const result = validateCreateAccess('usuarios', 'user-3', 'user', 'empresa-1', data);

        expect(result.isValid).toBe(false);
        expect(result.violations).toContainEqual(
            expect.stringContaining('cannot create data for empresa')
        );
    });

    it('should validate user_id in create data', () => {
        const data = { usuario_id: 'different-user' };
        const result = validateCreateAccess('faltas', 'user-3', 'user', 'empresa-1', data);

        expect(result.isValid).toBe(false);
        expect(result.violations).toContainEqual(
            expect.stringContaining('cannot create data for user')
        );
    });

    it('should validate empresa_id in update data', () => {
        const data = { empresa_id: 'empresa-2' };
        const result = validateUpdateAccess('usuarios', 'user-3', 'user', 'empresa-1', data);

        expect(result.isValid).toBe(false);
        expect(result.violations).toContainEqual(
            expect.stringContaining('cannot update data for empresa')
        );
    });

    it('should validate user_id in update data', () => {
        const data = { usuario_id: 'different-user' };
        const result = validateUpdateAccess('faltas', 'user-3', 'user', 'empresa-1', data);

        expect(result.isValid).toBe(false);
        expect(result.violations).toContainEqual(
            expect.stringContaining('cannot update data for user')
        );
    });
});
