/**
 * Base Repository
 * Generic CRUD operations with optional caching for reference data
 */

import { supabase } from '../../supabase';
import { SupabaseQueryBuilder } from '../../integration/supabase';
import { SupabaseErrorHandler } from '../../integration/supabase';
import { SimpleCacheManager } from '../../utils/cache';
import { Logger } from '../../utils/logger/logger';
import { ApplicationError, DatabaseError, NotFoundError } from '../../utils/errors/applicationErrors';
import { BaseEntity, TableName } from '../../types/database/entities.types';
import { QueryOptions, PaginatedResponse } from '../../types/api/api.types';

export interface RepositoryConfig {
    table: TableName;
    useCache?: boolean;
    cacheKey?: string;
    cacheTtl?: number;
    enableSoftDelete?: boolean;
    defaultSelect?: string;
}

export abstract class BaseRepository<T extends BaseEntity> {
    protected queryBuilder: SupabaseQueryBuilder;
    protected errorHandler: SupabaseErrorHandler;
    protected logger: Logger;
    protected cache?: SimpleCacheManager;
    protected config: RepositoryConfig;

    constructor(config: RepositoryConfig) {
        // FIX: Use single Supabase client instance from lib/supabase.ts
        // This prevents multiple client instances which cause session loss
        this.queryBuilder = new SupabaseQueryBuilder(supabase);
        this.errorHandler = new SupabaseErrorHandler();
        this.logger = new Logger(`${this.constructor.name}`);
        this.config = {
            useCache: false,
            enableSoftDelete: false,
            defaultSelect: '*',
            ...config
        };

        // Initialize cache if enabled
        if (this.config.useCache) {
            this.cache = new SimpleCacheManager({
                defaultTtl: this.config.cacheTtl || 1800 // 30 minutes default
            });
        }
    }

    /**
     * Find all records with optional filtering and pagination
     */
    async findAll(options: QueryOptions = {}): Promise<PaginatedResponse<T>> {
        try {
            this.logger.debug('Finding all records', { table: this.config.table, options });

            // Check cache first for reference data
            if (this.shouldUseCache(options)) {
                const cacheKey = this.getCacheKey('all', options);
                const cached = this.cache?.get<PaginatedResponse<T>>(cacheKey);
                if (cached) {
                    this.logger.debug('Cache hit for findAll', { cacheKey });
                    return cached;
                }
            }

            const result = await this.queryBuilder.select<T>(this.config.table, options);

            if (result.error) {
                throw this.errorHandler.handleError(result.error);
            }

            const response: PaginatedResponse<T> = {
                data: result.data || [],
                pagination: {
                    page: options.page || 1,
                    limit: options.limit || 10,
                    total: result.count || 0,
                    totalPages: Math.ceil((result.count || 0) / (options.limit || 10)),
                    hasNext: (options.page || 1) * (options.limit || 10) < (result.count || 0),
                    hasPrev: (options.page || 1) > 1
                }
            };

            // Cache the result for reference data
            if (this.shouldUseCache(options)) {
                const cacheKey = this.getCacheKey('all', options);
                this.cache?.set(cacheKey, response);
            }

            this.logger.debug('Find all completed', {
                table: this.config.table,
                count: response.data.length,
                total: response.pagination.total
            });

            return response;
        } catch (error) {
            this.logger.error('Find all failed', {
                table: this.config.table,
                options,
                error
            });
            throw error instanceof ApplicationError ? error : this.errorHandler.handleError(error);
        }
    }

    /**
     * Find record by ID
     */
    async findById(id: string): Promise<T | null> {
        try {
            this.logger.debug('Finding by ID', { table: this.config.table, id });

            // Check cache first for reference data
            if (this.config.useCache) {
                const cacheKey = this.getCacheKey(`id:${id}`);
                const cached = this.cache?.get<T>(cacheKey);
                if (cached) {
                    this.logger.debug('Cache hit for findById', { cacheKey });
                    return cached;
                }
            }

            const result = await this.queryBuilder.selectSingle<T>(
                this.config.table,
                id,
                this.config.defaultSelect
            );

            if (result.error) {
                if (result.error.message.includes('No rows returned')) {
                    return null;
                }
                throw this.errorHandler.handleError(result.error);
            }

            // Cache the result for reference data
            if (this.config.useCache && result.data) {
                const cacheKey = this.getCacheKey(`id:${id}`);
                this.cache?.set(cacheKey, result.data);
            }

            this.logger.debug('Find by ID completed', {
                table: this.config.table,
                id,
                found: !!result.data
            });

            return result.data;
        } catch (error) {
            this.logger.error('Find by ID failed', {
                table: this.config.table,
                id,
                error
            });
            throw error instanceof ApplicationError ? error : this.errorHandler.handleError(error);
        }
    }

