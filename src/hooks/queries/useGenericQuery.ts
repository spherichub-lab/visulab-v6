/**
 * Generic query hook templates for TanStack Query
 * Provides reusable hooks for list and detail queries
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { QueryOptions, PaginatedResponse, ApiResponse } from '../../types/api/api.types';
import { createQueryKeys, queryKeyUtils } from './queryKeysFactory';
import { cachePolicyUtils } from './cachePolicies';

// Generic query hook options
export interface UseGenericQueryOptions<TData, TError> {
    enabled?: boolean;
    select?: (data: TData) => TData;
    onSuccess?: (data: TData) => void;
    onError?: (error: TError) => void;
    onSettled?: (data: TData | undefined, error: TError | null) => void;
    refetchInterval?: number | false;
    refetchIntervalInBackground?: boolean;
}

// Generic list query hook
export function useGenericListQuery<T>(
    entityType: string,
    service: any,
    options?: QueryOptions,
    queryOptions?: UseGenericQueryOptions<PaginatedResponse<T>, Error>
): UseQueryResult<PaginatedResponse<T>, Error> {
    const queryKeys = createQueryKeys<T>(entityType);
    const queryKey = queryKeys.list(options?.filters);

    return useQuery({
        queryKey,
        queryFn: async () => {
            const response = await service.getAll(options);

            // Transform ApiResponse<T[]> into PaginatedResponse<T>
            if (!response.success || response.error) {
                throw new Error(response.error?.message || 'Failed to fetch data');
            }

            const data = response.data || [];

            // Create pagination structure
            return {
                data: data,
                pagination: {
                    page: options?.page || 1,
                    limit: options?.limit || data.length,
                    total: data.length,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false
                }
            };
        },
        ...cachePolicyUtils.createQueryOptions(entityType as any, queryOptions),
        ...queryOptions,
    });
}

// Generic detail query hook
export function useGenericDetailQuery<T>(
    entityType: string,
    id: string,
    service: any,
    queryOptions?: UseGenericQueryOptions<T, Error>
): UseQueryResult<T, Error> {
    const queryKeys = createQueryKeys<T>(entityType);
    const queryKey = queryKeys.detail(id);

    return useQuery({
        queryKey,
        queryFn: async () => {
            const response = await service.getById(id);

            // Check success before returning data
            if (!response.success || response.error) {
                throw new Error(response.error?.message || 'Failed to fetch data');
            }

            if (!response.data) {
                throw new Error('Data not found');
            }

            return response.data;
        },
        enabled: !!id, // Only run query if ID is provided
        ...cachePolicyUtils.createQueryOptions(entityType as any, queryOptions),
        ...queryOptions,
    });
}

// Generic search query hook
export function useGenericSearchQuery<T>(
    entityType: string,
    searchQuery: string,
    service: any,
    queryOptions?: UseGenericQueryOptions<PaginatedResponse<T>, Error>
): UseQueryResult<PaginatedResponse<T>, Error> {
    const queryKeys = createQueryKeys<T>(entityType);
    const queryKey = queryKeys.search(searchQuery);

    return useQuery({
        queryKey,
        queryFn: async () => {
            const response = await service.getAll({
                filters: { search: searchQuery }
            });

            // Transform ApiResponse<T[]> into PaginatedResponse<T>
            if (!response.success || response.error) {
                throw new Error(response.error?.message || 'Failed to fetch data');
            }

            const data = response.data || [];

            return {
                data: data,
                pagination: {
                    page: 1,
                    limit: data.length,
                    total: data.length,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false
                }
            };
        },
        enabled: !!searchQuery && searchQuery.length > 0, // Only run query if search query is provided
        ...cachePolicyUtils.createQueryOptions(entityType as any, queryOptions),
        ...queryOptions,
    });
}

// Advanced query hooks with more control

// Hook for infinite scrolling (paginated data)
export function useGenericInfiniteQuery<T>(
    entityType: string,
    service: any,
    baseOptions?: QueryOptions,
    queryOptions?: UseGenericQueryOptions<PaginatedResponse<T>, Error>
) {
    const queryKeys = createQueryKeys<T>(entityType);
    const baseQueryKey = queryKeys.lists;

    return useQuery({
        queryKey: [...baseQueryKey, 'infinite', baseOptions?.filters],
        queryFn: async () => {
            const response = await service.getAll(baseOptions);
            return response.data!;
        },
        ...cachePolicyUtils.createQueryOptions(entityType as any, queryOptions),
        ...queryOptions,
    });
}

// Hook for dependent queries (queries that depend on other data)
export function useGenericDependentQuery<T, TDep = any>(
    entityType: string,
    service: any,
    dependency: TDep | undefined,
    queryFn: (dependency: TDep) => Promise<any>,
    queryOptions?: UseGenericQueryOptions<any, Error>
) {
    const queryKeys = createQueryKeys<T>(entityType);
    const queryKey = [...queryKeys.all, 'dependent', dependency];

    return useQuery({
        queryKey,
        queryFn: () => queryFn(dependency!),
        enabled: dependency !== undefined,
        ...cachePolicyUtils.createQueryOptions(entityType as any, queryOptions),
        ...queryOptions,
    });
}

// Utility hooks for query state management

// Hook to get query state without fetching
export function useGenericQueryState<T>(
    queryKey: readonly unknown[]
): T | undefined {
    // This would typically use queryClient.getQueryData
    // For now, we'll return undefined as this is just a template
    return undefined;
}

// Hook to check if query is fetching
export function useGenericQueryIsFetching(
    entityType: string
): boolean {
    const queryKeys = createQueryKeys<any>(entityType);
    const baseQueryKey = queryKeys.all;

    // This would typically use queryClient.isFetching
    // For now, we'll return false as this is just a template
    return false;
}

// Hook to prefetch queries
export function useGenericPrefetch<T>(
    entityType: string,
    service: any,
    options?: QueryOptions
) {
    const queryKeys = createQueryKeys<T>(entityType);
    const queryKey = queryKeys.list(options?.filters);

    // This would typically use queryClient.prefetchQuery
    // For now, we'll just return the query key
    return { prefetchQueryKey: queryKey };
}

export default {
    useGenericListQuery,
    useGenericDetailQuery,
    useGenericSearchQuery,
    useGenericInfiniteQuery,
    useGenericDependentQuery,
    useGenericQueryState,
    useGenericQueryIsFetching,
    useGenericPrefetch,
};