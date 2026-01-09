/**
 * Domain-specific hooks for indices (indices) entity
 * Wraps generic query/mutation hooks with indice-specific logic
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
import { Indice } from '../../types/domain/domain.types';
import { QueryOptions } from '../../types/api/api.types';
import { ServiceRegistry } from '../../services/core/ServiceRegistry';

// Get the indices service from the registry
const getIndicesService = () => ServiceRegistry.getInstance().getIndicesService();

/**
 * Hook for fetching a list of indices with optional filtering
 */
export function useIndicesList(
    options?: QueryOptions
) {
    return useGenericListQuery<Indice>(
        'indices',
        getIndicesService(),
        options
    );
}

/**
 * Hook for fetching a single indice by ID
 */
export function useIndiceDetail(id: string) {
    return useGenericDetailQuery<Indice>(
        'indices',
        id,
        getIndicesService()
    );
}

/**
 * Hook for searching indices by name
 */
export function useIndicesSearch(searchQuery: string) {
    return useGenericSearchQuery<Indice>(
        'indices',
        searchQuery,
        getIndicesService()
    );
}

/**
 * Hook for creating a new indice
 */
export function useCreateIndice() {
    const queryClient = useQueryClient();

    return useGenericCreateMutation<Indice, { nome: string }>(
        'indices',
        getIndicesService(),
        {
            onSuccess: () => {
                // Minimal invalidation - only invalidate indices list queries
                queryInvalidation.invalidateEntityList(queryClient, 'indices');
            },
        }
    );
}

/**
 * Hook for updating an existing indice
 */
export function useUpdateIndice() {
    const queryClient = useQueryClient();

    return useGenericUpdateMutation<Indice, Partial<{ nome: string }>>(
        'indices',
        getIndicesService(),
        {
            onSuccess: (data, variables) => {
                // Minimal invalidation - invalidate list and specific detail
                queryInvalidation.invalidateEntityList(queryClient, 'indices');
                queryInvalidation.invalidateEntityDetail(queryClient, 'indices', variables.id);
            },
        }
    );
}

/**
 * Hook for deleting an indice
 */
export function useDeleteIndice() {
    const queryClient = useQueryClient();

    return useGenericDeleteMutation<Indice>(
        'indices',
        getIndicesService(),
        {
            onSuccess: (data, variables) => {
                // Minimal invalidation - invalidate list queries and related entities
                queryInvalidation.invalidateEntityList(queryClient, 'indices');
                // Also invalidate related faltas since they reference indices
                queryInvalidation.invalidateRelatedEntities(queryClient, 'indices', ['faltas']);
            },
        }
    );
}

/**
 * Hook for fetching all indices (useful for dropdowns/selects)
 * This is reference data, so it should be cached for longer periods
 */
export function useAllIndices() {
    return useQuery({
        queryKey: queryKeys.indices.lists,
        queryFn: async () => {
            const response = await getIndicesService().getAll();
            return response.data;
        },
        // Apply reference cache policy
        staleTime: cachePolicyUtils.getPolicy('indices').staleTime,
        gcTime: cachePolicyUtils.getPolicy('indices').gcTime,
        refetchOnWindowFocus: cachePolicyUtils.getPolicy('indices').refetchOnWindowFocus,
        refetchOnReconnect: cachePolicyUtils.getPolicy('indices').refetchOnReconnect,
        refetchOnMount: cachePolicyUtils.getPolicy('indices').refetchOnMount,
        retry: cachePolicyUtils.getPolicy('indices').retry,
        retryDelay: cachePolicyUtils.getPolicy('indices').retryDelay,
    });
}

/**
 * Prefetch indices list for better UX
 */
export function prefetchIndicesList(queryClient: QueryClient, options?: QueryOptions) {
    return queryInvalidation.prefetchEntityList(
        queryClient,
        'indices',
        () => getIndicesService().getAll(options)
    );
}

/**
 * Prefetch indice detail for better UX
 */
export function prefetchIndiceDetail(queryClient: QueryClient, id: string) {
    return queryInvalidation.prefetchEntityDetail(
        queryClient,
        'indices',
        id,
        () => getIndicesService().getById(id)
    );
}