/**
 * SupabaseTratamientosService - Service implementation for tratamientos using Supabase MCP
 * Provides CRUD operations for tratamientos with RLS enforcement
 */

import { supabaseMcpClient } from '../../../lib/integration/supabase/supabaseMcpClient';
import {
    Tratamento
} from '../../types/domain/domain.types';
import { ApiResponse, QueryOptions } from '../../types/api/api.types';
import { TABLE_NAMES } from '../../../lib/types/database/entities.types';

export class SupabaseTratamientosService {
    private readonly tableName = TABLE_NAMES.TRATAMENTOS;

    /**
     * Get all tratamientos
     */
    async getAll(options?: QueryOptions): Promise<ApiResponse<Tratamento[]>> {
        try {
            const result = await supabaseMcpClient.query<Tratamento>(this.tableName, {
                filters: {
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

    /**
     * Get tratamiento by ID
     */
    async getById(id: string): Promise<ApiResponse<Tratamento>> {
        try {
            const result = await supabaseMcpClient.getById<Tratamento>(this.tableName, id);

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
                        message: 'Tratamento not found',
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
     * Create new tratamento
     */
    async create(data: Partial<Tratamento>): Promise<ApiResponse<Tratamento>> {
        try {
            const result = await supabaseMcpClient.insert<Tratamento>(this.tableName, data);

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
     * Update tratamento
     */
    async update(id: string, updates: Partial<Tratamento>): Promise<ApiResponse<Tratamento>> {
        try {
            const result = await supabaseMcpClient.update<Tratamento>(this.tableName, id, updates);

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
     * Delete tratamento (soft delete)
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
     * Search tratamentos
     */
    async search(term: string, options?: QueryOptions): Promise<ApiResponse<Tratamento[]>> {
        try {
            const result = await supabaseMcpClient.query<Tratamento>(this.tableName, {
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
export const supabaseTratamientosService = new SupabaseTratamientosService();
