/**
 * SupabaseEmpresasService - Service implementation for empresas using Supabase MCP
 * Provides CRUD operations for empresas with RLS enforcement
 */

import { supabaseMcpClient } from '../../../lib/integration/supabase/supabaseMcpClient';
import {
    Empresa,
    EmpresaFormData,
    EmpresaWithStats,
    EmpresaFilters
} from '../../types/domain/domain.types';
import { ApiResponse, QueryOptions } from '../../types/api/api.types';
import { TABLE_NAMES } from '../../../lib/types/database/entities.types';

export class SupabaseEmpresasService {
    private readonly tableName = TABLE_NAMES.EMPRESAS;

    /**
     * Get all empresas
     */
    async getAll(options?: QueryOptions): Promise<ApiResponse<Empresa[]>> {
        try {
            // Merge default filters with provided options
            const filters = {
                deleted_at: { is: null },
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

            const result = await supabaseMcpClient.query<Empresa>(this.tableName, {
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
     * Get empresa by ID
     */
    async getById(id: string): Promise<ApiResponse<Empresa>> {
        try {
            const result = await supabaseMcpClient.getById<Empresa>(this.tableName, id);

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
                        message: 'Empresa not found',
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
     * Create new empresa
     */
    async create(formData: EmpresaFormData): Promise<ApiResponse<Empresa>> {
        try {
            const empresaData: Partial<Empresa> = {
                nome: formData.nome,
                tipo: formData.tipo,
                contato_nome: formData.contato_nome,
                contato_email: formData.contato_email,
                status: formData.status || 'Ativa'
            };

            const result = await supabaseMcpClient.insert<Empresa>(this.tableName, empresaData);

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
     * Update empresa
     */
    async update(id: string, updates: Partial<EmpresaFormData>): Promise<ApiResponse<Empresa>> {
        try {
            const result = await supabaseMcpClient.update<Empresa>(this.tableName, id, updates);

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
     * Delete empresa (soft delete)
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
     * Get empresas with statistics
     */
    async getWithStats(options?: QueryOptions): Promise<ApiResponse<EmpresaWithStats[]>> {
        const response = await this.getAll(options);

        if (!response.success) {
            return {
                success: false,
                error: response.error
            };
        }

        const transformedData = response.data?.map(empresa => ({
            ...empresa,
            // Add statistics (placeholder - would need to query related tables)
            totalUsuarios: 0,
            totalFaltas: 0,
            ultimaAtividade: empresa.updated_at || empresa.created_at || new Date().toISOString(),
            // UI state
            isSelected: false,
            isExpanded: false
        })) || [];

        return {
            success: true,
            data: transformedData
        };
    }

    /**
     * Get empresas by status
     */
    async getByStatus(status: string, options?: QueryOptions): Promise<ApiResponse<Empresa[]>> {
        try {
            const result = await supabaseMcpClient.query<Empresa>(this.tableName, {
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
     * Get empresas by tipo
     */
    async getByTipo(tipo: string, options?: QueryOptions): Promise<ApiResponse<Empresa[]>> {
        try {
            const result = await supabaseMcpClient.query<Empresa>(this.tableName, {
                filters: {
                    tipo,
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
     * Search empresas by nome
     */
    async searchByNome(nome: string, options?: QueryOptions): Promise<ApiResponse<Empresa[]>> {
        try {
            const result = await supabaseMcpClient.query<Empresa>(this.tableName, {
                filters: {
                    nome: { ilike: `%${nome}%` },
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
     * Update empresa status
     */
    async updateStatus(id: string, status: 'Ativa' | 'Inativa'): Promise<ApiResponse<Empresa>> {
        return this.update(id, { status });
    }

    /**
     * Bulk update empresas status
     */
    async bulkUpdateStatus(ids: string[], status: 'Ativa' | 'Inativa'): Promise<ApiResponse<Empresa[]>> {
        try {
            const results = await Promise.all(
                ids.map(id => this.updateStatus(id, status))
            );

            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);

            if (failed.length > 0) {
                return {
                    success: false,
                    error: {
                        code: 'BULK_UPDATE_ERROR',
                        message: `Failed to update ${failed.length} empresas`,
                        statusCode: 500
                    }
                };
            }

            return {
                success: true,
                data: successful.map(r => r.data!).filter(Boolean)
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
     * Get empresas by contato email
     */
    async getByContatoEmail(email: string, options?: QueryOptions): Promise<ApiResponse<Empresa[]>> {
        try {
            const result = await supabaseMcpClient.query<Empresa>(this.tableName, {
                filters: {
                    contato_email: email,
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
     * Get empresas by date range
     */
    async getByDateRange(startDate: string, endDate: string, options?: QueryOptions): Promise<ApiResponse<Empresa[]>> {
        try {
            const result = await supabaseMcpClient.query<Empresa>(this.tableName, {
                filters: {
                    created_at: { from: startDate, to: endDate },
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
     * Search empresas (general search)
     */
    async search(term: string, options?: QueryOptions): Promise<ApiResponse<Empresa[]>> {
        try {
            const result = await supabaseMcpClient.query<Empresa>(this.tableName, {
                filters: {
                    or: {
                        nome: { ilike: `%${term}%` },
                        contato_nome: { ilike: `%${term}%` },
                        contato_email: { ilike: `%${term}%` }
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
     * Get count by status
     */
    async getCountByStatus(): Promise<Record<string, number>> {
        try {
            const ativaCount = await supabaseMcpClient.count(this.tableName, {
                status: 'Ativa',
                deleted_at: { is: null }
            });
            const inativaCount = await supabaseMcpClient.count(this.tableName, {
                status: 'Inativa',
                deleted_at: { is: null }
            });

            return {
                Ativa: ativaCount.count || 0,
                Inativa: inativaCount.count || 0
            };
        } catch (error) {
            return {
                Ativa: 0,
                Inativa: 0
            };
        }
    }
}

// Export singleton instance
export const supabaseEmpresasService = new SupabaseEmpresasService();
