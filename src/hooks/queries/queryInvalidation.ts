/**
 * Centralized query invalidation helpers for TanStack Query
 * Provides utilities for cache invalidation and management
 */

import { QueryClient } from '@tanstack/react-query';
import { createQueryKeys, queryKeyUtils } from './queryKeysFactory';
import { EntityType } from './queryKeysFactory';

// Invalidation strategies
export type InvalidationStrategy = 'all' | 'entity' | 'related' | 'custom';

// Invalidation configuration
export interface InvalidationConfig {
    strategy: InvalidationStrategy;
    entityType?: EntityType;
    entityId?: string;
    customKeys?: readonly unknown[][];
    refetch?: boolean;
}

// Query invalidation utilities
export const queryInvalidation = {
    /**
     * Invalidate all queries
     */
    invalidateAll: (queryClient: QueryClient): Promise<void> => {
        return queryClient.invalidateQueries();
    },

    /**
     * Invalidate queries for a specific entity type
     */
    invalidateEntity: (
        queryClient: QueryClient,
        entityType: EntityType,
        refetch: boolean = true
    ): Promise<void> => {
        const queryKeys = createQueryKeys<any>(entityType);
        return queryClient.invalidateQueries({
            queryKey: queryKeys.all,
            refetchType: refetch ? 'active' : 'none',
        });
    },

    /**
     * Invalidate entity detail queries
     */
    invalidateEntityDetail: (
        queryClient: QueryClient,
        entityType: EntityType,
        entityId: string,
        refetch: boolean = true
    ): Promise<void> => {
        const queryKeys = createQueryKeys<any>(entityType);
        return queryClient.invalidateQueries({
            queryKey: queryKeys.detail(entityId),
            refetchType: refetch ? 'active' : 'none',
        });
    },

    /**
     * Invalidate entity list queries
     */
    invalidateEntityList: (
        queryClient: QueryClient,
        entityType: EntityType,
        refetch: boolean = true
    ): Promise<void> => {
        const queryKeys = createQueryKeys<any>(entityType);
        return queryClient.invalidateQueries({
            queryKey: queryKeys.lists,
            refetchType: refetch ? 'active' : 'none',
        });
    },

    /**
     * Invalidate related entities (useful for entities with foreign key relationships)
     */
    invalidateRelatedEntities: (
        queryClient: QueryClient,
        entityType: EntityType,
        relatedEntityTypes: EntityType[],
        refetch: boolean = true
    ): Promise<void[]> => {
        const promises = relatedEntityTypes.map(relatedType =>
            queryInvalidation.invalidateEntity(queryClient, relatedType, refetch)
        );

        return Promise.all(promises);
    },

    /**
     * Invalidate custom query keys
     */
    invalidateCustom: (
        queryClient: QueryClient,
        keys: readonly unknown[][],
        refetch: boolean = true
    ): Promise<void[]> => {
        const promises = keys.map(key =>
            queryClient.invalidateQueries({
                queryKey: key,
                refetchType: refetch ? 'active' : 'none',
            })
        );

        return Promise.all(promises);
    },

    /**
     * Generic invalidation method with strategy
     */
    invalidate: (
        queryClient: QueryClient,
        config: InvalidationConfig
    ): Promise<void | void[]> => {
        switch (config.strategy) {
            case 'all':
                return queryInvalidation.invalidateAll(queryClient);

            case 'entity':
                if (!config.entityType) {
                    throw new Error('Entity type is required for entity invalidation');
                }
                return queryInvalidation.invalidateEntity(
                    queryClient,
                    config.entityType,
                    config.refetch
                );

            case 'related':
                if (!config.entityType) {
                    throw new Error('Entity type is required for related invalidation');
                }
                // Define related entities based on entity type
                const relatedEntities = queryInvalidation.getRelatedEntities(config.entityType);
                return queryInvalidation.invalidateRelatedEntities(
                    queryClient,
                    config.entityType,
                    relatedEntities,
                    config.refetch
                );

            case 'custom':
                if (!config.customKeys) {
                    throw new Error('Custom keys are required for custom invalidation');
                }
                return queryInvalidation.invalidateCustom(
                    queryClient,
                    config.customKeys,
                    config.refetch
                );

            default:
                throw new Error(`Unknown invalidation strategy: ${config.strategy}`);
        }
    },

    /**
     * Get related entities for a given entity type
     */
    getRelatedEntities: (entityType: EntityType): EntityType[] => {
        const relationshipMap: Record<EntityType, EntityType[]> = {
            empresas: ['usuarios'], // Companies have users
            usuarios: ['empresas'], // Users belong to companies
            faltas: ['usuarios', 'empresas'], // Shortages are related to users and companies
            compras: ['usuarios', 'empresas', 'faltas'], // Purchases are related to users, companies, and shortages
            indices: [], // Indices are reference data
            tipos: [], // Types are reference data
            tratamientos: [], // Treatments are reference data (legacy name)
            tratamentos: [], // Treatments are reference data
        };

        return relationshipMap[entityType] || [];
    },

    /**
     * Prefetch queries for better UX
     */
    prefetchEntityList: async <T>(
        queryClient: QueryClient,
        entityType: EntityType,
        queryFn: () => Promise<T>,
        options?: any
    ): Promise<void> => {
        const queryKeys = createQueryKeys<any>(entityType);
        await queryClient.prefetchQuery({
            queryKey: queryKeys.lists,
            queryFn,
            ...options,
        });
    },

    /**
     * Prefetch entity detail
     */
    prefetchEntityDetail: async <T>(
        queryClient: QueryClient,
        entityType: EntityType,
        entityId: string,
        queryFn: () => Promise<T>,
        options?: any
    ): Promise<void> => {
        const queryKeys = createQueryKeys<any>(entityType);
        await queryClient.prefetchQuery({
            queryKey: queryKeys.detail(entityId),
            queryFn,
            ...options,
        });
    },

    /**
     * Set query data directly (useful for optimistic updates)
     */
    setEntityData: <T>(
        queryClient: QueryClient,
        entityType: EntityType,
        data: T,
        entityId?: string
    ): void => {
        const queryKeys = createQueryKeys<any>(entityType);

        if (entityId) {
            queryClient.setQueryData(queryKeys.detail(entityId), data);
        } else {
            // This would typically be used for list data
            queryClient.setQueryData(queryKeys.lists, data);
        }
    },

    /**
     * Cancel ongoing queries
     */
    cancelEntityQueries: (
        queryClient: QueryClient,
        entityType: EntityType
    ): Promise<void> => {
        const queryKeys = createQueryKeys<any>(entityType);
        return queryClient.cancelQueries({
            queryKey: queryKeys.all,
        });
    },

    /**
     * Remove queries from cache
     */
    removeEntityQueries: (
        queryClient: QueryClient,
        entityType: EntityType
    ): void => {
        const queryKeys = createQueryKeys<any>(entityType);
        queryClient.removeQueries({
            queryKey: queryKeys.all,
        });
    },

    /**
     * Reset queries to initial state
     */
    resetEntityQueries: (
        queryClient: QueryClient,
        entityType: EntityType
    ): void => {
        const queryKeys = createQueryKeys<any>(entityType);
        queryClient.resetQueries({
            queryKey: queryKeys.all,
        });
    },
};

