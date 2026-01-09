/**
 * Service Interfaces
 * Standardized contracts for all services in the application
 */

import { ApiResponse, QueryOptions } from '../../../lib/types/api/api.types';

/**
 * Base service interface
 * All services must implement this interface
 */
export interface IService {
    readonly metadata: ServiceMetadata;
    healthCheck(): Promise<ServiceHealth>;
    initialize(): Promise<void>;
    dispose(): Promise<void>;
}

/**
 * Supabase service interface
 * Extends base service with CRUD operations
 */
export interface ISupabaseService<T> extends IService {
    // CRUD Operations
    getAll(options?: QueryOptions): Promise<ApiResponse<T[]>>;
    getById(id: string): Promise<ApiResponse<T>>;
    create(data: any): Promise<ApiResponse<T>>;
    update(id: string, data: any): Promise<ApiResponse<T>>;
    delete(id: string): Promise<ApiResponse<void>>;

    // Make metadata public for interface compatibility
    readonly metadata: ServiceMetadata;

    // Query Operations
    findWithFilters(filters: Record<string, any>, options?: QueryOptions): Promise<ApiResponse<T[]>>;
    search(term: string, options?: QueryOptions): Promise<ApiResponse<T[]>>;
    count(filters?: Record<string, any>): Promise<number>;

    // Bulk Operations
    bulkCreate(data: any[]): Promise<ApiResponse<T[]>>;
    bulkUpdate(updates: Array<{ id: string; data: any }>): Promise<ApiResponse<T[]>>;
    bulkDelete(ids: string[]): Promise<ApiResponse<void>>;

    // Soft Delete (if applicable)
    softDelete(id: string): Promise<ApiResponse<T>>;
}

/**
 * Service metadata
 * Provides information about service capabilities and configuration
 */
export interface ServiceMetadata {
    name: string;
    version: string;
    entity: string;
    tableName: string;
    capabilities: ServiceCapabilities;
    dependencies: string[];
}

/**
 * Service capabilities
 * Defines what operations the service supports
 */
export interface ServiceCapabilities {
    crud: boolean;
    search: boolean;
    bulk: boolean;
    softDelete: boolean;
    relations: string[];
}

/**
 * Service health status
 */
export interface ServiceHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: string;
    latency?: number;
    errors?: string[];
}

/**
 * Query options for Supabase operations
 * Extends base QueryOptions with Supabase-specific options
 */
export interface SupabaseQueryOptions extends QueryOptions {
    columns?: string;
    count?: 'exact' | 'planned' | 'estimated';
    head?: boolean;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    jitterFactor: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    jitterFactor: 0.1
};
