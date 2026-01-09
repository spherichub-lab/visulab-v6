/**
 * RLS-Aware Base Repository
 * Extends BaseRepository with Row Level Security (RLS) validation and enforcement
 * 
 * This repository adds:
 * - RLS validation before CRUD operations
 * - Automatic role-based query filtering
 * - RLS status checks
 * - RLS error handling
 */

import { BaseRepository, RepositoryConfig } from './baseRepository';
import {
    validateReadAccess,
    validateCreateAccess,
    validateUpdateAccess,
    validateDeleteAccess,
    applyRlsFilters,
    checkRlsStatus,
    handleRlsValidationResult,
    createRlsAuthorizationError,
    type RlsContext,
    type UserRole,
    type RlsValidationResult
} from '../../../src/utils/rls';
import { AuthorizationError } from '../../utils/errors/applicationErrors';
import { Logger } from '../../utils/logger/logger';
import { QueryOptions, PaginatedResponse } from '../../types/api/api.types';
import { BaseEntity } from '../../types/database/entities.types';

/**
 * RLS-aware repository configuration
 */
export interface RlsAwareRepositoryConfig extends RepositoryConfig {
    enableRlsValidation?: boolean;
    enableRlsFiltering?: boolean;
}

/**
 * User context for RLS operations
 */
export interface UserContext {
    userId: string;
    userRole: UserRole;
    empresaId?: string;
}

/**
 * RLS-aware base repository
 */
export abstract class RlsAwareRepository<T extends BaseEntity> extends BaseRepository<T> {
    protected rlsConfig: {
        enableValidation: boolean;
        enableFiltering: boolean;
    };
    protected logger: Logger;
    protected currentUserContext: UserContext | null = null;

    constructor(config: RlsAwareRepositoryConfig) {
        super(config);

        this.rlsConfig = {
            enableValidation: config.enableRlsValidation ?? true,
            enableFiltering: config.enableRlsFiltering ?? true
        };

        this.logger = new Logger(`${this.constructor.name} (RLS-Aware)`);
    }

    /**
     * Set the current user context for RLS operations
     */
    setUserContext(context: UserContext): void {
        this.currentUserContext = context;
        this.logger.debug('User context set', {
            userId: context.userId,
            userRole: context.userRole,
            empresaId: context.empresaId
        });
    }

    /**
     * Get the current user context
     */
    getUserContext(): UserContext | null {
        return this.currentUserContext;
    }

    /**
     * Clear the current user context
     */
    clearUserContext(): void {
        this.currentUserContext = null;
        this.logger.debug('User context cleared');
    }

