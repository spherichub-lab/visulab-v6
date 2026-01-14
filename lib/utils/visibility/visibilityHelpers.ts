/**
 * Visibility Helpers
 * Centralized utility functions for role-based visibility checks
 */

import type { AuthUser } from '../../../src/types/api/api.types';

/**
 * Check if user has admin privileges
 */
export function isAdmin(user: AuthUser): boolean {
    return user?.role === 'Administrador';
}

/**
 * Check if user can view all faltas
 */
export function canViewAllFaltas(user: AuthUser): boolean {
    return isAdmin(user);
}

/**
 * Check if user can view company faltas
 */
export function canViewCompanyFaltas(user: AuthUser, empresaId: string): boolean {
    if (isAdmin(user)) return true;
    return user?.empresa_id === empresaId;
}

/**
 * Check if user can create faltas for a company
 */
export function canCreateFaltaForCompany(user: AuthUser, empresaId: string): boolean {
    if (isAdmin(user)) return true;
    return user?.empresa_id === empresaId;
}

/**
 * Check if user can update faltas for a company
 */
export function canUpdateFaltaForCompany(user: AuthUser, empresaId: string): boolean {
    if (isAdmin(user)) return true;
    return user?.empresa_id === empresaId;
}

/**
 * Check if user can delete a specific falta record
 * Admins can delete any falta, regular users can only delete their own
 */
export function canDeleteFalta(user: AuthUser, falta: { usuario_id: string }): boolean {
    if (isAdmin(user)) return true;
    return user.id === falta.usuario_id;
}

/**
 * Get visibility filter for faltas queries
 * Returns null for admins (no filter), or empresa_id filter for regular users
 */
export function getFaltasVisibilityFilter(user: AuthUser): {
    empresa_id?: string;
} | null {
    if (isAdmin(user)) {
        return null; // No filter - admin sees all
    }

    if (user?.empresa_id) {
        return { empresa_id: user.empresa_id };
    }

    throw new Error('User has no empresa_id assigned');
}

/**
 * Check if user can update a specific falta record
 * Admins can update any falta, regular users can only update their own
 */
export function canUpdateFalta(user: AuthUser, falta: { usuario_id: string }): boolean {
    if (isAdmin(user)) return true;
    return user.id === falta.usuario_id;
}

/**
 * Validate user can perform operation on a falta
 * Throws error if user doesn't have permission
 */
export function validateFaltaAccess(
    user: AuthUser,
    operation: 'view' | 'create' | 'update' | 'delete',
    empresaId?: string
): void {
    if (operation === 'delete') {
        throw new Error('Delete operations are not allowed for faltas');
    }

    if (!empresaId) {
        throw new Error('empresa_id is required for this operation');
    }

    if (operation === 'view' && !canViewCompanyFaltas(user, empresaId)) {
        throw new Error('User does not have permission to view faltas from this company');
    }

    if (operation === 'create' && !canCreateFaltaForCompany(user, empresaId)) {
        throw new Error('User does not have permission to create faltas for this company');
    }

    if (operation === 'update' && !canUpdateFaltaForCompany(user, empresaId)) {
        throw new Error('User does not have permission to update faltas from this company');
    }
}
