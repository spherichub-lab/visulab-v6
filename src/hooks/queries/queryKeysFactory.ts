/**
 * Type-safe Query Key Factory for TanStack Query
 * Provides hierarchical, type-safe query keys for consistent caching
 */

// Base entity type for query keys
export type EntityType = string;

// Generic query key structure
export interface QueryKeyStructure {
    all: readonly [EntityType];
    lists: readonly [EntityType, 'list'];
    list: (filters?: Record<string, any>) => readonly [EntityType, 'list', Record<string, any>?];
    details: readonly [EntityType, 'detail'];
    detail: (id: string) => readonly [EntityType, 'detail', string];
    search: (query: string) => readonly [EntityType, 'search', string];
}

// Query key factory function
export function createQueryKeys<T>(entityType: EntityType): QueryKeyStructure {
    return {
        all: [entityType] as const,
        lists: [entityType, 'list'] as const,
        list: (filters?: Record<string, any>) => [entityType, 'list', filters] as const,
        details: [entityType, 'detail'] as const,
        detail: (id: string) => [entityType, 'detail', id] as const,
        search: (query: string) => [entityType, 'search', query] as const,
    };
}

// Predefined query keys for common entities
export const queryKeys = {
    // Auth queries
    auth: {
        all: ['auth'] as const,
        user: () => ['auth', 'user'] as const,
        session: () => ['auth', 'session'] as const,
    },

    // Empresa queries
    empresas: createQueryKeys<any>('empresas'),

    // Usuario queries
    usuarios: createQueryKeys<any>('usuarios'),

    // Falta queries
    faltas: createQueryKeys<any>('faltas'),

    // Compra queries
    compras: createQueryKeys<any>('compras'),

    // Reference data queries (indices, tipos, tratamentos)
    indices: createQueryKeys<any>('indices'),
    tipos: createQueryKeys<any>('tipos'),
    tratamientos: createQueryKeys<any>('tratamientos'),
    tratamentos: createQueryKeys<any>('tratamentos'),
};

// Type guards for query keys
export function isListQueryKey(queryKey: readonly unknown[]): boolean {
    return queryKey.length >= 2 && queryKey[1] === 'list';
}

export function isDetailQueryKey(queryKey: readonly unknown[]): boolean {
    return queryKey.length >= 2 && queryKey[1] === 'detail';
}

export function isSearchQueryKey(queryKey: readonly unknown[]): boolean {
    return queryKey.length >= 2 && queryKey[2] === 'search';
}

// Utility functions for query key manipulation
export const queryKeyUtils = {
    /**
     * Extract entity type from query key
     */
    getEntityType: (queryKey: readonly unknown[]): EntityType | null => {
        return queryKey.length > 0 ? (queryKey[0] as EntityType) : null;
    },

    /**
     * Extract ID from detail query key
     */
    getDetailId: (queryKey: readonly unknown[]): string | null => {
        return isDetailQueryKey(queryKey) && queryKey.length >= 3 ? (queryKey[2] as string) : null;
    },

    /**
     * Extract filters from list query key
     */
    getListFilters: (queryKey: readonly unknown[]): Record<string, any> | null => {
        return isListQueryKey(queryKey) && queryKey.length >= 3 ? (queryKey[2] as Record<string, any>) : null;
    },

    /**
     * Extract search query from search query key
     */
    getSearchQuery: (queryKey: readonly unknown[]): string | null => {
        return isSearchQueryKey(queryKey) && queryKey.length >= 3 ? (queryKey[2] as string) : null;
    },

    /**
     * Create a base query key for invalidation
     */
    getBaseKey: (entityType: EntityType): readonly [EntityType] => {
        return [entityType] as const;
    },
};

export default queryKeys;