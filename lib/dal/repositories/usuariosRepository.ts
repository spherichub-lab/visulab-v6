/**
 * Usuarios Repository
 * Repository for managing usuarios data
 */

import { BaseRepository } from '../base/baseRepository';
import { Usuario } from '../../types/database/entities.types';
import { TABLE_NAMES } from '../../types/database/entities.types';

export class UsuariosRepository extends BaseRepository<Usuario> {
    constructor() {
        super({
            table: TABLE_NAMES.USUARIOS,
            useCache: false, // Dynamic data, no caching
            enableSoftDelete: true,
            defaultSelect: 'id, nome, email, empresa_id, role, status, last_active, avatar_url, initials, deleted_at, created_at, updated_at'
        });
    }

    /**
     * Find active usuarios only
     */
    async findActive(): Promise<Usuario[]> {
        const result = await this.findWithFilters({
            status: 'Active',
            deleted_at: { is: null }
        });
        return result.data;
    }

    /**
     * Find by email
     */
    async findByEmail(email: string): Promise<Usuario | null> {
        try {
            const result = await this.findWithFilters({
                email: email.toLowerCase(),
                deleted_at: { is: null }
            });
            return result.data.length > 0 ? result.data[0] : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Find by empresa
     */
    async findByEmpresa(empresaId: string): Promise<Usuario[]> {
        const result = await this.findWithFilters({
            empresa_id: empresaId,
            deleted_at: { is: null }
        });
        return result.data;
    }

    /**
     * Find by role
     */
    async findByRole(role: string): Promise<Usuario[]> {
        const result = await this.findWithFilters({
            role,
            deleted_at: { is: null }
        });
        return result.data;
    }

    /**
     * Find by empresa and role
     */
    async findByEmpresaAndRole(empresaId: string, role: string): Promise<Usuario[]> {
        const result = await this.findWithFilters({
            empresa_id: empresaId,
            role,
            deleted_at: { is: null }
        });
        return result.data;
    }

    /**
     * Update status
     */
    async updateStatus(id: string, status: string): Promise<Usuario> {
        return this.update(id, { status });
    }

    /**
     * Update role
     */
    async updateRole(id: string, role: string): Promise<Usuario> {
        return this.update(id, { role });
    }

    /**
     * Update last active timestamp
     */
    async updateLastActive(id: string): Promise<Usuario> {
        return this.update(id, { last_active: new Date().toISOString() });
    }

    /**
     * Update avatar URL
     */
    async updateAvatarUrl(id: string, avatarUrl: string): Promise<Usuario> {
        return this.update(id, { avatar_url: avatarUrl });
    }

    /**
     * Search usuarios by name or email
     */
    async search(term: string, empresaId?: string): Promise<Usuario[]> {
        const filters: any = {
            or: {
                nome: { ilike: `%${term}%` },
                email: { ilike: `%${term}%` }
            },
            deleted_at: { is: null }
        };

        if (empresaId) {
            filters.empresa_id = empresaId;
        }

        const result = await this.findWithFilters(filters);
        return result.data;
    }

    /**
     * Get count by role
     */
    async getCountByRole(empresaId?: string): Promise<Record<string, number>> {
        const baseFilters = { deleted_at: { is: null } };

        const adminFilters = empresaId
            ? { ...baseFilters, role: 'Administrador', empresa_id: empresaId }
            : { ...baseFilters, role: 'Administrador' };

        const userFilters = empresaId
            ? { ...baseFilters, role: 'Usuário', empresa_id: empresaId }
            : { ...baseFilters, role: 'Usuário' };

        const adminCount = await this.count(adminFilters);
        const userCount = await this.count(userFilters);

        return {
            Administrador: adminCount,
            'Usuário': userCount
        };
    }

    /**
     * Get count by status
     */
    async getCountByStatus(empresaId?: string): Promise<Record<string, number>> {
        const baseFilters = { deleted_at: { is: null } };

        const activeFilters = empresaId
            ? { ...baseFilters, status: 'Active', empresa_id: empresaId }
            : { ...baseFilters, status: 'Active' };

        const offlineFilters = empresaId
            ? { ...baseFilters, status: 'Offline', empresa_id: empresaId }
            : { ...baseFilters, status: 'Offline' };

        const pendingFilters = empresaId
            ? { ...baseFilters, status: 'Pending', empresa_id: empresaId }
            : { ...baseFilters, status: 'Pending' };

        const inactiveFilters = empresaId
            ? { ...baseFilters, status: 'Inactive', empresa_id: empresaId }
            : { ...baseFilters, status: 'Inactive' };

        const activeCount = await this.count(activeFilters);
        const offlineCount = await this.count(offlineFilters);
        const pendingCount = await this.count(pendingFilters);
        const inactiveCount = await this.count(inactiveFilters);

        return {
            Active: activeCount,
            Offline: offlineCount,
            Pending: pendingCount,
            Inactive: inactiveCount
        };
    }
}