/**
 * Empresas Repository
 * Repository for managing empresas data
 */

import { BaseRepository } from '../base/baseRepository';
import { Empresa } from '../../types/database/entities.types';
import { TABLE_NAMES } from '../../types/database/entities.types';

export class EmpresasRepository extends BaseRepository<Empresa> {
    constructor() {
        super({
            table: TABLE_NAMES.EMPRESAS,
            useCache: false, // Dynamic data, no caching
            enableSoftDelete: true,
            defaultSelect: 'id, nome, tipo, contato_nome, contato_email, status, deleted_at, created_at, updated_at'
        });
    }

    /**
     * Find active empresas only
     */
    async findActive(): Promise<Empresa[]> {
        const result = await this.findWithFilters({
            status: 'Ativa',
            deleted_at: { is: null }
        });
        return result.data;
    }

    /**
     * Find by name
     */
    async findByName(nome: string): Promise<Empresa | null> {
        try {
            const result = await this.findWithFilters({
                nome: { ilike: nome },
                deleted_at: { is: null }
            });
            return result.data.length > 0 ? result.data[0] : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Find by type
     */
    async findByType(tipo: string): Promise<Empresa[]> {
        const result = await this.findWithFilters({
            tipo,
            deleted_at: { is: null }
        });
        return result.data;
    }

    /**
     * Find by contact email
     */
    async findByContactEmail(email: string): Promise<Empresa | null> {
        try {
            const result = await this.findWithFilters({
                contato_email: email,
                deleted_at: { is: null }
            });
            return result.data.length > 0 ? result.data[0] : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Update status
     */
    async updateStatus(id: string, status: string): Promise<Empresa> {
        return this.update(id, { status });
    }

    /**
     * Search empresas by name or contact
     */
    async search(term: string): Promise<Empresa[]> {
        const result = await this.findWithFilters({
            or: {
                nome: { ilike: `%${term}%` },
                contato_nome: { ilike: `%${term}%` },
                contato_email: { ilike: `%${term}%` }
            },
            deleted_at: { is: null }
        });
        return result.data;
    }

    /**
     * Get count by status
     */
    async getCountByStatus(): Promise<Record<string, number>> {
        const ativaCount = await this.count({ status: 'Ativa', deleted_at: { is: null } });
        const inativaCount = await this.count({ status: 'Inativa', deleted_at: { is: null } });

        return {
            Ativa: ativaCount,
            Inativa: inativaCount
        };
    }
}