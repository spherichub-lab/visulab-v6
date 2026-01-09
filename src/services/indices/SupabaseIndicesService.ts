/**
 * SupabaseIndicesService - Service implementation for indices using Supabase MCP
 * Provides CRUD operations for indices with RLS enforcement
 */

import { supabaseMcpClient } from '../../../lib/integration/supabase/supabaseMcpClient';
import {
    Indice
} from '../../types/domain/domain.types';
import { ApiResponse, QueryOptions } from '../../types/api/api.types';
import { TABLE_NAMES } from '../../../lib/types/database/entities.types';

export class SupabaseIndicesService {
    private readonly tableName = TABLE_NAMES.INDICES;

    /**
     * Get all indices
     */
    async getAll(options?: QueryOptions): Promise<ApiResponse<Indice[]>> {
        try {
            // Merge default filters with provided options
            const filters = {
                ...(options?.filters || {})
            };

            // Map frontend sort format to backend orderBy format
            const orderBy = options?.sort ? {
                column: options.sort.column,
                ascending: options.sort.direction === 'asc'
            } : {
                column: 'nome',
                ascending: true
            };

            const result = await supabaseMcpClient.query<Indice>(this.tableName, {
                filters,
                orderBy,
                limit: options?.limit,
                offset: options?.offset
            });

            if (result.error) {
                return {
                    success: false,
                    error: {
                        code: 'QUERY_ERROR',
                        message: result.error.message,
                        statusCode: 500
                    }
                };
            }

            return {
                success: true,
                data: result.data || []
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UNKNOWN_ERROR',
                    message: error.message || 'Unknown error occurred',
                    statusCode: 500
                }
            };
        }
    }

    /**
     * Get indice by ID
     */
    async getById(id: string): Promise<ApiResponse<Indice>> {
        try {
            const result = await supabaseMcpClient.getById<Indice>(this.tableName, id);

            if (result.error) {
                return {
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: result.error.message,
                        statusCode: 404
                    }
                };
            }

            if (!result.data || result.data.length === 0) {
                return {
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Indice not found',
                        statusCode: 404
                    }
                };
            }

            return {
                success: true,
                data: result.data[0]
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UNKNOWN_ERROR',
                    message: error.message || 'Unknown error occurred',
                    statusCode: 500
                }
            };
        }
    }

    /**
     * Create new indice
     */
    async create(data: Partial<Indice>): Promise<ApiResponse<Indice>> {
        try {
            const result = await supabaseMcpClient.insert<Indice>(this.tableName, data);

            if (result.error) {
                return {
                    success: false,
                    error: {
                        code: 'CREATE_ERROR',
                        message: result.error.message,
                        statusCode: 500
                    }
                };
            }

            return {
                success: true,
                data: result.data![0]
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UNKNOWN_ERROR',
                    message: error.message || 'Unknown error occurred',
                    statusCode: 500
                }
            };
        }
    }

    /**
     * Update indice
     */
    async update(id: string, updates: Partial<Indice>): Promise<ApiResponse<Indice>> {
        try {
            const result = await supabaseMcpClient.update<Indice>(this.tableName, id, updates);

            if (result.error) {
                return {
                    success: false,
                    error: {
                        code: 'UPDATE_ERROR',
                        message: result.error.message,
                        statusCode: 500
                    }
                };
            }

            return {
                success: true,
                data: result.data!
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UNKNOWN_ERROR',
                    message: error.message || 'Unknown error occurred',
                    statusCode: 500
                }
            };
        }
    }

    /**
     * Delete indice (soft delete)
     */
    async delete(id: string): Promise<ApiResponse<void>> {
        try {
            const result = await supabaseMcpClient.softDelete(this.tableName, id);

            if (result.error) {
                return {
                    success: false,
                    error: {
                        code: 'DELETE_ERROR',
                        message: result.error.message,
                        statusCode: 500
                    }
                };
            }

            return {
                success: true
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UNKNOWN_ERROR',
                    message: error.message || 'Unknown error occurred',
                    statusCode: 500
                }
            };
        }
    }

    /**
     * Search indices
     */
    async search(term: string, options?: QueryOptions): Promise<ApiResponse<Indice[]>> {
        try {
            const result = await supabaseMcpClient.query<Indice>(this.tableName, {
                filters: {
                    nome: { ilike: `%${term}%` },
                    deleted_at: { is: null }
                },
                orderBy: {
                    column: 'nome',
                    ascending: true
                },
                limit: options?.limit,
                offset: options?.offset
            });

            if (result.error) {
                return {
                    success: false,
                    error: {
                        code: 'QUERY_ERROR',
                        message: result.error.message,
                        statusCode: 500
                    }
                };
            }

            return {
                success: true,
                data: result.data || []
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UNKNOWN_ERROR',
                    message: error.message || 'Unknown error occurred',
                    statusCode: 500
                }
            };
        }
    }
}

// Export singleton instance
export const supabaseIndicesService = new SupabaseIndicesService();
