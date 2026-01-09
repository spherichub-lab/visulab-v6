/**
 * Simple Cache Manager for Reference Data
 * Basic in-memory caching implementation limited to reference/static data only
 */

import { Logger } from '../logger/logger';
import { CacheError } from '../errors/applicationErrors';

export interface CacheEntry<T = any> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in seconds
    key: string;
}

export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    size: number;
    hitRate: number;
}

export interface CacheConfig {
    defaultTtl: number; // Default TTL in seconds
    maxSize: number; // Maximum number of entries
    cleanupInterval: number; // Cleanup interval in seconds
    enableStats: boolean;
}

export class SimpleCacheManager {
    private cache: Map<string, CacheEntry>;
    private config: CacheConfig;
    private logger: Logger;
    private stats: CacheStats;
    private cleanupTimer?: any;

    constructor(config?: Partial<CacheConfig>) {
        this.cache = new Map();
        this.config = {
            defaultTtl: 1800, // 30 minutes
            maxSize: 1000,
            cleanupInterval: 300, // 5 minutes
            enableStats: true,
            ...config
        };
        this.logger = new Logger('SimpleCacheManager');
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            size: 0,
            hitRate: 0
        };

        // Start cleanup timer
        this.startCleanupTimer();
    }

    /**
     * Get value from cache
     */
    public get<T = any>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.updateStats('miss');
            this.logger.debug('Cache miss', { key });
            return null;
        }

        // Check if entry has expired
        if (this.isExpired(entry)) {
            this.cache.delete(key);
            this.updateStats('miss');
            this.logger.debug('Cache miss (expired)', { key, age: this.getAge(entry) });
            return null;
        }

        this.updateStats('hit');
        this.logger.debug('Cache hit', { key, age: this.getAge(entry) });
        return entry.data as T;
    }

    /**
     * Set value in cache
     */
    public set<T = any>(key: string, data: T, ttl?: number): void {
        // Check if we've exceeded max size
        if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
            this.evictOldest();
        }

        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.config.defaultTtl,
            key
        };

        this.cache.set(key, entry);
        this.updateStats('set');
        this.logger.debug('Cache set', { key, ttl: entry.ttl });
    }

    /**
     * Delete value from cache
     */
    public delete(key: string): boolean {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.updateStats('delete');
            this.logger.debug('Cache delete', { key });
        }
        return deleted;
    }

    /**
     * Check if key exists in cache and is not expired
     */
    public has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) {
            return false;
        }

        if (this.isExpired(entry)) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Clear all cache entries
     */
    public clear(): void {
        const size = this.cache.size;
        this.cache.clear();
        this.logger.info('Cache cleared', { previousSize: size });
    }

    /**
     * Get cache statistics
     */
    public getStats(): CacheStats {
        this.stats.size = this.cache.size;
        this.stats.hitRate = this.stats.hits + this.stats.misses > 0
            ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
            : 0;

        return { ...this.stats };
    }

    /**
     * Reset cache statistics
     */
    public resetStats(): void {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            size: this.cache.size,
            hitRate: 0
        };
        this.logger.info('Cache stats reset');
    }

    /**
     * Get all cache keys
     */
    public getKeys(): string[] {
        return Array.from(this.cache.keys());
    }

    /**
     * Get cache size
     */
    public size(): number {
        return this.cache.size;
    }

    /**
     * Check if cache is empty
     */
    public isEmpty(): boolean {
        return this.cache.size === 0;
    }

    /**
     * Clean up expired entries
     */
    public cleanup(): number {
        const initialSize = this.cache.size;
        const now = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (this.isExpired(entry)) {
                this.cache.delete(key);
            }
        }

        const cleanedCount = initialSize - this.cache.size;
        if (cleanedCount > 0) {
            this.logger.debug('Cache cleanup completed', {
                cleanedCount,
                remainingSize: this.cache.size
            });
        }

        return cleanedCount;
    }

    /**
     * Get or set value using a factory function
     */
    public async getOrSet<T = any>(
        key: string,
        factory: () => Promise<T>,
        ttl?: number
    ): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        try {
            const data = await factory();
            this.set(key, data, ttl);
            return data;
        } catch (error) {
            this.logger.error('Failed to get or set cache value', {
                key,
                error
            });
            throw new CacheError(`Failed to get or set cache value for key: ${key}`, 'CACHE_GET_OR_SET_ERROR', {
                key,
                originalError: error
            });
        }
    }

    /**
     * Invalidate cache entries by pattern
     */
    public invalidatePattern(pattern: string): number {
        const regex = new RegExp(pattern);
        const keysToDelete: string[] = [];

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.delete(key));

        this.logger.info('Cache pattern invalidation completed', {
            pattern,
            deletedCount: keysToDelete.length
        });

        return keysToDelete.length;
    }

    /**
     * Get cache entry information
     */
    public getEntryInfo(key: string): Omit<CacheEntry, 'data'> | null {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }

        return {
            key: entry.key,
            timestamp: entry.timestamp,
            ttl: entry.ttl
        };
    }

    /**
     * Destroy cache manager and cleanup resources
     */
    public destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        this.clear();
        this.logger.info('Cache manager destroyed');
    }

    /**
     * Check if cache entry has expired
     */
    private isExpired(entry: CacheEntry): boolean {
        const now = Date.now();
        const age = (now - entry.timestamp) / 1000; // Convert to seconds
        return age >= entry.ttl;
    }

    /**
     * Get age of cache entry in seconds
     */
    private getAge(entry: CacheEntry): number {
        const now = Date.now();
        return (now - entry.timestamp) / 1000;
    }

    /**
     * Evict oldest entry when cache is full
     */
    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTimestamp = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTimestamp) {
                oldestTimestamp = entry.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.logger.debug('Evicted oldest cache entry', { key: oldestKey });
        }
    }

    /**
     * Update cache statistics
     */
    private updateStats(type: 'hit' | 'miss' | 'set' | 'delete'): void {
        if (!this.config.enableStats) {
            return;
        }

        switch (type) {
            case 'hit':
                this.stats.hits++;
                break;
            case 'miss':
                this.stats.misses++;
                break;
            case 'set':
                this.stats.sets++;
                break;
            case 'delete':
                this.stats.deletes++;
                break;
        }
    }

    /**
     * Start cleanup timer
     */
    private startCleanupTimer(): void {
        if (this.config.cleanupInterval > 0) {
            this.cleanupTimer = setInterval(() => {
                this.cleanup();
            }, this.config.cleanupInterval * 1000);

            this.logger.debug('Cleanup timer started', {
                interval: this.config.cleanupInterval
            });
        }
    }
}

/**
 * Global cache instance for reference data
 */
export const referenceCache = new SimpleCacheManager({
    defaultTtl: 1800, // 30 minutes
    maxSize: 500,
    cleanupInterval: 300, // 5 minutes
    enableStats: true
});

/**
 * Cache keys for reference data
 */
export const REFERENCE_CACHE_KEYS = {
    INDICES_ALL: 'indices:all',
    TIPOS_ALL: 'tipos:all',
    TRATAMENTOS_ALL: 'tratamentos:all'
} as const;