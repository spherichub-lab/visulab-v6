/**
 * RLS Validator Utilities
 * Frontend-side Row Level Security validation and enforcement
 * 
 * These utilities help ensure the UI respects RLS expectations by:
 * - Validating RLS expectations before data operations
 * - Implementing role-based query filtering helpers
 * - Adding RLS policy status checking functions
 * - Creating audit logging for RLS enforcement
 */

import { Logger } from '../../../lib/utils/logger/logger';

// User role types
export type UserRole = 'admin' | 'manager' | 'user' | 'viewer';

// RLS policy status
export type RlsPolicyStatus = 'enforced' | 'bypassed' | 'unknown' | 'error';

// RLS context for operations
export interface RlsContext {
    userId: string;
    userRole: UserRole;
    empresaId?: string;
    operation: 'read' | 'create' | 'update' | 'delete';
    tableName: string;
    timestamp: string;
}

// RLS validation result
export interface RlsValidationResult {
    isValid: boolean;
    status: RlsPolicyStatus;
    violations: string[];
    warnings: string[];
    context: RlsContext;
}

// RLS audit log entry
export interface RlsAuditLog {
    id: string;
    context: RlsContext;
    result: RlsValidationResult;
    timestamp: string;
    stackTrace?: string;
}

// RLS policy configuration
export interface RlsPolicyConfig {
    tableName: string;
    empresaColumn?: string;
    userColumn?: string;
    requiresEmpresaAccess: boolean;
    adminBypass: boolean;
    allowedRoles: UserRole[];
}

// RLS audit storage (in-memory for now, could be moved to localStorage or backend)
class RlsAuditStorage {
    private logs: RlsAuditLog[] = [];
    private maxLogs = 1000;

    addLog(log: RlsAuditLog): void {
        this.logs.push(log);
        // Keep only the last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
    }

    getLogs(filters?: Partial<RlsAuditLog>): RlsAuditLog[] {
        if (!filters) return [...this.logs];

        return this.logs.filter(log => {
            if (filters.context?.userId && log.context.userId !== filters.context.userId) {
                return false;
            }
            if (filters.context?.tableName && log.context.tableName !== filters.context.tableName) {
                return false;
            }
            if (filters.context?.operation && log.context.operation !== filters.context.operation) {
                return false;
            }
            if (filters.result?.status && log.result.status !== filters.result.status) {
                return false;
            }
            return true;
        });
    }

    clearLogs(): void {
        this.logs = [];
    }

    getStats() {
        const total = this.logs.length;
        const violations = this.logs.filter(l => l.result.status === 'bypassed').length;
        const errors = this.logs.filter(l => l.result.status === 'error').length;
        const enforced = this.logs.filter(l => l.result.status === 'enforced').length;

        return {
            total,
            violations,
            errors,
            enforced,
            violationRate: total > 0 ? (violations / total) * 100 : 0
        };
    }
}

const auditStorage = new RlsAuditStorage();

// RLS policy configurations for each table
const RLS_POLICY_CONFIGS: Record<string, RlsPolicyConfig> = {
    empresas: {
        tableName: 'empresas',
        empresaColumn: 'id',
        requiresEmpresaAccess: false,
        adminBypass: true,
        allowedRoles: ['admin', 'manager']
    },
    usuarios: {
        tableName: 'usuarios',
        empresaColumn: 'empresa_id',
        userColumn: 'id',
        requiresEmpresaAccess: true,
        adminBypass: true,
        allowedRoles: ['admin', 'manager', 'user']
    },
    faltas: {
        tableName: 'faltas',
        empresaColumn: 'empresa_id',
        userColumn: 'usuario_id',
        requiresEmpresaAccess: true,
        adminBypass: true,
        allowedRoles: ['admin', 'manager', 'user']
    },
    compras: {
        tableName: 'compras',
        empresaColumn: undefined, // compras may not have empresa_id
        requiresEmpresaAccess: false,
        adminBypass: true,
        allowedRoles: ['admin', 'manager']
    },
    indices: {
        tableName: 'indices',
        requiresEmpresaAccess: false,
        adminBypass: false,
        allowedRoles: ['admin', 'manager', 'user', 'viewer']
    },
    tipos: {
        tableName: 'tipos',
        requiresEmpresaAccess: false,
        adminBypass: false,
        allowedRoles: ['admin', 'manager', 'user', 'viewer']
    },
    tratamentos: {
        tableName: 'tratamentos',
        requiresEmpresaAccess: false,
        adminBypass: false,
        allowedRoles: ['admin', 'manager', 'user', 'viewer']
    }
};

/**
 * RLS Validator class
 */
export class RlsValidator {
    private logger: Logger;

    constructor() {
        this.logger = new Logger('RlsValidator');
    }

