/**
 * Domain-specific hooks for empresas (companies) entity
 * Wraps generic query/mutation hooks with empresa-specific logic
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
    Empresa,
    EmpresaFormData,
    EmpresaFilters,
    EmpresaWithStats
} from '../../types/domain/domain.types';
import { QueryOptions } from '../../types/api/api.types';

/**
 * Hook for fetching a list of empresas with optional filtering
 */
export function useEmpresasList(
    options?: QueryOptions
) {
    const empresasService = ServiceRegistry.getInstance().getEmpresasService();
    return useGenericListQuery<Empresa>(
        'empresas',
        empresasService,
        options
    );
}

/**
 * Hook for fetching a single empresa by ID
 */
export function useEmpresaDetail(id: string) {
    const empresasService = ServiceRegistry.getInstance().getEmpresasService();
    return useGenericDetailQuery<Empresa>(
        'empresas',
        id,
        empresasService
    );
}

/**
 * Hook for searching empresas by name or other fields
 */
export function useEmpresasSearch(searchQuery: string) {
    const empresasService = ServiceRegistry.getInstance().getEmpresasService();
    return useGenericSearchQuery<Empresa>(
        'empresas',
        searchQuery,
        empresasService
    );
}

/**
 * Hook for creating a new empresa
 */
export function useCreateEmpresa() {
    const queryClient = useQueryClient();
    const empresasService = ServiceRegistry.getInstance().getEmpresasService();

    return useGenericCreateMutation<Empresa, EmpresaFormData>(
        'empresas',
        empresasService,
        {
            onSuccess: () => {
                // Invalidate empresas queries after successful creation
                queryInvalidation.invalidateEntity(queryClient, 'empresas');
            },
        }
    );
}

/**
 * Hook for updating an existing empresa
 */
export function useUpdateEmpresa() {
    const queryClient = useQueryClient();
    const empresasService = ServiceRegistry.getInstance().getEmpresasService();

    return useGenericUpdateMutation<Empresa, Partial<EmpresaFormData>>(
        'empresas',
        empresasService,
        {
            onSuccess: (data, variables) => {
                // Invalidate empresa queries after successful update
                queryInvalidation.invalidateEntity(queryClient, 'empresas');
                queryInvalidation.invalidateEntityDetail(queryClient, 'empresas', variables.id);
            },
        }
    );
}

/**
 * Hook for deleting an empresa
 */
export function useDeleteEmpresa() {
    const queryClient = useQueryClient();
    const empresasService = ServiceRegistry.getInstance().getEmpresasService();

    return useGenericDeleteMutation<Empresa>(
        'empresas',
        empresasService,
        {
            onSuccess: (data, variables) => {
                // Invalidate empresa queries after successful deletion
                queryInvalidation.invalidateEntity(queryClient, 'empresas');
                // Also invalidate related usuarios since they belong to empresas
                queryInvalidation.invalidateRelatedEntities(queryClient, 'empresas', ['usuarios']);
            },
        }
    );
}

/**
 * Hook for fetching empresas with statistics
 */
export function useEmpresasWithStats(options?: QueryOptions) {
    const empresasService = ServiceRegistry.getInstance().getEmpresasService();

    return useQuery({
        queryKey: queryKeys.empresas.list({ includeStats: true }),
        queryFn: async () => {
            const response = await empresasService.getWithStats(options);
            return response.data;
        },
        ...cachePolicyUtils.createQueryOptions('empresas'),
    });
}

/**
 * Hook for fetching empresas by status
 */
export function useEmpresasByStatus(status: string, options?: QueryOptions) {
    const empresasService = ServiceRegistry.getInstance().getEmpresasService();

    return useQuery({
        queryKey: queryKeys.empresas.list({ status }),
        queryFn: async () => {
            const response = await empresasService.getByStatus(status, options);
            return response.data;
        },
        enabled: !!status,
        ...cachePolicyUtils.createQueryOptions('empresas'),
    });
}

/**
 * Hook for fetching empresas by tipo
 */
export function useEmpresasByTipo(tipo: string, options?: QueryOptions) {
    const empresasService = ServiceRegistry.getInstance().getEmpresasService();

    return useQuery({
        queryKey: queryKeys.empresas.list({ tipo }),
        queryFn: async () => {
            const response = await empresasService.getByTipo(tipo, options);
            return response.data;
        },
        enabled: !!tipo,
        ...cachePolicyUtils.createQueryOptions('empresas'),
    });
}

/**
 * Hook for searching empresas by nome
 */
export function useEmpresasSearchByNome(nome: string, options?: QueryOptions) {
    const empresasService = ServiceRegistry.getInstance().getEmpresasService();

    return useQuery({
        queryKey: queryKeys.empresas.search(nome),
        queryFn: async () => {
            const response = await empresasService.searchByNome(nome, options);
            return response.data;
        },
        enabled: !!nome && nome.length > 0,
        ...cachePolicyUtils.createQueryOptions('empresas'),
    });
}

