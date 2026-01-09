/**
 * Indices Repository
 * Repository for managing indices reference data with caching
 */

import { BaseRepository } from '../base/baseRepository';
import { Indice } from '../../types/database/entities.types';
import { TABLE_NAMES } from '../../types/database/entities.types';

export class IndicesRepository extends BaseRepository<Indice> {
    constructor() {
        super({
            table: TABLE_NAMES.INDICES,
            useCache: true,
            cacheKey: 'indices:all',
            cacheTtl: 1800, // 30 minutes
            defaultSelect: 'id, nome, created_at'
        });
    }

    /**
     * Find active indices only
     */
    async findActive(): Promise<Indice[]> {
        const result = await this.findAll();
        return result.data;
    }

    /**
     * Find by name
     */
    async findByName(nome: string): Promise<Indice | null> {
        try {
            const result = await this.findWithFilters({ nome: { ilike: nome } });
            return result.data.length > 0 ? result.data[0] : null;
        } catch (error) {
            return null;
        }
    }

}