    /**
     * Validate RLS expectations before a data operation
     */
    validateOperation(
        operation: 'read' | 'create' | 'update' | 'delete',
        tableName: string,
        userId: string,
        userRole: UserRole,
        empresaId?: string,
        data?: Record<string, any>
    ): RlsValidationResult {
        const context: RlsContext = {
            userId,
            userRole,
            empresaId,
            operation,
            tableName,
            timestamp: new Date().toISOString()
        };

        const result: RlsValidationResult = {
            isValid: true,
            status: 'enforced',
            violations: [],
            warnings: [],
            context
        };

        try {
            // Check if table has RLS policy configuration
            const policyConfig = RLS_POLICY_CONFIGS[tableName];
            if (!policyConfig) {
                result.warnings.push(`No RLS policy configuration found for table: ${tableName}`);
                result.status = 'unknown';
                return result;
            }

            // Check if user role is allowed for this table
            if (!policyConfig.allowedRoles.includes(userRole)) {
                result.isValid = false;
                result.status = 'bypassed';
                result.violations.push(
                    `User role '${userRole}' is not allowed to ${operation} on table '${tableName}'`
                );
            }

            // Admin bypass check
            if (policyConfig.adminBypass && userRole === 'admin') {
                result.warnings.push('Admin user bypassing RLS policy');
                result.status = 'enforced'; // Admin bypass is expected
                return result;
            }

            // Empresa access validation
            if (policyConfig.requiresEmpresaAccess && !empresaId) {
                result.isValid = false;
                result.status = 'bypassed';
                result.violations.push(
                    `Empresa ID is required for ${operation} operation on table '${tableName}'`
                );
            }

            // Data validation for create/update operations
            if ((operation === 'create' || operation === 'update') && data) {
                this.validateDataWithRls(data, policyConfig, context, result);
            }

            // Role-based operation validation
            this.validateRoleBasedOperation(operation, userRole, tableName, result);

        } catch (error) {
            this.logger.error('RLS validation error', { error, context });
            result.isValid = false;
            result.status = 'error';
            result.violations.push(`RLS validation error: ${error}`);
        }

        return result;
    }

    /**
     * Validate data against RLS policies
     */
    private validateDataWithRls(
        data: Record<string, any>,
        policyConfig: RlsPolicyConfig,
        context: RlsContext,
        result: RlsValidationResult
    ): void {
        // Check if empresa_id is being set and if user has access
        if (policyConfig.empresaColumn && data[policyConfig.empresaColumn]) {
            const targetEmpresaId = data[policyConfig.empresaColumn];

            // Non-admin users can only create/update data for their own empresa
            if (context.userRole !== 'admin' && targetEmpresaId !== context.empresaId) {
                result.isValid = false;
                result.status = 'bypassed';
                result.violations.push(
                    `User cannot ${context.operation} data for empresa '${targetEmpresaId}'`
                );
            }
        }

        // Check if user_id is being set and if user has access
        if (policyConfig.userColumn && data[policyConfig.userColumn]) {
            const targetUserId = data[policyConfig.userColumn];

            // Non-admin users can only create/update their own data
            if (context.userRole !== 'admin' && targetUserId !== context.userId) {
                result.isValid = false;
                result.status = 'bypassed';
                result.violations.push(
                    `User cannot ${context.operation} data for user '${targetUserId}'`
                );
            }
        }
    }

    /**
     * Validate role-based operations
     */
    private validateRoleBasedOperation(
        operation: 'read' | 'create' | 'update' | 'delete',
        userRole: UserRole,
        tableName: string,
        result: RlsValidationResult
    ): void {
        // Viewers can only read
        if (userRole === 'viewer' && operation !== 'read') {
            result.isValid = false;
            result.status = 'bypassed';
            result.violations.push(
                `Viewer role cannot perform ${operation} operation on table '${tableName}'`
            );
        }

        // Users may have restricted delete access
        if (userRole === 'user' && operation === 'delete' && tableName !== 'faltas') {
            result.warnings.push(
                `User role may have restricted delete access on table '${tableName}'`
            );
        }
    }

    /**
     * Apply role-based query filters
     */
    applyRoleBasedFilters(
        tableName: string,
        userRole: UserRole,
        empresaId?: string,
        userId?: string,
        existingFilters?: Record<string, any>
    ): Record<string, any> {
        const filters = { ...existingFilters };
        const policyConfig = RLS_POLICY_CONFIGS[tableName];

        if (!policyConfig) {
            this.logger.warn(`No RLS policy configuration for table: ${tableName}`);
            return filters;
        }

        // Admin bypass - no additional filters needed
        if (policyConfig.adminBypass && userRole === 'admin') {
            return filters;
        }

        // Apply empresa_id filter if required
        if (policyConfig.requiresEmpresaAccess && policyConfig.empresaColumn && empresaId) {
            filters[policyConfig.empresaColumn] = empresaId;
        }

        // Apply user_id filter for own data
        if (policyConfig.userColumn && userId && userRole !== 'admin' && userRole !== 'manager') {
            filters[policyConfig.userColumn] = userId;
        }

        return filters;
    }

