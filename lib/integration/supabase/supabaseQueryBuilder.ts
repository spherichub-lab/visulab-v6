/**
 * Supabase Query Builder
 * Type-safe query construction with RLS integration
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Logger } from '../../utils/logger/logger';
import { QueryOptions, FilterParams, SortParams } from '../../types/api/api.types';
import { TableName } from '../../types/database/entities.types';

export interface SupabaseQueryResult<T = any> {
    data: T | null;
    error: Error | null;
    count?: number;
}

export class SupabaseQueryBuilder {
    private client: SupabaseClient;
    private logger: Logger;

    constructor(client: SupabaseClient) {
        this.client = client;
        this.logger = new Logger('SupabaseQueryBuilder');
    }

    /**
     * Build and execute a select query
     */
    async select<T = any>(
        table: TableName,
        options: QueryOptions = {}
    ): Promise<SupabaseQueryResult<T[]>> {
        try {
            let query = this.client.from(table).select(options.select || '*', { count: 'exact' });

            // Apply filters
            if (options.filters) {
                query = this.applyFilters(query, options.filters);
            }

            // Apply sorting
            if (options.sort) {
                query = query.order(options.sort.column, { ascending: options.sort.direction === 'asc' });
            }

            // Apply pagination
            if (options.limit) {
                query = query.limit(options.limit);
            }

            if (options.offset) {
                query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
            } else if (options.page && options.limit) {
                const offset = (options.page - 1) * options.limit;
                query = query.range(offset, offset + options.limit - 1);
            }

            const { data, error, count } = await query;

            this.logger.debug('Select query executed', {
                table,
                options,
                hasData: !!data,
                hasError: !!error,
                count
            });

            return {
                data: data as T[],
                error,
                count: count || undefined
            };
        } catch (error) {
            this.logger.error('Select query failed', error);
            return {
                data: null,
                error: error as Error
            };
        }
    }

    /**
     * Build and execute a single record query
     */
    async selectSingle<T = any>(
        table: TableName,
        id: string,
        select: string = '*'
    ): Promise<SupabaseQueryResult<T>> {
        try {
            const { data, error } = await this.client
                .from(table)
                .select(select)
                .eq('id', id)
                .single();

            this.logger.debug('Single select query executed', {
                table,
                id,
                hasData: !!data,
                hasError: !!error
            });

            return {
                data: data as T,
                error
            };
        } catch (error) {
            this.logger.error('Single select query failed', error);
            return {
                data: null,
                error: error as Error
            };
        }
    }

    /**
     * Build and execute an insert query
     */
    async insert<T = any>(
        table: TableName,
        data: Partial<T> | Partial<T>[]
    ): Promise<SupabaseQueryResult<T>> {
        try {
            const { data: result, error } = await this.client
                .from(table)
                .insert(data as any)
                .select()
                .single();

            this.logger.debug('Insert query executed', {
                table,
                hasData: !!result,
                hasError: !!error
            });

            return {
                data: result as T,
                error
            };
        } catch (error) {
            this.logger.error('Insert query failed', error);
            return {
                data: null,
                error: error as Error
            };
        }
    }

    /**
     * Build and execute an update query
     */
    async update<T = any>(
        table: TableName,
        id: string,
        data: Partial<T>
    ): Promise<SupabaseQueryResult<T>> {
        try {
            const { data: result, error } = await this.client
                .from(table)
                .update(data as any)
                .eq('id', id)
                .select()
                .single();

            this.logger.debug('Update query executed', {
                table,
                id,
                hasData: !!result,
                hasError: !!error
            });

            return {
                data: result as T,
                error
            };
        } catch (error) {
            this.logger.error('Update query failed', error);
            return {
                data: null,
                error: error as Error
            };
        }
    }

    /**
     * Build and execute a delete query
     */
    async delete(
        table: TableName,
        id: string
    ): Promise<SupabaseQueryResult<void>> {
        try {
            const { error } = await this.client
                .from(table)
                .delete()
                .eq('id', id);

            this.logger.debug('Delete query executed', {
                table,
                id,
                hasError: !!error
            });

            return {
                data: null,
                error
            };
        } catch (error) {
            this.logger.error('Delete query failed', error);
            return {
                data: null,
                error: error as Error
            };
        }
    }

    /**
     * Build and execute a soft delete query (update deleted_at)
     */
    async softDelete(
        table: TableName,
        id: string
    ): Promise<SupabaseQueryResult<void>> {
        try {
            const { error } = await this.client
                .from(table)
                .update({ deleted_at: new Date().toISOString() } as any)
                .eq('id', id);

            this.logger.debug('Soft delete query executed', {
                table,
                id,
                hasError: !!error
            });

            return {
                data: null,
                error
            };
        } catch (error) {
            this.logger.error('Soft delete query failed', error);
            return {
                data: null,
                error: error as Error
            };
        }
    }

    /**
     * Apply filters to query
     */
    private applyFilters(query: any, filters: FilterParams): any {
        Object.entries(filters).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                return;
            }

            if (typeof value === 'object' && value !== null) {
                // Handle complex filter objects
                if ('eq' in value) {
                    query = query.eq(key, value.eq);
                } else if ('neq' in value) {
                    query = query.neq(key, value.neq);
                } else if ('gt' in value) {
                    query = query.gt(key, value.gt);
                } else if ('gte' in value) {
                    query = query.gte(key, value.gte);
                } else if ('lt' in value) {
                    query = query.lt(key, value.lt);
                } else if ('lte' in value) {
                    query = query.lte(key, value.lte);
                } else if ('in' in value) {
                    query = query.in(key, value.in);
                } else if ('like' in value) {
                    query = query.like(key, value.like);
                } else if ('ilike' in value) {
                    query = query.ilike(key, value.ilike);
                }
            } else {
                // Simple equality filter
                query = query.eq(key, value);
            }
        });

        return query;
    }

    /**
     * Execute a raw SQL query (use with caution)
     */
    async raw<T = any>(sql: string, params: any[] = []): Promise<SupabaseQueryResult<T>> {
        try {
            const { data, error } = await this.client.rpc('execute_sql', {
                sql_query: sql,
                parameters: params
            });

            this.logger.debug('Raw SQL query executed', {
                sql,
                params,
                hasData: !!data,
                hasError: !!error
            });

            return {
                data: data as T,
                error
            };
        } catch (error) {
            this.logger.error('Raw SQL query failed', error);
            return {
                data: null,
                error: error as Error
            };
        }
    }

    /**
     * Execute a stored procedure/function
     */
    async rpc<T = any>(
        functionName: string,
        params: any = {}
    ): Promise<SupabaseQueryResult<T>> {
        try {
            const { data, error } = await this.client.rpc(functionName, params);

            this.logger.debug('RPC executed', {
                functionName,
                params,
                hasData: !!data,
                hasError: !!error
            });

            return {
                data: data as T,
                error
            };
        } catch (error) {
            this.logger.error('RPC failed', error);
            return {
                data: null,
                error: error as Error
            };
        }
    }
}