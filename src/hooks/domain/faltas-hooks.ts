/**
 * Domain hooks for Faltas (Shortages/Absences) management
 * Uses TanStack Query for data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { faltasService } from '../../../services/faltasService';
import type { FaltaFilters, FaltaFormData } from '../../types/domain/domain.types';

// Types
export type FaltaStatus = 'Pendente' | 'Aprovada' | 'Rejeitada' | 'Em Andamento' | 'Resolvida' | 'Cancelada';

export type FaltasListParams = {
    filters?: FaltaFilters;
    pagination?: {
        page?: number;
        pageSize?: number;
    };
    sort?: {
        field?: string;
        order?: 'asc' | 'desc';
    };
};

export type CreateFaltaParams = FaltaFormData;
export type UpdateFaltaParams = {
    id: string;
    data: any;
};
export type DeleteFaltaParams = string;
export type ApproveFaltaParams = {
    id: string;
};
export type RejectFaltaParams = {
    id: string;
};
export type UpdateFaltaStatusParams = {
    id: string;
    status: FaltaStatus;
};
export type BulkFaltasOperationParams = {
    ids: string[];
    operation: 'approve' | 'reject' | 'delete';
};

// Query keys
const faltasKeys = {
    all: ['faltas'] as const,
    lists: () => [...faltasKeys.all, 'list'] as const,
    list: (params: FaltasListParams) => [...faltasKeys.lists(), params] as const,
    details: () => [...faltasKeys.all, 'detail'] as const,
    detail: (id: string) => [...faltasKeys.details(), id] as const,
};

/**
 * Hook to fetch a paginated list of faltas
 */
export function useFaltasList(params: FaltasListParams = {}) {
    return useQuery({
        queryKey: faltasKeys.list(params),
        queryFn: () => faltasService.getAll(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to fetch a single falta by ID
 */
export function useFalta(id: string) {
    return useQuery({
        queryKey: faltasKeys.detail(id),
        queryFn: () => faltasService.getById(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to create a new falta
 */
export function useCreateFalta() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateFaltaParams) => faltasService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: faltasKeys.lists() });
        },
    });
}

/**
 * Hook to update an existing falta
 */
export function useUpdateFalta() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: UpdateFaltaParams) => faltasService.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: faltasKeys.lists() });
            queryClient.invalidateQueries({ queryKey: faltasKeys.detail(id) });
        },
    });
}

/**
 * Hook to delete a falta
 */
export function useDeleteFalta() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: DeleteFaltaParams) => faltasService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: faltasKeys.lists() });
        },
    });
}

/**
 * Hook to approve a falta
 */
export function useApproveFalta() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id }: ApproveFaltaParams) =>
            faltasService.updateStatus(id, 'Aprovada'),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: faltasKeys.lists() });
            queryClient.invalidateQueries({ queryKey: faltasKeys.detail(id) });
        },
    });
}

/**
 * Hook to reject a falta
 */
export function useRejectFalta() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id }: RejectFaltaParams) =>
            faltasService.updateStatus(id, 'Rejeitada'),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: faltasKeys.lists() });
            queryClient.invalidateQueries({ queryKey: faltasKeys.detail(id) });
        },
    });
}

/**
 * Hook to update status of a falta
 */
export function useUpdateFaltaStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: UpdateFaltaStatusParams) =>
            faltasService.updateStatus(id, status),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: faltasKeys.lists() });
            queryClient.invalidateQueries({ queryKey: faltasKeys.detail(id) });
        },
    });
}

/**
 * Hook to perform bulk operations on multiple faltas
 */
export function useBulkFaltasOperation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ ids, operation }: BulkFaltasOperationParams) => {
            const promises = ids.map(id => {
                switch (operation) {
                    case 'approve':
                        return faltasService.updateStatus(id, 'Aprovada');
                    case 'reject':
                        return faltasService.updateStatus(id, 'Rejeitada');
                    case 'delete':
                        return faltasService.delete(id);
                    default:
                        throw new Error(`Unknown operation: ${operation}`);
                }
            });
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: faltasKeys.lists() });
        },
    });
}

/**
 * Hook to batch approve multiple faltas
 */
export function useBatchApproveFaltas() {
    const bulkOperation = useBulkFaltasOperation();

    return useMutation({
        mutationFn: (ids: string[]) =>
            bulkOperation.mutateAsync({ ids, operation: 'approve' }),
    });
}

/**
 * Hook to batch reject multiple faltas
 */
export function useBatchRejectFaltas() {
    const bulkOperation = useBulkFaltasOperation();

    return useMutation({
        mutationFn: (ids: string[]) =>
            bulkOperation.mutateAsync({ ids, operation: 'reject' }),
    });
}

/**
 * Hook to batch delete multiple faltas
 */
export function useBatchDeleteFaltas() {
    const bulkOperation = useBulkFaltasOperation();

    return useMutation({
        mutationFn: (ids: string[]) =>
            bulkOperation.mutateAsync({ ids, operation: 'delete' }),
    });
}
