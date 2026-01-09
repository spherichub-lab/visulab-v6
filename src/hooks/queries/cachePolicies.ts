/**
 * Central cache policy configuration for TanStack Query
 * Defines standard vs reference data caching strategies
 */

import { QueryOptions, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { EntityType } from './queryKeysFactory';

// Cache policy types
export type CachePolicyType = 'standard' | 'reference' | 'realtime';

// Cache policy configuration
export interface CachePolicy {
    staleTime: number;
    gcTime: number;
    refetchOnWindowFocus: boolean;
    refetchOnReconnect: boolean;
    refetchOnMount: boolean;
    retry: number | boolean;
    retryDelay?: number | ((attemptIndex: number) => number);
}

// Predefined cache policies
export const cachePolicies: Record<CachePolicyType, CachePolicy> = {
    // Standard data: changes frequently, user-generated content
    standard: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: false,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },

    // Reference data: changes rarely, lookup tables, configuration
    reference: {
        staleTime: 60 * 60 * 1000, // 1 hour
        gcTime: 24 * 60 * 60 * 1000, // 24 hours
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: false,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },

    // Realtime data: changes constantly, needs frequent updates
    realtime: {
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
        retry: 1,
        retryDelay: 1000,
    },
};

// Entity type to cache policy mapping
export const entityCachePolicyMap: Record<EntityType, CachePolicyType> = {
    // Standard data - changes frequently
    empresas: 'standard',
    usuarios: 'standard',
    faltas: 'standard',
    compras: 'standard',

    // Reference data - changes rarely
    indices: 'reference',
    tipos: 'reference',
    tratamientos: 'reference',
    tratamentos: 'reference',

    // Auth data - special handling
    auth: 'realtime',
};

// Mutation cache policies
export const mutationPolicies = {
    // Standard mutations
    standard: {
        retry: 1,
        retryDelay: 1000,
        throwOnError: false,
    } as UseMutationOptions,

    // Critical mutations (should retry more)
    critical: {
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        throwOnError: false,
    } as UseMutationOptions,
};

// Cache policy utilities
export const cachePolicyUtils = {
    /**
     * Get cache policy for entity type
     */
    getPolicy: (entityType: EntityType): CachePolicy => {
        const policyType = entityCachePolicyMap[entityType] || 'standard';
        return cachePolicies[policyType];
    },

    /**
     * Create query options with cache policy
     */
    createQueryOptions: <TData = unknown, TError = Error>(
        entityType: EntityType,
        options?: Partial<UseQueryOptions<TData, TError>>
    ): UseQueryOptions<TData, TError> => {
        const policy = cachePolicyUtils.getPolicy(entityType);
        return {
            queryKey: ['temp'], // This will be overridden by the actual hook
            staleTime: policy.staleTime,
            gcTime: policy.gcTime,
            refetchOnWindowFocus: policy.refetchOnWindowFocus,
            refetchOnReconnect: policy.refetchOnReconnect,
            refetchOnMount: policy.refetchOnMount,
            retry: policy.retry,
            retryDelay: policy.retryDelay,
            ...options,
        } as UseQueryOptions<TData, TError>;
    },

    /**
     * Create mutation options with cache policy
     */
    createMutationOptions: <TData = unknown, TError = Error, TVariables = void>(
        policyType: keyof typeof mutationPolicies = 'standard',
        options?: Partial<UseMutationOptions<TData, TError, TVariables>>
    ): UseMutationOptions<TData, TError, TVariables> => {
        const policy = mutationPolicies[policyType];
        return {
            ...policy,
            throwOnError: false,
            ...options,
        } as UseMutationOptions<TData, TError, TVariables>;
    },

    /**
     * Check if entity type is reference data
     */
    isReferenceData: (entityType: EntityType): boolean => {
        return entityCachePolicyMap[entityType] === 'reference';
    },

    /**
     * Check if entity type is realtime data
     */
    isRealtimeData: (entityType: EntityType): boolean => {
        return entityCachePolicyMap[entityType] === 'realtime';
    },

    /**
     * Check if entity type is standard data
     */
    isStandardData: (entityType: EntityType): boolean => {
        return entityCachePolicyMap[entityType] === 'standard';
    },
};

export default cachePolicies;