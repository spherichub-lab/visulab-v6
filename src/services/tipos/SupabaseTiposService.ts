/**
 * SupabaseTiposService - Service implementation for tipos using Supabase MCP
 * Provides CRUD operations for tipos with RLS enforcement
 */

import { supabaseMcpClient } from '../../../lib/integration/supabase/supabaseMcpClient';
import {
    Tipo
} from '../../types/domain/domain.types';
import { ApiResponse, QueryOptions } from '../../types/api/api.types';
import { TABLE_NAMES } from '../../../lib/types/database/entities.types';

export class SupabaseTiposService {
    private readonly tableName = TABLE_NAMES.TIPOS;

    /**
     * Get all tipos
     */
    async getAll(options?: QueryOptions): Promise<ApiResponse<Tipo[]>> {
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

            const result = await supabaseMcpClient.query<Tipo>(this.tableName, {
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
     * Get tipo by ID
     */
    async getById(id: string): Promise<ApiResponse<Tipo>> {
        try {
            const result = await supabaseMcpClient.getById<Tipo>(this.tableName, id);

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
                        message: 'Tipo not found',
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
     * Create new tipo
     */
    async create(data: Partial<Tipo>): Promise<ApiResponse<Tipo>> {
        try {
            const result = await supabaseMcpClient.insert<Tipo>(this.tableName, data);

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
     * Update tipo
     */
    async update(id: string, updates: Partial<Tipo>): Promise<ApiResponse<Tipo>> {
        try {
            const result = await supabaseMcpClient.update<Tipo>(this.tableName, id, updates);

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
     * Delete tipo (soft delete)
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
     * Search tipos
     */
    async search(term: string, options?: QueryOptions): Promise<ApiResponse<Tipo[]>> {
        try {
            const result = await supabaseMcpClient.query<Tipo>(this.tableName, {
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
export const supabaseTiposService = new SupabaseTiposService();