    /**
     * Check RLS policy status
     */
    checkRlsPolicyStatus(
        tableName: string,
        userRole: UserRole,
        empresaId?: string
    ): RlsPolicyStatus {
        const policyConfig = RLS_POLICY_CONFIGS[tableName];

        if (!policyConfig) {
            return 'unknown';
        }

        // Admin bypass
        if (policyConfig.adminBypass && userRole === 'admin') {
            return 'enforced';
        }

        // Check if empresa access is required but not provided
        if (policyConfig.requiresEmpresaAccess && !empresaId) {
            return 'bypassed';
        }

        // Check if role is allowed
        if (!policyConfig.allowedRoles.includes(userRole)) {
            return 'bypassed';
        }

        return 'enforced';
    }

    /**
     * Log RLS validation result to audit
     */
    logValidation(result: RlsValidationResult): void {
        const log: RlsAuditLog = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            context: result.context,
            result,
            timestamp: new Date().toISOString()
        };

        auditStorage.addLog(log);

        // Log to console for development
        if (result.status === 'bypassed') {
            this.logger.warn('RLS policy bypassed', {
                context: result.context,
                violations: result.violations
            });
        } else if (result.status === 'error') {
            this.logger.error('RLS policy error', {
                context: result.context,
                violations: result.violations
            });
        }
    }

    /**
     * Get audit logs
     */
    getAuditLogs(filters?: Partial<RlsAuditLog>): RlsAuditLog[] {
        return auditStorage.getLogs(filters);
    }

    /**
     * Get audit statistics
     */
    getAuditStats() {
        return auditStorage.getStats();
    }

    /**
     * Clear audit logs
     */
    clearAuditLogs(): void {
        auditStorage.clearLogs();
    }

    /**
     * Get RLS policy configuration for a table
     */
    getPolicyConfig(tableName: string): RlsPolicyConfig | undefined {
        return RLS_POLICY_CONFIGS[tableName];
    }

    /**
     * Get all RLS policy configurations
     */
    getAllPolicyConfigs(): Record<string, RlsPolicyConfig> {
        return { ...RLS_POLICY_CONFIGS };
    }
}

// Singleton instance
const rlsValidator = new RlsValidator();

/**
 * Helper functions for common RLS operations
 */

/**
 * Validate before read operation
 */
export function validateReadAccess(
    tableName: string,
    userId: string,
    userRole: UserRole,
    empresaId?: string
): RlsValidationResult {
    const result = rlsValidator.validateOperation('read', tableName, userId, userRole, empresaId);
    rlsValidator.logValidation(result);
    return result;
}

/**
 * Validate before create operation
 */
export function validateCreateAccess(
    tableName: string,
    userId: string,
    userRole: UserRole,
    empresaId?: string,
    data?: Record<string, any>
): RlsValidationResult {
    const result = rlsValidator.validateOperation('create', tableName, userId, userRole, empresaId, data);
    rlsValidator.logValidation(result);
    return result;
}

/**
 * Validate before update operation
 */
export function validateUpdateAccess(
    tableName: string,
    userId: string,
    userRole: UserRole,
    empresaId?: string,
    data?: Record<string, any>
): RlsValidationResult {
    const result = rlsValidator.validateOperation('update', tableName, userId, userRole, empresaId, data);
    rlsValidator.logValidation(result);
    return result;
}

/**
 * Validate before delete operation
 */
export function validateDeleteAccess(
    tableName: string,
    userId: string,
    userRole: UserRole,
    empresaId?: string
): RlsValidationResult {
    const result = rlsValidator.validateOperation('delete', tableName, userId, userRole, empresaId);
    rlsValidator.logValidation(result);
    return result;
}

/**
 * Apply RLS filters to a query
 */
export function applyRlsFilters(
    tableName: string,
    userRole: UserRole,
    empresaId?: string,
    userId?: string,
    existingFilters?: Record<string, any>
): Record<string, any> {
    return rlsValidator.applyRoleBasedFilters(
        tableName,
        userRole,
        empresaId,
        userId,
        existingFilters
    );
}

/**
 * Check RLS status for a table
 */
export function checkRlsStatus(
    tableName: string,
    userRole: UserRole,
    empresaId?: string
): RlsPolicyStatus {
    return rlsValidator.checkRlsPolicyStatus(tableName, userRole, empresaId);
}

/**
 * Get RLS audit logs
 */
export function getRlsAuditLogs(filters?: Partial<RlsAuditLog>): RlsAuditLog[] {
    return rlsValidator.getAuditLogs(filters);
}

/**
 * Get RLS audit statistics
 */
export function getRlsAuditStats() {
    return rlsValidator.getAuditStats();
}

/**
 * Clear RLS audit logs
 */
export function clearRlsAuditLogs(): void {
    rlsValidator.clearAuditLogs();
}

// Export the validator instance for advanced usage
export { rlsValidator };
export default rlsValidator;
