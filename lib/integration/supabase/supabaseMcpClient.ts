/**
 * Supabase MCP Client
 * Wrapper for Supabase MCP operations with RLS enforcement
 */

import { supabase } from '../../supabase';
import { PostgrestError } from '@supabase/supabase-js';

export interface QueryFilter {
    column: string;
    operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';
    value: any;
}

export interface QueryOptions {
    filters?: Record<string, any> | QueryFilter[];
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
}

export interface InsertResult<T> {
    data: T | null;
    error: Error | null;
}

export interface QueryResult<T> {
    data: T[] | null;
    error: Error | null;
}

export interface UpdateResult<T> {
    data: T | null;
    error: Error | null;
}

export interface DeleteResult {
    error: Error | null;
}

/**
 * Supabase MCP Client
 * Provides a typed interface for Supabase operations with RLS
 */
export class SupabaseMcpClient {
    /**
     * Query a table with filters
     */
    async query<T>(table: string, options?: QueryOptions): Promise<QueryResult<T>> {
        try {
            let query: any = supabase.from(table).select('*');

            // Apply filters
            if (options?.filters) {
                if (Array.isArray(options.filters)) {
                    // Array of QueryFilter objects
                    for (const filter of options.filters) {
                        const { column, operator = 'eq', value } = filter;
                        query = this.applyFilter(query, column, operator, value);
                    }
                } else {
                    // Object of filters
                    for (const [column, value] of Object.entries(options.filters)) {
                        if (column === 'or' && typeof value === 'object' && value !== null) {
                            // Handle OR filters
                            const orConditions = Object.entries(value)
                                .map(([col, val]) => {
                                    if (typeof val === 'object' && val !== null) {
                                        const [op, opVal] = Object.entries(val)[0];
                                        return `${col}.${op}.${opVal}`;
                                    }
                                    return `${col}.eq.${val}`;
                                })
                                .join(',');
                            query = query.or(orConditions);
                        } else if (typeof value === 'object' && value !== null) {
                            // Handle complex filters like { contains: 'term' }
                            for (const [op, opValue] of Object.entries(value)) {
                                query = this.applyComplexFilter(query, column, op, opValue);
                            }
                        } else {
                            // Simple equality filter
                            query = query.eq(column, value);
                        }
                    }
                }
            }

            // Apply ordering
            if (options?.orderBy) {
                query = query.order(options.orderBy.column, {
                    ascending: options.orderBy.ascending ?? true
                });
            }

            // Apply limit
            if (options?.limit) {
                query = query.limit(options.limit);
            }

            // Apply offset
            if (options?.offset) {
                query = query.range(options.offset, options.offset + (options.limit || 1000) - 1);
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            return { data: data as T[] | null, error: null };
        } catch (error) {
            return { data: null, error: error as Error };
        }
    }

    /**
     * Apply a single filter to query
     */
    private applyFilter(query: any, column: string, operator: string, value: any): any {
        switch (operator) {
            case 'eq':
                return query.eq(column, value);
            case 'neq':
                return query.neq(column, value);
            case 'gt':
                return query.gt(column, value);
            case 'gte':
                return query.gte(column, value);
            case 'lt':
                return query.lt(column, value);
            case 'lte':
                return query.lte(column, value);
            case 'like':
                return query.like(column, value);
            case 'ilike':
                return query.ilike(column, value);
            case 'in':
                return query.in(column, value);
            case 'is':
                return query.is(column, value);
            default:
                return query.eq(column, value);
        }
    }

    /**
     * Apply a complex filter to query
     */
    private applyComplexFilter(query: any, column: string, operator: string, value: any): any {
        switch (operator) {
            case 'contains':
                return query.ilike(column, `%${value}%`);
            case 'ilike':
                return query.ilike(column, `%${value}%`);
            case 'from':
                // Date range filters
                return query.gte(column, value);
            case 'to':
                return query.lte(column, value);
            case 'is':
                if (value === null) {
                    return query.filter(column, 'is', null);
                }
                return query.eq(column, value);
            default:
                return query.eq(column, value);
        }
    }

    /**
     * Insert a record into a table
     */
    async insert<T>(table: string, recordData: Partial<T> | Partial<T>[]): Promise<InsertResult<T>> {
        try {
            const { data, error } = await supabase
                .from(table)
                .insert(recordData)
                .select()
                .single();

            if (error) {
                throw error;
            }

            return { data: data as T | null, error: null };
        } catch (error) {
            return { data: null, error: error as Error };
        }
    }

    /**
     * Update a record in a table
     */
    async update<T>(table: string, id: string, recordData: Partial<T>): Promise<UpdateResult<T>> {
        try {
            const { data, error } = await supabase
                .from(table)
                .update({ ...recordData, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                throw error;
            }

            return { data: data as T | null, error: null };
        } catch (error) {
            return { data: null, error: error as Error };
        }
    }

    /**
     * Delete a record from a table
     */
    async delete(table: string, id: string): Promise<DeleteResult> {
        try {
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', id);

            if (error) {
                throw error;
            }

            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    }

    /**
     * Soft delete a record (update deleted_at timestamp)
     */
    async softDelete(table: string, id: string): Promise<UpdateResult<any>> {
        return this.update(table, id, {
            deleted_at: new Date().toISOString(),
            status: 'Inativa'
        });
    }

    /**
     * Get a record by ID
     */
    async getById<T>(table: string, id: string): Promise<QueryResult<T>> {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                throw error;
            }

            return { data: [data] as T[] | null, error: null };
        } catch (error) {
            return { data: null, error: error as Error };
        }
    }

    /**
     * Get count of records
     */
    async count(table: string, filters?: Record<string, any>): Promise<{ count: number | null; error: Error | null }> {
        try {
            let query: any = supabase.from(table);

            // Apply filters
            if (filters) {
                for (const [column, value] of Object.entries(filters)) {
                    if (typeof value === 'object' && value !== null) {
                        for (const [operator, opValue] of Object.entries(value)) {
                            switch (operator) {
                                case 'is':
                                    if (opValue === null) {
                                        query = query.filter(column, 'is', null);
                                    }
                                    break;
                                default:
                                    query = query.eq(column, opValue);
                            }
                        }
                    } else {
                        query = query.eq(column, value);
                    }
                }
            }

            const { count, error } = await query;

            if (error) {
                throw error;
            }

            return { count: count || null, error: null };
        } catch (error) {
            return { count: null, error: error as Error };
        }
    }
}

// Export singleton instance
export const supabaseMcpClient = new SupabaseMcpClient();
