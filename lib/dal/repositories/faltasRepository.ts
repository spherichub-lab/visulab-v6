/**
 * Faltas Repository
 * Repository for managing faltas data
 */

import { BaseRepository } from '../base/baseRepository';
import { Falta } from '../../types/database/entities.types';
import { TABLE_NAMES } from '../../types/database/entities.types';
import type { AuthUser } from '../../../src/types/api/api.types';
import { getFaltasVisibilityFilter } from '../../utils/visibility';

export class FaltasRepository extends BaseRepository<Falta> {
    constructor() {
        super({
            table: TABLE_NAMES.FALTAS,
            useCache: false, // Dynamic data, no caching
            defaultSelect: 'id, usuario_id, empresa_id, tipo_id, indice_id, tratamento_id, esf, cil, quantidade, created_at, updated_at'
        });
    }

    /**
     * Find by empresa
     */
    async findByEmpresa(empresaId: string, options: any = {}): Promise<Falta[]> {
        const result = await this.findWithFilters({
            empresa_id: empresaId,
            ...options
        });
        return result.data;
    }

    /**
     * Find by usuario
     */
    async findByUsuario(usuarioId: string, options: any = {}): Promise<Falta[]> {
        const result = await this.findWithFilters({
            usuario_id: usuarioId,
            ...options
        });
        return result.data;
    }

    /**
     * Find by tipo
     */
    async findByTipo(tipoId: string, options: any = {}): Promise<Falta[]> {
        const result = await this.findWithFilters({
            tipo_id: tipoId,
            ...options
        });
        return result.data;
    }

    /**
     * Find by indice
     */
    async findByIndice(indiceId: string, options: any = {}): Promise<Falta[]> {
        const result = await this.findWithFilters({
            indice_id: indiceId,
            ...options
        });
        return result.data;
    }

    /**
     * Find by tratamento
     */
    async findByTratamento(tratamentoId: string, options: any = {}): Promise<Falta[]> {
        const result = await this.findWithFilters({
            tratamento_id: tratamentoId,
            ...options
        });
        return result.data;
    }

    /**
     * Find by date range
     */
    async findByDateRange(
        empresaId: string,
        startDate: string,
        endDate: string,
        options: any = {}
    ): Promise<Falta[]> {
        const result = await this.findWithFilters({
            empresa_id: empresaId,
            created_at: { gte: startDate, lte: endDate },
            ...options
        });
        return result.data;
    }

    /**
     * Find by empresa and date range
     */
    async findByEmpresaAndDateRange(
        empresaId: string,
        startDate: string,
        endDate: string,
        options: any = {}
    ): Promise<Falta[]> {
        return this.findByDateRange(empresaId, startDate, endDate, options);
    }

    /**
     * Find by usuario and date range
     */
    async findByUsuarioAndDateRange(
        usuarioId: string,
        startDate: string,
        endDate: string,
        options: any = {}
    ): Promise<Falta[]> {
        const result = await this.findWithFilters({
            usuario_id: usuarioId,
            created_at: { gte: startDate, lte: endDate },
            ...options
        });
        return result.data;
    }

    /**
     * Get count by empresa
     */
    async getCountByEmpresa(empresaId: string): Promise<number> {
        return this.count({ empresa_id: empresaId });
    }

    /**
     * Get count by usuario
     */
    async getCountByUsuario(usuarioId: string): Promise<number> {
        return this.count({ usuario_id: usuarioId });
    }

    /**
     * Get count by tipo
     */
    async getCountByTipo(tipoId: string, empresaId?: string): Promise<number> {
        const filters: any = { tipo_id: tipoId };
        if (empresaId) {
            filters.empresa_id = empresaId;
        }
        return this.count(filters);
    }

    /**
     * Get count by indice
     */
    async getCountByIndice(indiceId: string, empresaId?: string): Promise<number> {
        const filters: any = { indice_id: indiceId };
        if (empresaId) {
            filters.empresa_id = empresaId;
        }
        return this.count(filters);
    }

    /**
     * Get summary statistics for empresa
     */
    async getSummaryByEmpresa(empresaId: string): Promise<{
        total: number;
        byTipo: Record<string, number>;
        byIndice: Record<string, number>;
        byTratamento: Record<string, number>;
    }> {
        const faltas = await this.findByEmpresa(empresaId);

        const byTipo: Record<string, number> = {};
        const byIndice: Record<string, number> = {};
        const byTratamento: Record<string, number> = {};

        faltas.forEach(falta => {
            // Count by tipo
            byTipo[falta.tipo_id] = (byTipo[falta.tipo_id] || 0) + 1;

            // Count by indice
            byIndice[falta.indice_id] = (byIndice[falta.indice_id] || 0) + 1;

            // Count by tratamiento (correct field name from database schema)
            if (falta.tratamiento_id) {
                byTratamento[falta.tratamiento_id] = (byTratamento[falta.tratamiento_id] || 0) + 1;
            }
        });

        return {
            total: faltas.length,
            byTipo,
            byIndice,
            byTratamento
        };
    }

    /**
     * Search faltas by multiple criteria
     */
    async search(criteria: {
        empresaId?: string;
        usuarioId?: string;
        tipoId?: string;
        indiceId?: string;
        tratamentoId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<Falta[]> {
        const filters: any = {};

        if (criteria.empresaId) filters.empresa_id = criteria.empresaId;
        if (criteria.usuarioId) filters.usuario_id = criteria.usuarioId;
        if (criteria.tipoId) filters.tipo_id = criteria.tipoId;
        if (criteria.indiceId) filters.indice_id = criteria.indiceId;
        if (criteria.tratamentoId) filters.tratamento_id = criteria.tratamentoId;

        if (criteria.startDate && criteria.endDate) {
            filters.created_at = { gte: criteria.startDate, lte: criteria.endDate };
        } else if (criteria.startDate) {
            filters.created_at = { gte: criteria.startDate };
        } else if (criteria.endDate) {
            filters.created_at = { lte: criteria.endDate };
        }

        const result = await this.findWithFilters(filters);
        return result.data;
    }

    /**
     * Get recent faltas for empresa
     */
    async getRecent(empresaId: string, limit: number = 10): Promise<Falta[]> {
        const result = await this.findAll({
            filters: { empresa_id: empresaId },
            sort: { column: 'created_at', direction: 'desc' },
            limit
        });
        return result.data;
    }

    /**
     * Find faltas based on user visibility rules
     * Admins see all faltas, regular users see only their company's faltas
     */
    async findByUserVisibility(user: AuthUser, options: any = {}): Promise<Falta[]> {
        const filter = getFaltasVisibilityFilter(user);

        if (filter) {
            // Regular user - filter by empresa_id
            return this.findByEmpresa(filter.empresa_id, options);
        } else {
            // Admin - return all
            const result = await this.findAll(options);
            return result.data;
        }
    }

    /**
     * Find faltas by user's company (for regular users)
     */
    async findByUserCompany(user: AuthUser, options: any = {}): Promise<Falta[]> {
        if (!user.empresa_id) {
            throw new Error('User has no empresa_id assigned');
        }

        return this.findByEmpresa(user.empresa_id, options);
    }
}