    /**
     * Create new record
     */
    async create(data: Partial<T>): Promise<T> {
        try {
            this.logger.debug('Creating record', {
                table: this.config.table,
                data: this.sanitizeLogData(data)
            });

            const result = await this.queryBuilder.insert<T>(this.config.table, data);

            if (result.error) {
                throw this.errorHandler.handleError(result.error);
            }

            if (!result.data) {
                throw new DatabaseError('Create operation returned no data');
            }

            // Invalidate cache for reference data
            if (this.config.useCache) {
                this.invalidateCache();
            }

            this.logger.info('Record created successfully', {
                table: this.config.table,
                id: result.data.id
            });

            return result.data;
        } catch (error) {
            this.logger.error('Create failed', {
                table: this.config.table,
                data: this.sanitizeLogData(data),
                error
            });
            throw error instanceof ApplicationError ? error : this.errorHandler.handleError(error);
        }
    }

    /**
     * Update existing record
     */
    async update(id: string, data: Partial<T>): Promise<T> {
        try {
            this.logger.debug('Updating record', {
                table: this.config.table,
                id,
                data: this.sanitizeLogData(data)
            });

            const result = await this.queryBuilder.update<T>(this.config.table, id, data);

            if (result.error) {
                throw this.errorHandler.handleError(result.error);
            }

            if (!result.data) {
                throw new NotFoundError(`Record with ID ${id} not found`);
            }

            // Invalidate cache for reference data
            if (this.config.useCache) {
                this.invalidateCache();
                this.cache?.delete(this.getCacheKey(`id:${id}`));
            }

            this.logger.info('Record updated successfully', {
                table: this.config.table,
                id
            });

            return result.data;
        } catch (error) {
            this.logger.error('Update failed', {
                table: this.config.table,
                id,
                data: this.sanitizeLogData(data),
                error
            });
            throw error instanceof ApplicationError ? error : this.errorHandler.handleError(error);
        }
    }

    /**
     * Delete record by ID
     */
    async delete(id: string): Promise<void> {
        try {
            this.logger.debug('Deleting record', {
                table: this.config.table,
                id
            });

            if (this.config.enableSoftDelete) {
                const result = await this.queryBuilder.softDelete(this.config.table, id);
            } else {
                const result = await this.queryBuilder.delete(this.config.table, id);
            }

            // Invalidate cache for reference data
            if (this.config.useCache) {
                this.invalidateCache();
                this.cache?.delete(this.getCacheKey(`id:${id}`));
            }

            this.logger.info('Record deleted successfully', {
                table: this.config.table,
                id
            });
        } catch (error) {
            this.logger.error('Delete failed', {
                table: this.config.table,
                id,
                error
            });
            throw error instanceof ApplicationError ? error : this.errorHandler.handleError(error);
        }
    }

    /**
     * Find records with custom filters
     */
    async findWithFilters(filters: Record<string, any>, options: QueryOptions = {}): Promise<PaginatedResponse<T>> {
        const queryOptions = {
            ...options,
            filters: { ...options.filters, ...filters }
        };

        return this.findAll(queryOptions);
    }

    /**
     * Count records with optional filters
     */
    async count(filters?: Record<string, any>): Promise<number> {
        try {
            this.logger.debug('Counting records', {
                table: this.config.table,
                filters
            });

            const options: QueryOptions = {
                select: 'id',
                filters
            };

            const result = await this.queryBuilder.select(this.config.table, options);

            if (result.error) {
                throw this.errorHandler.handleError(result.error);
            }

            const count = result.count || result.data?.length || 0;

            this.logger.debug('Count completed', {
                table: this.config.table,
                count
            });

            return count;
        } catch (error) {
            this.logger.error('Count failed', {
                table: this.config.table,
                filters,
                error
            });
            throw error instanceof ApplicationError ? error : this.errorHandler.handleError(error);
        }
    }

    /**
     * Check if record exists
     */
    async exists(id: string): Promise<boolean> {
        try {
            const record = await this.findById(id);
            return record !== null;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get cache key for operations
     */
    protected getCacheKey(operation: string, options?: any): string {
        const baseKey = this.config.cacheKey || this.config.table;
        if (options) {
            return `${baseKey}:${operation}:${JSON.stringify(options)}`;
        }
        return `${baseKey}:${operation}`;
    }

    /**
     * Check if cache should be used for this operation
     */
    protected shouldUseCache(options?: any): boolean {
        return !!(this.config.useCache && this.cache && !options?.filters);
    }

    /**
     * Invalidate cache entries
     */
    protected invalidateCache(): void {
        if (this.cache) {
            this.cache.invalidatePattern(`${this.config.table}:`);
        }
    }

    /**
     * Sanitize data for logging (remove sensitive fields)
     */
    protected sanitizeLogData(data: any): any {
        if (!data || typeof data !== 'object') {
            return data;
        }

        const sensitiveFields = ['password', 'token', 'secret', 'key'];
        const sanitized = { ...data };

        for (const field of sensitiveFields) {
            if (field in sanitized) {
                sanitized[field] = '[REDACTED]';
            }
        }

        return sanitized;
    }

    /**
     * Get repository configuration
     */
    public getConfig(): RepositoryConfig {
        return { ...this.config };
    }

    /**
     * Get cache statistics
     */
    public getCacheStats() {
        return this.cache?.getStats();
    }

    /**
     * Clear cache
     */
    public clearCache(): void {
        if (this.cache) {
            this.cache.clear();
        }
    }
}