    /**
     * Create RLS context from current user context
     */
    protected createRlsContext(operation: 'read' | 'create' | 'update' | 'delete'): RlsContext {
        if (!this.currentUserContext) {
            throw new AuthorizationError('User context not set. Call setUserContext() first.');
        }

        return {
            userId: this.currentUserContext.userId,
            userRole: this.currentUserContext.userRole,
            empresaId: this.currentUserContext.empresaId,
            operation,
            tableName: this.config.table,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Validate RLS before an operation
     */
    protected validateRls(
        operation: 'read' | 'create' | 'update' | 'delete',
        data?: Record<string, any>
    ): RlsValidationResult {
        if (!this.rlsConfig.enableValidation) {
            return {
                isValid: true,
                status: 'enforced',
                violations: [],
                warnings: [],
                context: this.createRlsContext(operation)
            };
        }

        const context = this.createRlsContext(operation);
        let validationResult: RlsValidationResult;

        switch (operation) {
            case 'read':
                validationResult = validateReadAccess(
                    this.config.table,
                    context.userId,
                    context.userRole,
                    context.empresaId
                );
                break;
            case 'create':
                validationResult = validateCreateAccess(
                    this.config.table,
                    context.userId,
                    context.userRole,
                    context.empresaId,
                    data
                );
                break;
            case 'update':
                validationResult = validateUpdateAccess(
                    this.config.table,
                    context.userId,
                    context.userRole,
                    context.empresaId,
                    data
                );
                break;
            case 'delete':
                validationResult = validateDeleteAccess(
                    this.config.table,
                    context.userId,
                    context.userRole,
                    context.empresaId
                );
                break;
        }

        // Handle validation result
        const errorHandlerResult = handleRlsValidationResult(validationResult);

        if (!validationResult.isValid) {
            const errorDetails = {
                type: (validationResult.status === 'bypassed' ? 'policy_violation' : 'unknown') as any,
                code: 'RLS_VALIDATION_FAILED',
                message: validationResult.violations.join('; '),
                userMessage: errorHandlerResult.userMessage,
                context: validationResult.context,
                isRetryable: false,
                retryCount: 0,
                maxRetries: 0
            };

            throw createRlsAuthorizationError(errorDetails);
        }

        return validationResult;
    }

    /**
     * Apply RLS filters to query options
     */
    protected applyRlsFiltersToOptions(options: QueryOptions): QueryOptions {
        if (!this.rlsConfig.enableFiltering || !this.currentUserContext) {
            return options;
        }

        const rlsFilters = applyRlsFilters(
            this.config.table,
            this.currentUserContext.userRole,
            this.currentUserContext.empresaId,
            this.currentUserContext.userId,
            options.filters
        );

        return {
            ...options,
            filters: rlsFilters
        };
    }

    /**
     * Check RLS status for the current table
     */
    checkRlsStatus(): 'enforced' | 'bypassed' | 'unknown' | 'error' {
        if (!this.currentUserContext) {
            return 'unknown';
        }

        return checkRlsStatus(
            this.config.table,
            this.currentUserContext.userRole,
            this.currentUserContext.empresaId
        );
    }

    /**
     * Override findAll with RLS validation and filtering
     */
    async findAll(options: QueryOptions = {}): Promise<PaginatedResponse<T>> {
        // Validate RLS before read operation
        this.validateRls('read');

        // Apply RLS filters
        const rlsOptions = this.applyRlsFiltersToOptions(options);

        // Call parent method with filtered options
        return super.findAll(rlsOptions);
    }

    /**
     * Override findById with RLS validation
     */
    async findById(id: string): Promise<T | null> {
        // Validate RLS before read operation
        this.validateRls('read');

        // Call parent method
        return super.findById(id);
    }

    /**
     * Override create with RLS validation
     */
    async create(data: Partial<T>): Promise<T> {
        // Validate RLS before create operation
        this.validateRls('create', data);

        // Call parent method
        return super.create(data);
    }

    /**
     * Override update with RLS validation
     */
    async update(id: string, data: Partial<T>): Promise<T> {
        // Validate RLS before update operation
        this.validateRls('update', data);

        // Call parent method
        return super.update(id, data);
    }

    /**
     * Override delete with RLS validation
     */
    async delete(id: string): Promise<void> {
        // Validate RLS before delete operation
        this.validateRls('delete');

        // Call parent method
        return super.delete(id);
    }

    /**
     * Override findWithFilters with RLS validation and filtering
     */
    async findWithFilters(filters: Record<string, any>, options: QueryOptions = {}): Promise<PaginatedResponse<T>> {
        // Validate RLS before read operation
        this.validateRls('read');

        // Apply RLS filters
        const rlsOptions = this.applyRlsFiltersToOptions({
            ...options,
            filters: { ...options.filters, ...filters }
        });

        // Call parent method with filtered options
        return super.findAll(rlsOptions);
    }

    /**
     * Override count with RLS validation and filtering
     */
    async count(filters?: Record<string, any>): Promise<number> {
        // Validate RLS before read operation
        this.validateRls('read');

        // Apply RLS filters
        const rlsFilters = this.rlsConfig.enableFiltering && this.currentUserContext
            ? applyRlsFilters(
                this.config.table,
                this.currentUserContext.userRole,
                this.currentUserContext.empresaId,
                this.currentUserContext.userId,
                filters
            )
            : filters;

        // Call parent method with filtered options
        return super.count(rlsFilters);
    }

    /**
     * Check if user has permission for an operation
     */
    hasPermission(operation: 'read' | 'create' | 'update' | 'delete'): boolean {
        try {
            this.validateRls(operation);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get RLS configuration
     */
    public getRlsConfig() {
        return { ...this.rlsConfig };
    }

    /**
     * Enable or disable RLS validation
     */
    public setRlsValidation(enabled: boolean): void {
        this.rlsConfig.enableValidation = enabled;
        this.logger.debug('RLS validation', { enabled });
    }

    /**
     * Enable or disable RLS filtering
     */
    public setRlsFiltering(enabled: boolean): void {
        this.rlsConfig.enableFiltering = enabled;
        this.logger.debug('RLS filtering', { enabled });
    }
}
