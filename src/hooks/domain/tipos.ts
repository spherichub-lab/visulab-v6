/**
 * Domain-specific hooks for tipos (types) entity
 * Wraps generic query/mutation hooks with tipo-specific logic
 */

import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import {
    useGenericListQuery,
    useGenericDetailQuery,
    useGenericSearchQuery
} from '../queries/useGenericQuery';
import {
    useGenericCreateMutation,
    useGenericUpdateMutation,
    useGenericDeleteMutation
} from '../queries/useGenericMutation';
import { queryKeys } from '../queries/queryKeysFactory';
import { queryInvalidation } from '../queries/queryInvalidation';
import { cachePolicyUtils } from '../queries/cachePolicies';
import { Tipo } from '../../types/domain/domain.types';
import { QueryOptions } from '../../types/api/api.types';
import { ServiceRegistry } from '../../services/core/ServiceRegistry';

// Get the tipos service from the registry
const getTiposService = () => ServiceRegistry.getInstance().getTiposService();

/**
 * Hook for fetching a list of tipos with optional filtering
 */
export function useTiposList(
    options?: QueryOptions
) {
    return useGenericListQuery<Tipo>(
        'tipos',
        getTiposService(),
        options
    );
}

/**
 * Hook for fetching a single tipo by ID
 */
export function useTipoDetail(id: string) {
    return useGenericDetailQuery<Tipo>(
        'tipos',
        id,
        getTiposService()
    );
}

/**
 * Hook for searching tipos by name
 */
export function useTiposSearch(searchQuery: string) {
    return useGenericSearchQuery<Tipo>(
        'tipos',
        searchQuery,
        getTiposService()
    );
}

/**
 * Hook for creating a new tipo
 */
export function useCreateTipo() {
    const queryClient = useQueryClient();

    return useGenericCreateMutation<Tipo, { nome: string }>(
        'tipos',
        getTiposService(),
        {
            onSuccess: () => {
                // Minimal invalidation - only invalidate tipos list queries
                queryInvalidation.invalidateEntityList(queryClient, 'tipos');
            },
        }
    );
}

/**
 * Hook for updating an existing tipo
 */
export function useUpdateTipo() {
    const queryClient = useQueryClient();

    return useGenericUpdateMutation<Tipo, Partial<{ nome: string }>>(
        'tipos',
        getTiposService(),
        {
            onSuccess: (data, variables) => {
                // Minimal invalidation - invalidate list and specific detail
                queryInvalidation.invalidateEntityList(queryClient, 'tipos');
                queryInvalidation.invalidateEntityDetail(queryClient, 'tipos', variables.id);
            },
        }
    );
}

/**
 * Hook for deleting an tipo
 */
export function useDeleteTipo() {
    const queryClient = useQueryClient();

    return useGenericDeleteMutation<Tipo>(
        'tipos',
        getTiposService(),
        {
            onSuccess: (data, variables) => {
                // Minimal invalidation - invalidate list queries and related entities
                queryInvalidation.invalidateEntityList(queryClient, 'tipos');
                // Also invalidate related faltas since they reference tipos
                queryInvalidation.invalidateRelatedEntities(queryClient, 'tipos', ['faltas']);
            },
        }
    );
}

/**
 * Hook for fetching all tipos (useful for dropdowns/selects)
 * This is reference data, so it should be cached for longer periods
 */
export function useAllTipos() {
    return useQuery({
        queryKey: queryKeys.tipos.lists,
        queryFn: async () => {
            const response = await getTiposService().getAll();
            return response.data;
        },
        // Apply reference cache policy
        staleTime: cachePolicyUtils.getPolicy('tipos').staleTime,
        gcTime: cachePolicyUtils.getPolicy('tipos').gcTime,
        refetchOnWindowFocus: cachePolicyUtils.getPolicy('tipos').refetchOnWindowFocus,
        refetchOnReconnect: cachePolicyUtils.getPolicy('tipos').refetchOnReconnect,
        refetchOnMount: cachePolicyUtils.getPolicy('tipos').refetchOnMount,
        retry: cachePolicyUtils.getPolicy('tipos').retry,
        retryDelay: cachePolicyUtils.getPolicy('tipos').retryDelay,
    });
}

/**
 * Prefetch tipos list for better UX
 */
export function prefetchTiposList(queryClient: QueryClient, options?: QueryOptions) {
    return queryInvalidation.prefetchEntityList(
        queryClient,
        'tipos',
        () => getTiposService().getAll(options)
    );
}

/**
 * Prefetch tipo detail for better UX
 */
export function prefetchTipoDetail(queryClient: QueryClient, id: string) {
    return queryInvalidation.prefetchEntityDetail(
        queryClient,
        'tipos',
        id,
        () => getTiposService().getById(id)
    );
}