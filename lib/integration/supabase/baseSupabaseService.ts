/**
 * Base Supabase Service
 * Standardized service base class with error handling, retry logic, and logging
 * Integrates with RLS error taxonomy and retry strategy
 */

import { supabaseMcpClient } from './supabaseMcpClient';
import { SupabaseErrorHandler } from './supabaseErrorHandler';
import { RetryStrategy, RetryConfig } from './retryStrategy';
import { createServiceLogger, ServiceLogger, ServiceOperationContext } from '../../utils/logger/serviceLogger';
import {
    IService,
    ISupabaseService,
    ServiceMetadata,
    ServiceHealth,
    DEFAULT_RETRY_CONFIG
} from '../../../src/services/core/serviceInterfaces';
import { ApiResponse, QueryOptions } from '../../types/api/api.types';
import { isRlsError, mapToRlsErrorType } from './rlsErrorTaxonomy';
import { ApplicationError } from '../../utils/errors/applicationErrors';

/**
 * Base Supabase Service
 * Abstract class that all Supabase services should extend
 */
export abstract class BaseSupabaseService<T> implements ISupabaseService<T> {
    protected readonly supabaseClient = supabaseMcpClient;
    protected readonly errorHandler: SupabaseErrorHandler;
    protected readonly retryStrategy: RetryStrategy;
    protected readonly serviceLogger: ServiceLogger;

    // Abstract properties that must be defined by concrete services
    protected abstract readonly tableName: string;
    public abstract readonly metadata: ServiceMetadata;

    constructor(retryConfig?: Partial<RetryConfig>) {
        this.errorHandler = new SupabaseErrorHandler();
        this.retryStrategy = new RetryStrategy(retryConfig);
        this.serviceLogger = createServiceLogger(this.getServiceName());
    }

    /**
     * Get service name (to be used in constructor)
     */
    protected getServiceName(): string {
        return this.metadata.name;
    }

    /**
     * Initialize service
     */
    async initialize(): Promise<void> {
        this.serviceLogger.logInitialization(this.metadata.name, {
            tableName: this.tableName,
            capabilities: this.metadata.capabilities
        });
    }

