/**
 * Tipos Repository
 * Repository for managing tipos reference data with caching
 */

import { BaseRepository } from '../base/baseRepository';
import { Tipo } from '../../types/database/entities.types';
import { TABLE_NAMES } from '../../types/database/entities.types';
import { REFERENCE_CACHE_KEYS } from '../../utils/cache';

export class TiposRepository extends BaseRepository<Tipo> {
    constructor() {
        super({
            table: TABLE_NAMES.TIPOS,
            useCache: true,
            cacheKey: REFERENCE_CACHE_KEYS.TIPOS_ALL,
            cacheTtl: 1800, // 30 minutes
            defaultSelect: 'id, nome, created_at, updated_at'
        });
    }

    /**
     * Find by name
     */
    async findByName(nome: string): Promise<Tipo | null> {
        try {
            const result = await this.findWithFilters({ nome: { ilike: nome } });
            return result.data.length > 0 ? result.data[0] : null;
        } catch (error) {
            return null;
        }
    }
}