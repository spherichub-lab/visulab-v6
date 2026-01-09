/**
 * Domain-specific hooks for usuarios (users) entity
 * Wraps generic query/mutation hooks with usuario-specific logic
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
    Usuario,
    UsuarioFormData,
    UsuarioFilters,
    UsuarioWithStats
} from '../../types/domain/domain.types';
import { QueryOptions } from '../../types/api/api.types';

/**
 * Hook for fetching a list of usuarios with optional filtering
 */
export function useUsuariosList(
    options?: QueryOptions
) {
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();
    return useGenericListQuery<Usuario>(
        'usuarios',
        usuariosService,
        options
    );
}

/**
 * Hook for fetching a single usuario by ID
 */
export function useUsuarioDetail(id: string) {
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();
    return useGenericDetailQuery<Usuario>(
        'usuarios',
        id,
        usuariosService
    );
}

/**
 * Hook for searching usuarios by name, email, or other fields
 */
export function useUsuariosSearch(searchQuery: string) {
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();
    return useGenericSearchQuery<Usuario>(
        'usuarios',
        searchQuery,
        usuariosService
    );
}

/**
 * Hook for creating a new usuario
 */
export function useCreateUsuario() {
    const queryClient = useQueryClient();
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();

    return useGenericCreateMutation<Usuario, UsuarioFormData>(
        'usuarios',
        usuariosService,
        {
            onSuccess: () => {
                // Invalidate usuarios queries after successful creation
                queryInvalidation.invalidateEntity(queryClient, 'usuarios');
            },
        }
    );
}

/**
 * Hook for updating an existing usuario
 */
export function useUpdateUsuario() {
    const queryClient = useQueryClient();
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();

    return useGenericUpdateMutation<Usuario, Partial<UsuarioFormData>>(
        'usuarios',
        usuariosService,
        {
            onSuccess: (data, variables) => {
                // Invalidate usuario queries after successful update
                queryInvalidation.invalidateEntity(queryClient, 'usuarios');
                queryInvalidation.invalidateEntityDetail(queryClient, 'usuarios', variables.id);
            },
        }
    );
}

/**
 * Hook for deleting an usuario
 */
export function useDeleteUsuario() {
    const queryClient = useQueryClient();
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();

    return useGenericDeleteMutation<Usuario>(
        'usuarios',
        usuariosService,
        {
            onSuccess: (data, variables) => {
                // Invalidate usuario queries after successful deletion
                queryInvalidation.invalidateEntity(queryClient, 'usuarios');
                // Also invalidate related faltas and compras since they belong to usuarios
                queryInvalidation.invalidateRelatedEntities(queryClient, 'usuarios', ['faltas', 'compras']);
            },
        }
    );
}

/**
 * Hook for fetching usuarios with statistics
 */
export function useUsuariosWithStats(options?: QueryOptions) {
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();

    return useQuery({
        queryKey: queryKeys.usuarios.list({ includeStats: true }),
        queryFn: async () => {
            const response = await usuariosService.getWithStats(options);
            return response.data;
        },
        ...cachePolicyUtils.createQueryOptions('usuarios'),
    });
}

/**
 * Hook for fetching usuarios by empresa
 */
export function useUsuariosByEmpresa(empresaId: string, options?: QueryOptions) {
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();

    return useQuery({
        queryKey: queryKeys.usuarios.list({ empresaId }),
        queryFn: async () => {
            const response = await usuariosService.getByEmpresa(empresaId, options);
            return response.data;
        },
        enabled: !!empresaId,
        ...cachePolicyUtils.createQueryOptions('usuarios'),
    });
}

/**
 * Hook for fetching usuarios by role
 */
export function useUsuariosByRole(role: string, options?: QueryOptions) {
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();

    return useQuery({
        queryKey: queryKeys.usuarios.list({ role }),
        queryFn: async () => {
            const response = await usuariosService.getByRole(role, options);
            return response.data;
        },
        enabled: !!role,
        ...cachePolicyUtils.createQueryOptions('usuarios'),
    });
}

/**
 * Hook for fetching usuarios by status
 */
export function useUsuariosByStatus(status: string, options?: QueryOptions) {
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();

    return useQuery({
        queryKey: queryKeys.usuarios.list({ status }),
        queryFn: async () => {
            const response = await usuariosService.getByStatus(status, options);
            return response.data;
        },
        enabled: !!status,
        ...cachePolicyUtils.createQueryOptions('usuarios'),
    });
}

/**
 * Hook for searching usuarios by nome
 */
export function useUsuariosSearchByNome(nome: string, options?: QueryOptions) {
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();

    return useQuery({
        queryKey: queryKeys.usuarios.search(nome),
        queryFn: async () => {
            const response = await usuariosService.searchByNome(nome, options);
            return response.data;
        },
        enabled: !!nome && nome.length > 0,
        ...cachePolicyUtils.createQueryOptions('usuarios'),
    });
}

/**
 * Hook for searching usuarios by email
 */
