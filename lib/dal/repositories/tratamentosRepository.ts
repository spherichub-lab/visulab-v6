/**
 * Tratamentos Repository
 * Repository for managing tratamentos reference data with caching
 */

import { BaseRepository } from '../base/baseRepository';
import { Tratamento } from '../../types/database/entities.types';
import { TABLE_NAMES } from '../../types/database/entities.types';
import { REFERENCE_CACHE_KEYS } from '../../utils/cache';

export class TratamentosRepository extends BaseRepository<Tratamento> {
    constructor() {
        super({
            table: TABLE_NAMES.TRATAMENTOS,
            useCache: true,
            cacheKey: REFERENCE_CACHE_KEYS.TRATAMENTOS_ALL,
            cacheTtl: 1800, // 30 minutes
            defaultSelect: 'id, nome, created_at, updated_at'
        });
    }

    /**
     * Find by name
     */
    async findByName(nome: string): Promise<Tratamento | null> {
        try {
            const result = await this.findWithFilters({ nome: { ilike: nome } });
            return result.data.length > 0 ? result.data[0] : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Find by partial name (search)
     */
    async searchByName(term: string): Promise<Tratamento[]> {
        const result = await this.findWithFilters({
            nome: { ilike: `%${term}%` }
        });
        return result.data;
    }
}