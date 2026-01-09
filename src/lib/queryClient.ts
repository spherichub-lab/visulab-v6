/**
 * QueryClient configuration for TanStack Query
 * Provides centralized configuration for caching, retries, and error handling
 */

import { QueryClient, QueryClientConfig } from '@tanstack/react-query';
import { ApiError, ErrorCode } from '../types/api/api.types';
import { cachePolicies } from '../hooks/queries/cachePolicies';

// Default query configuration using cache policies
export const defaultQueryConfig: QueryClientConfig = {
    defaultOptions: {
        queries: {
            // Use standard cache policy as default
            ...cachePolicies.standard,

            // Retry configuration with error handling
            retry: (failureCount, error: Error) => {
                // Check if it's an ApiError with our custom structure
                const apiError = error as any;

                // Don't retry on authentication errors
                if (apiError?.code === ErrorCode.AUTHENTICATION_ERROR) {
                    return false;
                }

                // Don't retry on validation errors
                if (apiError?.code === ErrorCode.VALIDATION_ERROR) {
                    return false;
                }

                // Don't retry on not found errors
                if (apiError?.code === ErrorCode.NOT_FOUND_ERROR) {
                    return false;
                }

                // Don't retry on network errors
                if (apiError?.code === ErrorCode.NETWORK_ERROR) {
                    return failureCount < 2; // Retry network errors once
                }

                // Retry up to 3 times for other errors
                return failureCount < 3;
            },

            // Error retry behavior
            throwOnError: false,

            // Network mode
            networkMode: 'online',
        },
        mutations: {
            // Use standard mutation policy as default
            retry: 1,
            retryDelay: 1000,
            networkMode: 'online',
            throwOnError: false,
        },
    },
};

// Create and export the query client instance
export const queryClient = new QueryClient(defaultQueryConfig);

/**
 * Create a new query client with custom configuration
 */
export const createQueryClient = (config?: Partial<QueryClientConfig>): QueryClient => {
    const mergedConfig = {
        ...defaultQueryConfig,
        ...config,
        defaultOptions: {
            ...defaultQueryConfig.defaultOptions,
            ...config?.defaultOptions,
            queries: {
                ...defaultQueryConfig.defaultOptions?.queries,
                ...config?.defaultOptions?.queries,
            },
            mutations: {
                ...defaultQueryConfig.defaultOptions?.mutations,
                ...config?.defaultOptions?.mutations,
            },
        },
    };

    return new QueryClient(mergedConfig);
};

/**
 * Query key factory for consistent cache keys
 */
export const queryKeys = {
    // Auth queries
    auth: {
        all: ['auth'] as const,
        user: () => [...queryKeys.auth.all, 'user'] as const,
        session: () => [...queryKeys.auth.all, 'session'] as const,
    },

    // Empresa queries
    empresas: {
        all: ['empresas'] as const,
        lists: () => [...queryKeys.empresas.all, 'list'] as const,
        list: (filters?: any) => [...queryKeys.empresas.lists(), filters] as const,
        details: () => [...queryKeys.empresas.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.empresas.details(), id] as const,
        search: (query: string) => [...queryKeys.empresas.all, 'search', query] as const,
    },

    // Usuario queries
    usuarios: {
        all: ['usuarios'] as const,
        lists: () => [...queryKeys.usuarios.all, 'list'] as const,
        list: (filters?: any) => [...queryKeys.usuarios.lists(), filters] as const,
        details: () => [...queryKeys.usuarios.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.usuarios.details(), id] as const,
        search: (query: string) => [...queryKeys.usuarios.all, 'search', query] as const,
    },

    // Falta queries
    faltas: {
        all: ['faltas'] as const,
        lists: () => [...queryKeys.faltas.all, 'list'] as const,
        list: (filters?: any) => [...queryKeys.faltas.lists(), filters] as const,
        details: () => [...queryKeys.faltas.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.faltas.details(), id] as const,
        search: (query: string) => [...queryKeys.faltas.all, 'search', query] as const,
    },

    // Compra queries
    compras: {
        all: ['compras'] as const,
        lists: () => [...queryKeys.compras.all, 'list'] as const,
        list: (filters?: any) => [...queryKeys.compras.lists(), filters] as const,
        details: () => [...queryKeys.compras.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.compras.details(), id] as const,
        search: (query: string) => [...queryKeys.compras.all, 'search', query] as const,
    },

    // Reference data queries (indices, tipos, tratamentos)
    indices: {
        all: ['indices'] as const,
        lists: () => [...queryKeys.indices.all, 'list'] as const,
        list: (filters?: any) => [...queryKeys.indices.lists(), filters] as const,
        details: () => [...queryKeys.indices.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.indices.details(), id] as const,
    },

    tipos: {
        all: ['tipos'] as const,
        lists: () => [...queryKeys.tipos.all, 'list'] as const,
        list: (filters?: any) => [...queryKeys.tipos.lists(), filters] as const,
        details: () => [...queryKeys.tipos.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.tipos.details(), id] as const,
    },

    tratamentos: {
        all: ['tratamentos'] as const,
        lists: () => [...queryKeys.tratamentos.all, 'list'] as const,
        list: (filters?: any) => [...queryKeys.tratamentos.lists(), filters] as const,
        details: () => [...queryKeys.tratamentos.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.tratamentos.details(), id] as const,
    },
};

/**
 * Utility functions for cache management
 */
export const cacheUtils = {
    /**
     * Invalidate all queries
     */
    invalidateAll: () => {
        queryClient.invalidateQueries();
    },

    /**
     * Invalidate queries by key pattern
     */
    invalidateByPattern: (pattern: string[]) => {
        queryClient.invalidateQueries({ queryKey: pattern });
    },

    /**
     * Clear all queries from cache
     */
    clearAll: () => {
        queryClient.clear();
    },

    /**
     * Prefetch a query
     */
    prefetch: async <T>(
        queryKey: readonly unknown[],
        queryFn: () => Promise<T>,
        options?: any
    ) => {
        return queryClient.prefetchQuery({
            queryKey,
            queryFn,
            ...options,
        });
    },

    /**
     * Set query data directly
     */
    setData: <T>(queryKey: readonly unknown[], data: T) => {
        queryClient.setQueryData(queryKey, data);
    },

    /**
     * Get query data from cache
     */
    getData: <T>(queryKey: readonly unknown[]): T | undefined => {
        return queryClient.getQueryData<T>(queryKey);
    },
};

export default queryClient;