/**
 * Hook for updating empresa status
 */
export function useUpdateEmpresaStatus() {
    const queryClient = useQueryClient();
    const empresasService = ServiceRegistry.getInstance().getEmpresasService();

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: 'Ativa' | 'Inativa' }) => {
            const response = await empresasService.updateStatus(id, status);
            return response.data;
        },
        onSuccess: (data, variables) => {
            // Invalidate empresa queries after successful status update
            queryInvalidation.invalidateEntity(queryClient, 'empresas');
            queryInvalidation.invalidateEntityDetail(queryClient, 'empresas', variables.id);
        },
        ...cachePolicyUtils.createMutationOptions('standard'),
    });
}

/**
 * Hook for bulk operations on empresas
 */
export function useBulkEmpresasOperation() {
    const queryClient = useQueryClient();
    const empresasService = ServiceRegistry.getInstance().getEmpresasService();

    return useGenericCustomMutation<Empresa[], { ids: string[]; operation: 'activate' | 'deactivate' | 'delete' }>(
        'empresas',
        async ({ ids, operation }) => {
            switch (operation) {
                case 'delete':
                    // Perform individual delete operations since bulkDelete might not be implemented
                    await Promise.all(ids.map(id => empresasService.delete(id)));
                    break;
                case 'activate':
                    // Use bulkUpdateStatus if available, otherwise individual updates
                    if (empresasService.bulkUpdateStatus) {
                        await empresasService.bulkUpdateStatus(ids, 'Ativa');
                    } else {
                        await Promise.all(ids.map(id => empresasService.updateStatus(id, 'Ativa')));
                    }
                    break;
                case 'deactivate':
                    // Use bulkUpdateStatus if available, otherwise individual updates
                    if (empresasService.bulkUpdateStatus) {
                        await empresasService.bulkUpdateStatus(ids, 'Inativa');
                    } else {
                        await Promise.all(ids.map(id => empresasService.updateStatus(id, 'Inativa')));
                    }
                    break;
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }

            // Return proper ApiResponse format
            return {
                data: [] as Empresa[],
                success: true
            };
        },
        {
            onSuccess: () => {
                // Invalidate all empresas queries after bulk operation
                queryInvalidation.invalidateEntity(queryClient, 'empresas');
                // Also invalidate related usuarios
                queryInvalidation.invalidateRelatedEntities(queryClient, 'empresas', ['usuarios']);
            },
        }
    );
}

/**
 * Hook for fetching empresa statistics
 */
export function useEmpresaStats(empresaId?: string) {
    const empresasService = ServiceRegistry.getInstance().getEmpresasService();

    return useQuery({
        queryKey: ['empresas', 'stats', empresaId],
        queryFn: async () => {
            // This would typically call a specialized endpoint on the service
            // For now, we'll return mock data
            return {
                totalUsuarios: 0,
                totalFaltas: 0,
                ultimaAtividade: new Date().toISOString(),
            };
        },
        enabled: !!empresaId,
        ...cachePolicyUtils.createQueryOptions('empresas'),
    });
}

/**
 * Hook for fetching empresas by contato email
 */
export function useEmpresasByContatoEmail(email: string, options?: QueryOptions) {
    const empresasService = ServiceRegistry.getInstance().getEmpresasService();

    return useQuery({
        queryKey: queryKeys.empresas.list({ contato_email: email }),
        queryFn: async () => {
            const response = await empresasService.getByContatoEmail(email, options);
            return response.data;
        },
        enabled: !!email,
        ...cachePolicyUtils.createQueryOptions('empresas'),
    });
}

/**
 * Hook for fetching empresas by date range
 */
export function useEmpresasByDateRange(startDate: string, endDate: string, options?: QueryOptions) {
    const empresasService = ServiceRegistry.getInstance().getEmpresasService();

    return useQuery({
        queryKey: queryKeys.empresas.list({ created_at: { from: startDate, to: endDate } }),
        queryFn: async () => {
            const response = await empresasService.getByDateRange(startDate, endDate, options);
            return response.data;
        },
        enabled: !!startDate && !!endDate,
        ...cachePolicyUtils.createQueryOptions('empresas'),
    });
}

/**
 * Prefetch empresas list for better UX
 */
export function prefetchEmpresasList(queryClient: QueryClient, options?: QueryOptions) {
    const empresasService = ServiceRegistry.getInstance().getEmpresasService();
    return queryInvalidation.prefetchEntityList(
        queryClient,
        'empresas',
        () => empresasService.getAll(options)
    );
}

/**
 * Prefetch empresa detail for better UX
 */
export function prefetchEmpresaDetail(queryClient: QueryClient, id: string) {
    const empresasService = ServiceRegistry.getInstance().getEmpresasService();
    return queryInvalidation.prefetchEntityDetail(
        queryClient,
        'empresas',
        id,
        () => empresasService.getById(id)
    );
}