    /**
     * Dispose service
     */
    async dispose(): Promise<void> {
        this.serviceLogger.logDisposal(this.metadata.name);
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<ServiceHealth> {
        const startTime = performance.now();

        try {
            // Simple query to test connection
            const { error } = await this.supabaseClient.query<T>(
                this.tableName,
                { limit: 1 }
            );

            const latency = performance.now() - startTime;

            if (error) {
                return {
                    status: 'unhealthy',
                    lastCheck: new Date().toISOString(),
                    latency,
                    errors: [error.message]
                };
            }

            return {
                status: 'healthy',
                lastCheck: new Date().toISOString(),
                latency
            };
        } catch (error: any) {
            return {
                status: 'unhealthy',
                lastCheck: new Date().toISOString(),
                errors: [error.message || 'Unknown error']
            };
        }
    }

    /**
     * Execute operation with error handling, retry, and logging
     */
    protected async executeOperation<R>(
        operation: string,
        fn: () => Promise<R>,
        context?: Partial<ServiceOperationContext>
    ): Promise<R> {
        const operationContext = this.serviceLogger.createContext(
            this.metadata.name,
            operation,
            context
        );

        return this.serviceLogger.executeWithLogging(operationContext, async () => {
            return this.retryStrategy.execute(
                operation,
                fn,
                { operation, table: this.tableName }
            );
        });
    }

    /**
     * Handle error with RLS detection
     */
    protected handleError(error: any, context?: ServiceOperationContext): ApplicationError {
        // Check for RLS errors
        if (isRlsError(error)) {
            const rlsErrorType = mapToRlsErrorType(error);

            if (rlsErrorType && context) {
                this.serviceLogger.logRlsViolation(context, {
                    table: this.tableName,
                    operation: context.operation,
                    role: context.userId || 'unknown', // Will be set by auth context
                    code: error.code || 'UNKNOWN',
                    message: error.message || 'RLS violation'
                });
            }
        }

        return this.errorHandler.handleError(error);
    }

    // CRUD Operations

    /**
     * Get all records
     */
    async getAll(options?: QueryOptions): Promise<ApiResponse<T[]>> {
        return this.executeOperation('getAll', async () => {
            const mcpOptions = this.convertToMcpOptions(options);
            const { data, error } = await this.supabaseClient.query<T>(
                this.tableName,
                mcpOptions
            );

            if (error) {
                throw error;
            }

            return {
                success: true,
                data: data || []
            };
        });
    }

    /**
     * Get record by ID
     */
    async getById(id: string): Promise<ApiResponse<T>> {
        return this.executeOperation('getById', async () => {
            const { data, error } = await this.supabaseClient.getById<T>(
                this.tableName,
                id
            );

            if (error) {
                throw error;
            }

            return {
                success: true,
                data: data && data.length > 0 ? data[0] : null as any
            };
        }, { entityId: id });
    }

    /**
     * Create new record
     */
    async create(data: any): Promise<ApiResponse<T>> {
        return this.executeOperation('create', async () => {
            const { data: result, error } = await this.supabaseClient.insert<T>(
                this.tableName,
                data
            );

            if (error) {
                throw error;
            }

            return {
                success: true,
                data: result as T
            };
        });
    }

    /**
     * Update record
     */
    async update(id: string, data: any): Promise<ApiResponse<T>> {
        return this.executeOperation('update', async () => {
            const { data: result, error } = await this.supabaseClient.update<T>(
                this.tableName,
                id,
                data
            );

            if (error) {
                throw error;
            }

            return {
                success: true,
                data: result as T
            };
        }, { entityId: id });
    }

    /**
     * Delete record
     */
    async delete(id: string): Promise<ApiResponse<void>> {
        return this.executeOperation('delete', async () => {
            const { error } = await this.supabaseClient.delete(
                this.tableName,
                id
            );

            if (error) {
                throw error;
            }

            return {
                success: true
            };
        }, { entityId: id });
    }

    // Query Operations

    /**
     * Find records with filters
     */
    async findWithFilters(
        filters: Record<string, any>,
        options?: QueryOptions
    ): Promise<ApiResponse<T[]>> {
        return this.executeOperation('findWithFilters', async () => {
            const mcpOptions = this.convertToMcpOptions({
                ...options,
                filters
            });

            const { data, error } = await this.supabaseClient.query<T>(
                this.tableName,
                mcpOptions
            );

            if (error) {
                throw error;
            }

            return {
                success: true,
                data: data || []
            };
        });
    }

    /**
     * Search records
     */
    async search(term: string, options?: QueryOptions): Promise<ApiResponse<T[]>> {
        return this.executeOperation('search', async () => {
            // This is a basic implementation - concrete services should override
            // with more specific search logic
            const searchFilters = {
                or: {
                    nome: { contains: term },
                    tipo: { contains: term }
                }
            };

            const mcpOptions = this.convertToMcpOptions({
                ...options,
                filters: searchFilters
            });

            const { data, error } = await this.supabaseClient.query<T>(
                this.tableName,
                mcpOptions
            );

            if (error) {
                throw error;
            }

            return {
                success: true,
                data: data || []
            };
        });
    }

    /**
     * Count records
     */
    async count(filters?: Record<string, any>): Promise<number> {
        return this.executeOperation('count', async () => {
            const { count, error } = await this.supabaseClient.count(
                this.tableName,
                filters
            );

            if (error) {
                throw error;
            }

            return count || 0;
        });
    }

    // Bulk Operations

    /**
     * Bulk create records
     */
    async bulkCreate(data: any[]): Promise<ApiResponse<T[]>> {
        return this.executeOperation('bulkCreate', async () => {
            const { data: result, error } = await this.supabaseClient.insert<T>(
                this.tableName,
                data
            );

            if (error) {
                throw error;
            }

            return {
                success: true,
                data: (result as any) || []
            };
        });
    }

    /**
     * Bulk update records
     */
    async bulkUpdate(
        updates: Array<{ id: string; data: any }>
    ): Promise<ApiResponse<T[]>> {
        return this.executeOperation('bulkUpdate', async () => {
            const results: T[] = [];
            const errors: any[] = [];

            // Process updates sequentially to avoid race conditions
            for (const update of updates) {
                const { data: result, error } = await this.supabaseClient.update<T>(
                    this.tableName,
                    update.id,
                    update.data
                );

                if (error) {
                    errors.push({ id: update.id, error });
                } else if (result) {
                    results.push(result);
                }
            }

            if (errors.length > 0) {
                throw new Error(`Bulk update failed for ${errors.length} records`);
            }

            return {
                success: true,
                data: results
            };
        });
    }

    /**
     * Bulk delete records
     */
    async bulkDelete(ids: string[]): Promise<ApiResponse<void>> {
        return this.executeOperation('bulkDelete', async () => {
            const errors: any[] = [];

            // Process deletes sequentially
            for (const id of ids) {
                const { error } = await this.supabaseClient.delete(
                    this.tableName,
                    id
                );

                if (error) {
                    errors.push({ id, error });
                }
            }

            if (errors.length > 0) {
                throw new Error(`Bulk delete failed for ${errors.length} records`);
            }

            return {
                success: true
            };
        });
    }

    /**
     * Soft delete record
     * Override in concrete services if soft delete is supported
     */
    async softDelete(id: string): Promise<ApiResponse<T>> {
        // Default implementation - concrete services should override
        // if they support soft delete
        return this.update(id, { deleted_at: new Date().toISOString() });
    }

    /**
     * Convert QueryOptions to MCP client options
     */
    private convertToMcpOptions(options?: QueryOptions) {
        if (!options) {
            return undefined;
        }

        const mcpOptions: any = {};

        if (options.filters) {
            mcpOptions.filters = options.filters;
        }

        if (options.sort) {
            mcpOptions.orderBy = {
                column: options.sort.column,
                ascending: options.sort.direction === 'asc'
            };
        }

        if (options.limit) {
            mcpOptions.limit = options.limit;
        }

        if (options.offset) {
            mcpOptions.offset = options.offset;
        }

        return mcpOptions;
    }
}
