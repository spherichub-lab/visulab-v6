/**
 * Domain-specific hooks for compras (purchases) entity
 * Wraps generic query/mutation hooks with compra-specific logic
 */

import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { ServiceRegistry } from '../../services/core/ServiceRegistry';
import {
    useGenericListQuery,
    useGenericDetailQuery,
    useGenericSearchQuery
} from '../queries/useGenericQuery';
import {
    useGenericCreateMutation,
    useGenericUpdateMutation,
    useGenericDeleteMutation,
    useGenericCustomMutation
} from '../queries/useGenericMutation';
import { queryKeys } from '../queries/queryKeysFactory';
import { queryInvalidation } from '../queries/queryInvalidation';
import { cachePolicyUtils } from '../queries/cachePolicies';
import {
    Compra,
    CompraFormData,
    CompraFilters,
    CompraWithUI
} from '../../types/domain/domain.types';
import { QueryOptions } from '../../types/api/api.types';

/**
 * Hook for fetching a list of compras with optional filtering
 */
export function useComprasList(
    options?: QueryOptions
) {
    const comprasService = ServiceRegistry.getInstance().getComprasService();
    return useGenericListQuery<Compra>(
        'compras',
        comprasService,
        options
    );
}

/**
 * Hook for fetching a single compra by ID
 */
export function useCompraDetail(id: string) {
    const comprasService = ServiceRegistry.getInstance().getComprasService();
    return useGenericDetailQuery<Compra>(
        'compras',
        id,
        comprasService
    );
}

/**
 * Hook for searching compras by various fields
 */
export function useComprasSearch(searchQuery: string) {
    const comprasService = ServiceRegistry.getInstance().getComprasService();
    return useGenericSearchQuery<Compra>(
        'compras',
        searchQuery,
        comprasService
    );
}

/**
 * Hook for creating a new compra
 */
export function useCreateCompra() {
    const queryClient = useQueryClient();
    const comprasService = ServiceRegistry.getInstance().getComprasService();

    return useGenericCreateMutation<Compra, CompraFormData>(
        'compras',
        comprasService,
        {
            onSuccess: () => {
                // Invalidate compras queries after successful creation
                queryInvalidation.invalidateEntity(queryClient, 'compras');
            },
        }
    );
}

/**
 * Hook for updating an existing compra
 */
export function useUpdateCompra() {
    const queryClient = useQueryClient();
    const comprasService = ServiceRegistry.getInstance().getComprasService();

    return useGenericUpdateMutation<Compra, Partial<CompraFormData>>(
        'compras',
        comprasService,
        {
            onSuccess: (data, variables) => {
                // Invalidate compra queries after successful update
                queryInvalidation.invalidateEntity(queryClient, 'compras');
                queryInvalidation.invalidateEntityDetail(queryClient, 'compras', variables.id);
            },
        }
    );
}

/**
 * Hook for deleting an compra
 */
export function useDeleteCompra() {
    const queryClient = useQueryClient();
    const comprasService = ServiceRegistry.getInstance().getComprasService();

    return useGenericDeleteMutation<Compra>(
        'compras',
        comprasService,
        {
            onSuccess: (data, variables) => {
                // Invalidate compra queries after successful deletion
                queryInvalidation.invalidateEntity(queryClient, 'compras');
            },
        }
    );
}

/**
 * Hook for fetching compras with UI extensions
 */
export function useComprasWithUI(options?: QueryOptions) {
    const comprasService = ServiceRegistry.getInstance().getComprasService();

    return useQuery({
        queryKey: queryKeys.compras.list({ ...options?.filters, includeUI: true }),
        queryFn: async () => {
            const response = await comprasService.getWithUI(options);
            return response.data;
        },
        ...cachePolicyUtils.createQueryOptions('compras'),
    });
}

/**
 * Hook for fetching compras by status
 */
export function useComprasByStatus(status: string, options?: QueryOptions) {
    const comprasService = ServiceRegistry.getInstance().getComprasService();

    return useQuery({
        queryKey: queryKeys.compras.list({ status }),
        queryFn: async () => {
            const response = await comprasService.getByStatus(status, options);
            return response.data;
        },
        enabled: !!status,
        ...cachePolicyUtils.createQueryOptions('compras'),
    });
}

/**
 * Hook for fetching compras by date range
 */
export function useComprasByDateRange(startDate: string, endDate: string, options?: QueryOptions) {
    const comprasService = ServiceRegistry.getInstance().getComprasService();

    return useQuery({
        queryKey: queryKeys.compras.list({ startDate, endDate }),
        queryFn: async () => {
            const response = await comprasService.getByDateRange(startDate, endDate, options);
            return response.data;
        },
        enabled: !!(startDate && endDate),
        ...cachePolicyUtils.createQueryOptions('compras'),
    });
}

/**
 * Hook for fetching compras by fornecedor
 */