// Hook-based invalidation utilities
export const useQueryInvalidation = () => {
    // This would typically use the useQueryClient hook
    // For now, we'll return the utilities that need a queryClient
    return {
        invalidateAll: (queryClient: QueryClient) =>
            queryInvalidation.invalidateAll(queryClient),
        invalidateEntity: (queryClient: QueryClient, entityType: EntityType, refetch?: boolean) =>
            queryInvalidation.invalidateEntity(queryClient, entityType, refetch),
        invalidateEntityDetail: (queryClient: QueryClient, entityType: EntityType, entityId: string, refetch?: boolean) =>
            queryInvalidation.invalidateEntityDetail(queryClient, entityType, entityId, refetch),
        invalidateEntityList: (queryClient: QueryClient, entityType: EntityType, refetch?: boolean) =>
            queryInvalidation.invalidateEntityList(queryClient, entityType, refetch),
        invalidateRelatedEntities: (queryClient: QueryClient, entityType: EntityType, relatedEntityTypes: EntityType[], refetch?: boolean) =>
            queryInvalidation.invalidateRelatedEntities(queryClient, entityType, relatedEntityTypes, refetch),
        invalidateCustom: (queryClient: QueryClient, keys: readonly unknown[][], refetch?: boolean) =>
            queryInvalidation.invalidateCustom(queryClient, keys, refetch),
        invalidate: (queryClient: QueryClient, config: InvalidationConfig) =>
            queryInvalidation.invalidate(queryClient, config),
        getRelatedEntities: (entityType: EntityType) =>
            queryInvalidation.getRelatedEntities(entityType),
        prefetchEntityList: <T>(queryClient: QueryClient, entityType: EntityType, queryFn: () => Promise<T>, options?: any) =>
            queryInvalidation.prefetchEntityList(queryClient, entityType, queryFn, options),
        prefetchEntityDetail: <T>(queryClient: QueryClient, entityType: EntityType, entityId: string, queryFn: () => Promise<T>, options?: any) =>
            queryInvalidation.prefetchEntityDetail(queryClient, entityType, entityId, queryFn, options),
        setEntityData: <T>(queryClient: QueryClient, entityType: EntityType, data: T, entityId?: string) =>
            queryInvalidation.setEntityData(queryClient, entityType, data, entityId),
        cancelEntityQueries: (queryClient: QueryClient, entityType: EntityType) =>
            queryInvalidation.cancelEntityQueries(queryClient, entityType),
        removeEntityQueries: (queryClient: QueryClient, entityType: EntityType) =>
            queryInvalidation.removeEntityQueries(queryClient, entityType),
        resetEntityQueries: (queryClient: QueryClient, entityType: EntityType) =>
            queryInvalidation.resetEntityQueries(queryClient, entityType),
    };
};

export default queryInvalidation;