/**
 * SupabaseFaltasService - Service implementation for faltas using Supabase MCP
 * Provides CRUD operations for faltas with RLS enforcement
 */

import { supabaseMcpClient } from '../../../lib/integration/supabase/supabaseMcpClient';
import {
    Falta,
    FaltaFormData,
    FaltaFilters
} from '../../types/domain/domain.types';
import { ApiResponse, QueryOptions } from '../../types/api/api.types';
import { TABLE_NAMES } from '../../../lib/types/database/entities.types';

export class SupabaseFaltasService {
    private readonly tableName = TABLE_NAMES.FALTAS;

    /**
     * Get all faltas
     */
    async getAll(options?: QueryOptions): Promise<ApiResponse<Falta[]>> {
        try {
            const result = await supabaseMcpClient.query<Falta>(this.tableName, {
                filters: {
                    deleted_at: { is: null }
                },
                orderBy: {
                    column: 'created_at',
                    ascending: false
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
     * Get falta by ID
     */
    async getById(id: string): Promise<ApiResponse<Falta>> {
        try {
            const result = await supabaseMcpClient.getById<Falta>(this.tableName, id);

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
                        message: 'Falta not found',
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
     * Create new falta
     */
    async create(formData: FaltaFormData): Promise<ApiResponse<Falta>> {
        try {
            const faltaData: Partial<Falta> = {
                usuario_id: formData.usuario_id,
                empresa_id: formData.empresa_id,
                tipo_id: formData.tipo_id,
                indice_id: formData.indice_id,
                tratamento_id: formData.tratamento_id,
                esf: formData.esf,
                cil: formData.cil,
                quantidade: formData.quantidade
            };

            const result = await supabaseMcpClient.insert<Falta>(this.tableName, faltaData);

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
     * Update falta
     */
    async update(id: string, updates: Partial<FaltaFormData>): Promise<ApiResponse<Falta>> {
        try {
            const result = await supabaseMcpClient.update<Falta>(this.tableName, id, updates);

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
     * Delete falta (soft delete)
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
     * Get faltas by usuario
     */
    async getByUsuario(usuarioId: string, options?: QueryOptions): Promise<ApiResponse<Falta[]>> {
        try {
            const result = await supabaseMcpClient.query<Falta>(this.tableName, {
                filters: {
                    usuario_id: usuarioId,
                    deleted_at: { is: null }
                },
                orderBy: {
                    column: 'created_at',
                    ascending: false
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
     * Get faltas by empresa
     */
    async getByEmpresa(empresaId: string, options?: QueryOptions): Promise<ApiResponse<Falta[]>> {
        try {
            const result = await supabaseMcpClient.query<Falta>(this.tableName, {
                filters: {
                    empresa_id: empresaId,
                    deleted_at: { is: null }
                },
                orderBy: {
                    column: 'created_at',
                    ascending: false
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
     * Search faltas
     */
    async search(term: string, options?: QueryOptions): Promise<ApiResponse<Falta[]>> {
        try {
            const result = await supabaseMcpClient.query<Falta>(this.tableName, {
                filters: {
                    deleted_at: { is: null }
                },
                orderBy: {
                    column: 'created_at',
                    ascending: false
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
export const supabaseFaltasService = new SupabaseFaltasService();
