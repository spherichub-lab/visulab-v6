/**
 * Domain-specific hooks for tratamientos (treatments) entity
 * Wraps generic query/mutation hooks with tratamiento-specific logic
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
import { Tratamento } from '../../types/domain/domain.types';
import { QueryOptions } from '../../types/api/api.types';
import { ServiceRegistry } from '../../services/core/ServiceRegistry';

// Get the tratamientos service from the registry
const getTratamientosService = () => ServiceRegistry.getInstance().getTratamientosService();

/**
 * Hook for fetching a list of tratamientos with optional filtering
 */
export function useTratamientosList(
    options?: QueryOptions
) {
    return useGenericListQuery<Tratamento>(
        'tratamientos',
        getTratamientosService(),
        options
    );
}

/**
 * Hook for fetching a single tratamiento by ID
 */
export function useTratamientoDetail(id: string) {
    return useGenericDetailQuery<Tratamento>(
        'tratamientos',
        id,
        getTratamientosService()
    );
}

/**
 * Hook for searching tratamientos by name
 */
export function useTratamientosSearch(searchQuery: string) {
    return useGenericSearchQuery<Tratamento>(
        'tratamientos',
        searchQuery,
        getTratamientosService()
    );
}

/**
 * Hook for creating a new tratamiento
 */
export function useCreateTratamiento() {
    const queryClient = useQueryClient();

    return useGenericCreateMutation<Tratamento, { nome: string }>(
        'tratamientos',
        getTratamientosService(),
        {
            onSuccess: () => {
                // Minimal invalidation - only invalidate tratamientos list queries
                queryInvalidation.invalidateEntityList(queryClient, 'tratamientos');
            },
        }
    );
}

/**
 * Hook for updating an existing tratamiento
 */
export function useUpdateTratamiento() {
    const queryClient = useQueryClient();

    return useGenericUpdateMutation<Tratamento, Partial<{ nome: string }>>(
        'tratamientos',
        getTratamientosService(),
        {
            onSuccess: (data, variables) => {
                // Minimal invalidation - invalidate list and specific detail
                queryInvalidation.invalidateEntityList(queryClient, 'tratamientos');
                queryInvalidation.invalidateEntityDetail(queryClient, 'tratamientos', variables.id);
            },
        }
    );
}

/**
 * Hook for deleting an tratamiento
 */
export function useDeleteTratamiento() {
    const queryClient = useQueryClient();

    return useGenericDeleteMutation<Tratamento>(
        'tratamientos',
        getTratamientosService(),
        {
            onSuccess: (data, variables) => {
                // Minimal invalidation - invalidate list queries and related entities
                queryInvalidation.invalidateEntityList(queryClient, 'tratamientos');
                // Also invalidate related faltas since they reference tratamientos
                queryInvalidation.invalidateRelatedEntities(queryClient, 'tratamientos', ['faltas']);
            },
        }
    );
}

/**
 * Hook for fetching all tratamientos (useful for dropdowns/selects)
 * This is reference data, so it should be cached for longer periods
 */
export function useAllTratamientos() {
    return useQuery({
        queryKey: queryKeys.tratamientos.lists,
        queryFn: async () => {
            const response = await getTratamientosService().getAll();
            return response.data;
        },
        // Apply reference cache policy
        staleTime: cachePolicyUtils.getPolicy('tratamientos').staleTime,
        gcTime: cachePolicyUtils.getPolicy('tratamientos').gcTime,
        refetchOnWindowFocus: cachePolicyUtils.getPolicy('tratamientos').refetchOnWindowFocus,
        refetchOnReconnect: cachePolicyUtils.getPolicy('tratamientos').refetchOnReconnect,
        refetchOnMount: cachePolicyUtils.getPolicy('tratamientos').refetchOnMount,
        retry: cachePolicyUtils.getPolicy('tratamientos').retry,
        retryDelay: cachePolicyUtils.getPolicy('tratamientos').retryDelay,
    });
}

/**
 * Prefetch tratamientos list for better UX
 */
export function prefetchTratamientosList(queryClient: QueryClient, options?: QueryOptions) {
    return queryInvalidation.prefetchEntityList(
        queryClient,
        'tratamientos',
        () => getTratamientosService().getAll(options)
    );
}

/**
 * Prefetch tratamiento detail for better UX
 */
export function prefetchTratamientoDetail(queryClient: QueryClient, id: string) {
    return queryInvalidation.prefetchEntityDetail(
        queryClient,
        'tratamientos',
        id,
        () => getTratamientosService().getById(id)
    );
}