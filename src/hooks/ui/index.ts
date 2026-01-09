/**
 * UI hooks index file
 * Central export point for all UI hooks
 */

export { useErrorHandling, useAsyncError, type ErrorHandlingOptions, type ErrorState, type ErrorHandlingReturn } from './useErrorHandling';
export { useLoadingStates, useLoadingKey, useMultipleLoading, useDebouncedLoading, type LoadingOptions, type LoadingState, type LoadingReturn } from './useLoadingStates';
export { default } from './useErrorHandling';