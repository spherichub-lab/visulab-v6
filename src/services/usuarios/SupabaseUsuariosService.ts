/**
 * SupabaseUsuariosService - Service implementation for usuarios using Supabase MCP
 * Provides CRUD operations for usuarios with RLS enforcement
 */

import { supabaseMcpClient } from '../../../lib/integration/supabase/supabaseMcpClient';
import {
    Usuario,
    UsuarioFormData,
    UsuarioFilters
} from '../../types/domain/domain.types';
import { ApiResponse, QueryOptions } from '../../types/api/api.types';
import { TABLE_NAMES } from '../../../lib/types/database/entities.types';

export class SupabaseUsuariosService {
    private readonly tableName = TABLE_NAMES.USUARIOS;

    /**
     * Get all usuarios
     */
    async getAll(options?: QueryOptions): Promise<ApiResponse<Usuario[]>> {
        try {
            const result = await supabaseMcpClient.query<Usuario>(this.tableName, {
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
     * Get usuario by ID
     */
    async getById(id: string): Promise<ApiResponse<Usuario>> {
        try {
            const result = await supabaseMcpClient.getById<Usuario>(this.tableName, id);

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
                        message: 'Usuario not found',
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
     * Create new usuario
     */
    async create(formData: UsuarioFormData): Promise<ApiResponse<Usuario>> {
        try {
            const usuarioData: Partial<Usuario> = {
                nome: formData.nome,
                email: formData.email,
                empresa_id: formData.empresa_id,
                status: formData.status || 'Active'
            };

            const result = await supabaseMcpClient.insert<Usuario>(this.tableName, usuarioData);

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
     * Update usuario
     */
    async update(id: string, updates: Partial<UsuarioFormData>): Promise<ApiResponse<Usuario>> {
        try {
            const result = await supabaseMcpClient.update<Usuario>(this.tableName, id, updates);

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
     * Delete usuario (soft delete)
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
     * Get usuarios by empresa
     */
    async getByEmpresa(empresaId: string, options?: QueryOptions): Promise<ApiResponse<Usuario[]>> {
        try {
            const result = await supabaseMcpClient.query<Usuario>(this.tableName, {
                filters: {
                    empresa_id: empresaId,
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
     * Get usuarios by status
     */
    async getByStatus(status: string, options?: QueryOptions): Promise<ApiResponse<Usuario[]>> {
        try {
            const result = await supabaseMcpClient.query<Usuario>(this.tableName, {
                filters: {
                    status,
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
     * Search usuarios by nome or email
     */
    async search(term: string, options?: QueryOptions): Promise<ApiResponse<Usuario[]>> {
        try {
            const result = await supabaseMcpClient.query<Usuario>(this.tableName, {
                filters: {
                    or: {
                        nome: { ilike: `%${term}%` },
                        email: { ilike: `%${term}%` }
                    },
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
     * Update usuario status
     */
    async updateStatus(id: string, status: 'Active' | 'Offline' | 'Pending' | 'Inactive'): Promise<ApiResponse<Usuario>> {
        return this.update(id, { status });
    }

    /**
     * Get count by status
     */
    async getCountByStatus(): Promise<Record<string, number>> {
        try {
            const ativoCount = await supabaseMcpClient.count(this.tableName, {
                status: 'Ativo',
                deleted_at: { is: null }
            });
            const inativoCount = await supabaseMcpClient.count(this.tableName, {
                status: 'Inativo',
                deleted_at: { is: null }
            });

            return {
                Ativo: ativoCount.count || 0,
                Inativo: inativoCount.count || 0
            };
        } catch (error) {
            return {
                Ativo: 0,
                Inativo: 0
            };
        }
    }
}

// Export singleton instance
export const supabaseUsuariosService = new SupabaseUsuariosService();