export function useComprasByFornecedor(fornecedor: string, options?: QueryOptions) {
    const comprasService = ServiceRegistry.getInstance().getComprasService();

    return useQuery({
        queryKey: queryKeys.compras.list({ fornecedor }),
        queryFn: async () => {
            const response = await comprasService.getByFornecedor(fornecedor, options);
            return response.data;
        },
        enabled: !!fornecedor,
        ...cachePolicyUtils.createQueryOptions('compras'),
    });
}

/**
 * Hook for fetching compras by valor range
 */
export function useComprasByValorRange(min: number, max: number, options?: QueryOptions) {
    const comprasService = ServiceRegistry.getInstance().getComprasService();

    return useQuery({
        queryKey: queryKeys.compras.list({ valor_total: { min, max } }),
        queryFn: async () => {
            const response = await comprasService.getByValorRange(min, max, options);
            return response.data;
        },
        enabled: !!(min !== undefined && max !== undefined),
        ...cachePolicyUtils.createQueryOptions('compras'),
    });
}

/**
 * Hook for bulk operations on compras
 */
export function useBulkComprasOperation() {
    const queryClient = useQueryClient();
    const comprasService = ServiceRegistry.getInstance().getComprasService();

    return useMutation({
        mutationFn: async ({ ids, operation }: { ids: string[]; operation: 'approve' | 'cancel' | 'delete' }) => {
            switch (operation) {
                case 'delete':
                    // Perform individual delete operations since bulkDelete might not be implemented
                    await Promise.all(ids.map(id => comprasService.delete(id)));
                    break;
                case 'approve':
                    // Use bulkUpdateStatus if available, otherwise individual updates
                    if (comprasService.bulkUpdateStatus) {
                        await comprasService.bulkUpdateStatus(ids, 'Pago');
                    } else {
                        await Promise.all(ids.map(id => comprasService.updateStatus(id, 'Pago')));
                    }
                    break;
                case 'cancel':
                    // Use bulkUpdateStatus if available, otherwise individual updates
                    if (comprasService.bulkUpdateStatus) {
                        await comprasService.bulkUpdateStatus(ids, 'Cancelado');
                    } else {
                        await Promise.all(ids.map(id => comprasService.updateStatus(id, 'Cancelado')));
                    }
                    break;
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }

            // Return proper ApiResponse format
            return {
                data: [] as Compra[],
                success: true
            };
        },
        onSuccess: () => {
            // Invalidate all compras queries after bulk operation
            queryInvalidation.invalidateEntity(queryClient, 'compras');
        },
        ...cachePolicyUtils.createMutationOptions('standard'),
    });
}

/**
 * Hook for updating compra status
 */
export function useUpdateCompraStatus() {
    const queryClient = useQueryClient();
    const comprasService = ServiceRegistry.getInstance().getComprasService();

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const response = await comprasService.updateStatus(id, status);
            return response.data;
        },
        onSuccess: (data, variables) => {
            // Invalidate compra queries after successful status update
            queryInvalidation.invalidateEntity(queryClient, 'compras');
            queryInvalidation.invalidateEntityDetail(queryClient, 'compras', variables.id);
        },
        ...cachePolicyUtils.createMutationOptions('standard'),
    });
}

/**
 * Hook for fetching compra statistics
 */
export function useCompraStats(filters?: CompraFilters) {
    const comprasService = ServiceRegistry.getInstance().getComprasService();

    return useQuery({
        queryKey: ['compras', 'stats', filters],
        queryFn: async () => {
            // This would typically call a specialized endpoint on the service
            // For now, we'll return mock data
            return {
                total: 0,
                pendentes: 0,
                pagas: 0,
                canceladas: 0,
                valorTotal: 0,
            };
        },
        ...cachePolicyUtils.createQueryOptions('compras'),
    });
}

/**
 * Hook for fetching monthly compra summary
 */
export function useMonthlyCompraSummary(year: number, month: number) {
    const comprasService = ServiceRegistry.getInstance().getComprasService();

    return useQuery({
        queryKey: ['compras', 'monthly-summary', year, month],
        queryFn: async () => {
            const response = await comprasService.getMonthlySummary(year, month);
            return response.data;
        },
        enabled: !!(year && month),
        ...cachePolicyUtils.createQueryOptions('compras'),
    });
}

/**
 * Prefetch compras list for better UX
 */
export function prefetchComprasList(queryClient: QueryClient, options?: QueryOptions) {
    const comprasService = ServiceRegistry.getInstance().getComprasService();
    return queryInvalidation.prefetchEntityList(
        queryClient,
        'compras',
        () => comprasService.getAll(options)
    );
}

/**
 * Prefetch compra detail for better UX
 */
export function prefetchCompraDetail(queryClient: QueryClient, id: string) {
    const comprasService = ServiceRegistry.getInstance().getComprasService();
    return queryInvalidation.prefetchEntityDetail(
        queryClient,
        'compras',
        id,
        () => comprasService.getById(id)
    );
}