export function useUsuariosSearchByEmail(email: string, options?: QueryOptions) {
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();

    return useQuery({
        queryKey: queryKeys.usuarios.list({ email }),
        queryFn: async () => {
            const response = await usuariosService.searchByEmail(email, options);
            return response.data;
        },
        enabled: !!email && email.length > 0,
        ...cachePolicyUtils.createQueryOptions('usuarios'),
    });
}

/**
 * Hook for updating usuario status
 */
export function useUpdateUsuarioStatus() {
    const queryClient = useQueryClient();
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const response = await usuariosService.updateStatus(id, status);
            return response.data;
        },
        onSuccess: (data, variables) => {
            // Invalidate usuario queries after successful status update
            queryInvalidation.invalidateEntity(queryClient, 'usuarios');
            queryInvalidation.invalidateEntityDetail(queryClient, 'usuarios', variables.id);
        },
        ...cachePolicyUtils.createMutationOptions('standard'),
    });
}

/**
 * Hook for changing usuario role
 */
export function useChangeUsuarioRole() {
    const queryClient = useQueryClient();
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();

    return useMutation({
        mutationFn: async ({ id, role }: { id: string; role: string }) => {
            const response = await usuariosService.changeRole(id, role);
            return response.data;
        },
        onSuccess: (data, variables) => {
            // Invalidate usuario queries after successful role change
            queryInvalidation.invalidateEntity(queryClient, 'usuarios');
            queryInvalidation.invalidateEntityDetail(queryClient, 'usuarios', variables.id);
        },
        ...cachePolicyUtils.createMutationOptions('standard'),
    });
}

/**
 * Hook for bulk operations on usuarios
 */
export function useBulkUsuariosOperation() {
    const queryClient = useQueryClient();
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();

    return useMutation({
        mutationFn: async ({ ids, operation }: { ids: string[]; operation: 'activate' | 'deactivate' | 'delete' }) => {
            switch (operation) {
                case 'delete':
                    // Perform individual delete operations since bulkDelete might not be implemented
                    await Promise.all(ids.map(id => usuariosService.delete(id)));
                    break;
                case 'activate':
                    // Use bulkUpdateStatus if available, otherwise individual updates
                    if (usuariosService.bulkUpdateStatus) {
                        await usuariosService.bulkUpdateStatus(ids, 'Active');
                    } else {
                        await Promise.all(ids.map(id => usuariosService.updateStatus(id, 'Active')));
                    }
                    break;
                case 'deactivate':
                    // Use bulkUpdateStatus if available, otherwise individual updates
                    if (usuariosService.bulkUpdateStatus) {
                        await usuariosService.bulkUpdateStatus(ids, 'Inactive');
                    } else {
                        await Promise.all(ids.map(id => usuariosService.updateStatus(id, 'Inactive')));
                    }
                    break;
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }

            // Return proper ApiResponse format
            return {
                data: [] as Usuario[],
                success: true
            };
        },
        onSuccess: () => {
            // Invalidate all usuarios queries after bulk operation
            queryInvalidation.invalidateEntity(queryClient, 'usuarios');
            // Also invalidate related faltas and compras
            queryInvalidation.invalidateRelatedEntities(queryClient, 'usuarios', ['faltas', 'compras']);
        },
        ...cachePolicyUtils.createMutationOptions('standard'),
    });
}

/**
 * Hook for fetching usuario statistics
 */
export function useUsuarioStats(usuarioId?: string) {
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();

    return useQuery({
        queryKey: ['usuarios', 'stats', usuarioId],
        queryFn: async () => {
            // This would typically call a specialized endpoint on the service
            // For now, we'll return mock data
            return {
                totalFaltas: 0,
                ultimaAtividade: new Date().toISOString(),
            };
        },
        enabled: !!usuarioId,
        ...cachePolicyUtils.createQueryOptions('usuarios'),
    });
}

/**
 * Hook for fetching usuarios by date range
 */
export function useUsuariosByDateRange(startDate: string, endDate: string, options?: QueryOptions) {
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();

    return useQuery({
        queryKey: queryKeys.usuarios.list({ created_at: { from: startDate, to: endDate } }),
        queryFn: async () => {
            const response = await usuariosService.getByDateRange(startDate, endDate, options);
            return response.data;
        },
        enabled: !!startDate && !!endDate,
        ...cachePolicyUtils.createQueryOptions('usuarios'),
    });
}

/**
 * Prefetch usuarios list for better UX
 */
export function prefetchUsuariosList(queryClient: QueryClient, options?: QueryOptions) {
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();
    return queryInvalidation.prefetchEntityList(
        queryClient,
        'usuarios',
        () => usuariosService.getAll(options)
    );
}

/**
 * Prefetch usuario detail for better UX
 */
export function prefetchUsuarioDetail(queryClient: QueryClient, id: string) {
    const usuariosService = ServiceRegistry.getInstance().getUsuariosService();
    return queryInvalidation.prefetchEntityDetail(
        queryClient,
        'usuarios',
        id,
        () => usuariosService.getById(id)
    );
}