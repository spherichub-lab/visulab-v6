/**
 * Generic mutation hook templates for TanStack Query
 * Provides reusable hooks for create, update, and delete operations
 */

import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { ApiResponse } from '../../types/api/api.types';
import { createQueryKeys } from './queryKeysFactory';
import { cachePolicyUtils } from './cachePolicies';

// Generic mutation hook options
export interface UseGenericMutationOptions<TData, TError, TVariables> {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: TError, variables: TVariables) => void;
    onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables) => void;
    onMutate?: (variables: TVariables) => Promise<unknown> | unknown;
    invalidateQueries?: boolean;
    invalidateKeys?: readonly unknown[][];
    optimisticUpdate?: boolean;
}

// Generic create mutation hook
export function useGenericCreateMutation<T, C = any>(
    entityType: string,
    service: any,
    options?: UseGenericMutationOptions<T, Error, C>
): UseMutationResult<T, Error, C> {
    const queryKeys = createQueryKeys<T>(entityType);

    return useMutation({
        mutationFn: async (data: C) => {
            const response = await service.create(data);
            return response.data!;
        },
        onSuccess: (data, variables) => {
            options?.onSuccess?.(data, variables);

            // Invalidate related queries after successful creation
            if (options?.invalidateQueries !== false) {
                const keysToInvalidate = options?.invalidateKeys || [
                    queryKeys.all,
                    queryKeys.lists,
                ];

                // This would typically use queryClient.invalidateQueries
                // For now, we'll just log the invalidation
                console.log('Invalidating queries after create:', keysToInvalidate);
            }
        },
        onError: options?.onError,
        onSettled: options?.onSettled,
        onMutate: options?.onMutate,
        ...cachePolicyUtils.createMutationOptions('standard', options),
    });
}

// Generic update mutation hook
export function useGenericUpdateMutation<T, U = Partial<T>>(
    entityType: string,
    service: any,
    options?: UseGenericMutationOptions<T, Error, { id: string; data: U }>
): UseMutationResult<T, Error, { id: string; data: U }> {
    const queryKeys = createQueryKeys<T>(entityType);

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: U }) => {
            const response = await service.update(id, data);
            return response.data!;
        },
        onSuccess: (data, variables) => {
            options?.onSuccess?.(data, variables);

            // Invalidate related queries after successful update
            if (options?.invalidateQueries !== false) {
                const keysToInvalidate = options?.invalidateKeys || [
                    queryKeys.all,
                    queryKeys.lists,
                    queryKeys.detail(variables.id),
                ];

                // This would typically use queryClient.invalidateQueries
                console.log('Invalidating queries after update:', keysToInvalidate);
            }
        },
        onError: options?.onError,
        onSettled: options?.onSettled,
        onMutate: options?.onMutate,
        ...cachePolicyUtils.createMutationOptions('standard', options),
    });
}

// Generic patch mutation hook (partial update)
export function useGenericPatchMutation<T, U = Partial<T>>(
    entityType: string,
    service: any,
    options?: UseGenericMutationOptions<T, Error, { id: string; data: Partial<U> }>
): UseMutationResult<T, Error, { id: string; data: Partial<U> }> {
    const queryKeys = createQueryKeys<T>(entityType);

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<U> }) => {
            const response = await service.patch(id, data);
            return response.data!;
        },
        onSuccess: (data, variables) => {
            options?.onSuccess?.(data, variables);

            // Invalidate related queries after successful patch
            if (options?.invalidateQueries !== false) {
                const keysToInvalidate = options?.invalidateKeys || [
                    queryKeys.all,
                    queryKeys.lists,
                    queryKeys.detail(variables.id),
                ];

                // This would typically use queryClient.invalidateQueries
                console.log('Invalidating queries after patch:', keysToInvalidate);
            }
        },
        onError: options?.onError,
        onSettled: options?.onSettled,
        onMutate: options?.onMutate,
        ...cachePolicyUtils.createMutationOptions('standard', options),
    });
}

// Generic delete mutation hook
export function useGenericDeleteMutation<T>(
    entityType: string,
    service: any,
    options?: UseGenericMutationOptions<void, Error, string>
): UseMutationResult<void, Error, string> {
    const queryKeys = createQueryKeys<T>(entityType);

    return useMutation({
        mutationFn: async (id: string) => {
            await service.delete(id);
            return;
        },
        onSuccess: (data, variables) => {
            options?.onSuccess?.(data, variables);

            // Invalidate related queries after successful deletion
            if (options?.invalidateQueries !== false) {
                const keysToInvalidate = options?.invalidateKeys || [
                    queryKeys.all,
                    queryKeys.lists,
                    queryKeys.detail(variables),
                ];

                // This would typically use queryClient.invalidateQueries
                console.log('Invalidating queries after delete:', keysToInvalidate);
            }
        },
        onError: options?.onError,
        onSettled: options?.onSettled,
        onMutate: options?.onMutate,
        ...cachePolicyUtils.createMutationOptions('critical', options),
    });
}

// Advanced mutation hooks

// Generic bulk mutation hook
export function useGenericBulkMutation<T, TVariables = any>(
    entityType: string,
    mutationFn: (variables: TVariables) => Promise<ApiResponse<T[]>>,
    options?: UseGenericMutationOptions<T[], Error, TVariables>
): UseMutationResult<T[], Error, TVariables> {
    const queryKeys = createQueryKeys<T>(entityType);

    return useMutation({
        mutationFn: async (variables: TVariables) => {
            const response = await mutationFn(variables);
            return response.data!;
        },
        onSuccess: (data, variables) => {
            options?.onSuccess?.(data, variables);

            // Invalidate related queries after successful bulk operation
            if (options?.invalidateQueries !== false) {
                const keysToInvalidate = options?.invalidateKeys || [
                    queryKeys.all,
                    queryKeys.lists,
                ];

                // This would typically use queryClient.invalidateQueries
                console.log('Invalidating queries after bulk operation:', keysToInvalidate);
            }
        },
        onError: options?.onError,
        onSettled: options?.onSettled,
        onMutate: options?.onMutate,
        ...cachePolicyUtils.createMutationOptions('critical', options),
    });
}

// Generic custom mutation hook
export function useGenericCustomMutation<TData, TError = Error, TVariables = void>(
    entityType: string,
    mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
    options?: UseGenericMutationOptions<TData, TError, TVariables>
): UseMutationResult<TData, TError, TVariables> {
    const queryKeys = createQueryKeys<any>(entityType);

    return useMutation({
        mutationFn: async (variables: TVariables) => {
            const response = await mutationFn(variables);
            return response.data!;
        },
        onSuccess: (data, variables) => {
            options?.onSuccess?.(data, variables);

            // Invalidate related queries if specified
            if (options?.invalidateQueries !== false && options?.invalidateKeys) {
                // This would typically use queryClient.invalidateQueries
                console.log('Invalidating custom queries:', options.invalidateKeys);
            }
        },
        onError: options?.onError,
        onSettled: options?.onSettled,
        onMutate: options?.onMutate,
        ...cachePolicyUtils.createMutationOptions('standard', options),
    });
}

export default {
    useGenericCreateMutation,
    useGenericUpdateMutation,
    useGenericPatchMutation,
    useGenericDeleteMutation,
    useGenericBulkMutation,
    useGenericCustomMutation,
};