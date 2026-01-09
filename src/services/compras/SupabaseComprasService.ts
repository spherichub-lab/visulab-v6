/**
 * SupabaseComprasService - Service implementation for compras using Supabase MCP
 * Provides CRUD operations for compras with RLS enforcement
 */

import { supabaseMcpClient } from '../../../lib/integration/supabase/supabaseMcpClient';
import {
    Compra,
    CompraFormData,
    CompraFilters
} from '../../types/domain/domain.types';
import { ApiResponse, QueryOptions } from '../../types/api/api.types';
import { TABLE_NAMES } from '../../../lib/types/database/entities.types';

export class SupabaseComprasService {
    private readonly tableName = TABLE_NAMES.COMPRAS;

    /**
     * Get all compras
     */
    async getAll(options?: QueryOptions): Promise<ApiResponse<Compra[]>> {
        try {
            const result = await supabaseMcpClient.query<Compra>(this.tableName, {
                filters: {
                    deleted_at: { is: null }
                },
                orderBy: {
                    column: 'data_compra',
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
     * Get compra by ID
     */
    async getById(id: string): Promise<ApiResponse<Compra>> {
        try {
            const result = await supabaseMcpClient.getById<Compra>(this.tableName, id);

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
                        message: 'Compra not found',
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
     * Create new compra
     */
    async create(formData: CompraFormData): Promise<ApiResponse<Compra>> {
        try {
            const compraData: Partial<Compra> = {
                fornecedor: formData.fornecedor,
                data_compra: formData.data_compra,
                valor_total: formData.valor_total,
                status: formData.status || 'Pendente',
                descricao: formData.descricao
            };

            const result = await supabaseMcpClient.insert<Compra>(this.tableName, compraData);

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
     * Update compra
     */
    async update(id: string, updates: Partial<CompraFormData>): Promise<ApiResponse<Compra>> {
        try {
            const result = await supabaseMcpClient.update<Compra>(this.tableName, id, updates);

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
     * Delete compra (soft delete)
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
     * Get compras by fornecedor
     */
    async getByFornecedor(fornecedor: string, options?: QueryOptions): Promise<ApiResponse<Compra[]>> {
        try {
            const result = await supabaseMcpClient.query<Compra>(this.tableName, {
                filters: {
                    fornecedor,
                    deleted_at: { is: null }
                },
                orderBy: {
                    column: 'data_compra',
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
     * Get compras by status
     */
    async getByStatus(status: string, options?: QueryOptions): Promise<ApiResponse<Compra[]>> {
        try {
            const result = await supabaseMcpClient.query<Compra>(this.tableName, {
                filters: {
                    status,
                    deleted_at: { is: null }
                },
                orderBy: {
                    column: 'data_compra',
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
     * Search compras
     */
    async search(term: string, options?: QueryOptions): Promise<ApiResponse<Compra[]>> {
        try {
            const result = await supabaseMcpClient.query<Compra>(this.tableName, {
                filters: {
                    or: {
                        fornecedor: { ilike: `%${term}%` },
                        descricao: { ilike: `%${term}%` }
                    },
                    deleted_at: { is: null }
                },
                orderBy: {
                    column: 'data_compra',
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
     * Update compra status
     */
    async updateStatus(id: string, status: 'Pendente' | 'Pago' | 'Cancelado'): Promise<ApiResponse<Compra>> {
        return this.update(id, { status });
    }

    /**
     * Get count by status
     */
    async getCountByStatus(): Promise<Record<string, number>> {
        try {
            const pendenteCount = await supabaseMcpClient.count(this.tableName, {
                status: 'Pendente',
                deleted_at: { is: null }
            });
            const pagoCount = await supabaseMcpClient.count(this.tableName, {
                status: 'Pago',
                deleted_at: { is: null }
            });
            const canceladoCount = await supabaseMcpClient.count(this.tableName, {
                status: 'Cancelado',
                deleted_at: { is: null }
            });

            return {
                Pendente: pendenteCount.count || 0,
                Pago: pagoCount.count || 0,
                Cancelado: canceladoCount.count || 0
            };
        } catch (error) {
            return {
                Pendente: 0,
                Pago: 0,
                Cancelado: 0
            };
        }
    }
}

// Export singleton instance
export const supabaseComprasService = new SupabaseComprasService();
