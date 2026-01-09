/**
 * Domain-specific hooks for tratamentos (treatments) entity
 * Wraps generic query/mutation hooks with tratamento-specific logic
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
import { Tratamiento } from '../../types/domain/domain.types';
import { QueryOptions } from '../../types/api/api.types';
import { ServiceRegistry } from '../../services/core/ServiceRegistry';

// Get tratamentos service from registry
const getTratamentosService = () => ServiceRegistry.getInstance().getTratamentosService();

/**
 * Hook for fetching a list of tratamentos with optional filtering
 */
export function useTratamentosList(
    options?: QueryOptions
) {
    return useGenericListQuery<Tratamiento>(
        'tratamentos',
        getTratamentosService(),
        options
    );
}

/**
 * Hook for fetching a single tratamento by ID
 */
export function useTratamentoDetail(id: string) {
    return useGenericDetailQuery<Tratamiento>(
        'tratamentos',
        id,
        getTratamentosService()
    );
}

/**
 * Hook for searching tratamentos by name
 */
export function useTratamentosSearch(searchQuery: string) {
    return useGenericSearchQuery<Tratamiento>(
        'tratamentos',
        searchQuery,
        getTratamentosService()
    );
}

/**
 * Hook for creating a new tratamento
 */
export function useCreateTratamento() {
    const queryClient = useQueryClient();

    return useGenericCreateMutation<Tratamiento, { nome: string }>(
        'tratamentos',
        getTratamentosService(),
        {
            onSuccess: () => {
                // Minimal invalidation - only invalidate tratamentos list queries
                queryInvalidation.invalidateEntityList(queryClient, 'tratamentos');
            },
        }
    );
}

/**
 * Hook for updating an existing tratamento
 */
export function useUpdateTratamento() {
    const queryClient = useQueryClient();

    return useGenericUpdateMutation<Tratamiento, Partial<{ nome: string }>>(
        'tratamentos',
        getTratamentosService(),
        {
            onSuccess: (data, variables) => {
                // Minimal invalidation - invalidate list and specific detail
                queryInvalidation.invalidateEntityList(queryClient, 'tratamentos');
                queryInvalidation.invalidateEntityDetail(queryClient, 'tratamentos', variables.id);
            },
        }
    );
}

/**
 * Hook for deleting an tratamento
 */
export function useDeleteTratamento() {
    const queryClient = useQueryClient();

    return useGenericDeleteMutation<Tratamiento>(
        'tratamentos',
        getTratamentosService(),
        {
            onSuccess: (data, variables) => {
                // Minimal invalidation - invalidate list queries and related entities
                queryInvalidation.invalidateEntityList(queryClient, 'tratamentos');
                // Also invalidate related faltas since they reference tratamentos
                queryInvalidation.invalidateRelatedEntities(queryClient, 'tratamentos', ['faltas']);
            },
        }
    );
}

/**
 * Hook for fetching all tratamentos (useful for dropdowns/selects)
 * This is reference data, so it should be cached for longer periods
 */
export function useAllTratamentos() {
    return useQuery({
        queryKey: queryKeys.tratamentos.lists,
        queryFn: async () => {
            const response = await getTratamentosService().getAll();
            return response.data;
        },
        // Apply reference cache policy
        staleTime: cachePolicyUtils.getPolicy('tratamentos').staleTime,
        gcTime: cachePolicyUtils.getPolicy('tratamentos').gcTime,
        refetchOnWindowFocus: cachePolicyUtils.getPolicy('tratamentos').refetchOnWindowFocus,
        refetchOnReconnect: cachePolicyUtils.getPolicy('tratamentos').refetchOnReconnect,
        refetchOnMount: cachePolicyUtils.getPolicy('tratamentos').refetchOnMount,
        retry: cachePolicyUtils.getPolicy('tratamentos').retry,
        retryDelay: cachePolicyUtils.getPolicy('tratamentos').retryDelay,
    });
}

/**
 * Prefetch tratamentos list for better UX
 */
export function prefetchTratamentosList(queryClient: QueryClient, options?: QueryOptions) {
    return queryInvalidation.prefetchEntityList(
        queryClient,
        'tratamentos',
        () => getTratamentosService().getAll(options)
    );
}

/**
 * Prefetch tratamento detail for better UX
 */
export function prefetchTratamentoDetail(queryClient: QueryClient, id: string) {
    return queryInvalidation.prefetchEntityDetail(
        queryClient,
        'tratamentos',
        id,
        () => getTratamentosService().getById(id)
    );
}
