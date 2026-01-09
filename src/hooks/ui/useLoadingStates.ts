/**
 * useLoadingStates - Unified loading state management hook
 * Provides centralized loading state management with partial loading support
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingState {
    isLoading: boolean;
    loadingMessage?: string;
    progress?: number;
    isPartialLoading: Record<string, boolean>;
    globalLoadingCount: number;
}

export interface LoadingOptions {
    message?: string;
    progress?: number;
    partial?: string;
    timeout?: number;
}

export interface LoadingReturn extends LoadingState {
    setLoading: (loading: boolean, options?: LoadingOptions) => void;
    setPartialLoading: (key: string, loading: boolean, options?: LoadingOptions) => void;
    clearAllLoading: () => void;
    withLoading: <T>(fn: () => Promise<T>, options?: LoadingOptions) => Promise<T>;
    withPartialLoading: <T>(key: string, fn: () => Promise<T>, options?: LoadingOptions) => Promise<T>;
    setProgress: (progress: number) => void;
    setMessage: (message: string) => void;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Hook for unified loading state management
 */
export const useLoadingStates = (): LoadingReturn => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [loadingState, setLoadingState] = useState<LoadingState>({
        isLoading: false,
        loadingMessage: undefined,
        progress: undefined,
        isPartialLoading: {},
        globalLoadingCount: 0,
    });

    /**
     * Clear timeout on unmount
     */
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    /**
     * Set global loading state
     */
    const setLoading = useCallback((
        loading: boolean,
        options: LoadingOptions = {}
    ) => {
        setLoadingState(prev => {
            const newGlobalCount = loading
                ? prev.globalLoadingCount + 1
                : Math.max(0, prev.globalLoadingCount - 1);

            const isLoading = newGlobalCount > 0;

            // Clear existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            // Set timeout if loading and timeout is specified
            if (loading && options.timeout) {
                timeoutRef.current = setTimeout(() => {
                    setLoadingState(prev => ({
                        ...prev,
                        isLoading: false,
                        globalLoadingCount: 0,
                        loadingMessage: 'Operação expirou. Tente novamente.',
                    }));
                }, options.timeout);
            }

            return {
                ...prev,
                isLoading,
                globalLoadingCount: newGlobalCount,
                loadingMessage: loading ? options.message : undefined,
                progress: loading ? options.progress : undefined,
            };
        });
    }, []);

    /**
     * Set partial loading state for specific operations
     */
    const setPartialLoading = useCallback((
        key: string,
        loading: boolean,
        options: LoadingOptions = {}
    ) => {
        setLoadingState(prev => {
            const newPartialLoading = {
                ...prev.isPartialLoading,
                [key]: loading,
            };

            const hasAnyPartialLoading = Object.values(newPartialLoading).some(Boolean);

            return {
                ...prev,
                isPartialLoading: newPartialLoading,
                loadingMessage: loading ? options.message : prev.loadingMessage,
                progress: loading ? options.progress : prev.progress,
                // Update global loading based on partial loading
                isLoading: prev.globalLoadingCount > 0 || hasAnyPartialLoading,
            };
        });
    }, []);

    /**
     * Clear all loading states
     */
    const clearAllLoading = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        setLoadingState({
            isLoading: false,
            loadingMessage: undefined,
            progress: undefined,
            isPartialLoading: {},
            globalLoadingCount: 0,
        });
    }, []);

    /**
     * Execute function with loading state
     */
    const withLoading = useCallback(async <T,>(
        fn: () => Promise<T>,
        options: LoadingOptions = {}
    ): Promise<T> => {
        try {
            setLoading(true, options);
            const result = await fn();
            return result;
        } finally {
            setLoading(false);
        }
    }, [setLoading]);

    /**
     * Execute function with partial loading state
     */
    const withPartialLoading = useCallback(async <T,>(
        key: string,
        fn: () => Promise<T>,
        options: LoadingOptions = {}
    ): Promise<T> => {
        try {
            setPartialLoading(key, true, options);
            const result = await fn();
            return result;
        } finally {
            setPartialLoading(key, false);
        }
    }, [setPartialLoading]);

    /**
     * Set progress for current loading operation
     */
    const setProgress = useCallback((progress: number) => {
        setLoadingState(prev => ({
            ...prev,
            progress: Math.max(0, Math.min(100, progress)),
        }));
    }, []);

    /**
     * Set loading message
     */
    const setMessage = useCallback((message: string) => {
        setLoadingState(prev => ({
            ...prev,
            loadingMessage: message,
        }));
    }, []);

    return {
        ...loadingState,
        setLoading,
        setPartialLoading,
        clearAllLoading,
        withLoading,
        withPartialLoading,
        setProgress,
        setMessage,
    };
};

/**
 * Hook for managing loading states with specific keys
 */
export const useLoadingKey = (key: string) => {
    const loadingStates = useLoadingStates();

    const isLoading = loadingStates.isPartialLoading[key] || false;

    const setKeyLoading = useCallback((
        loading: boolean,
        options?: LoadingOptions
    ) => {
        loadingStates.setPartialLoading(key, loading, options);
    }, [key, loadingStates]);

    const withKeyLoading = useCallback(<T,>(
        fn: () => Promise<T>,
        options?: LoadingOptions
    ): Promise<T> => {
        return loadingStates.withPartialLoading(key, fn, options);
    }, [key, loadingStates]);

    return {
        isLoading,
        setLoading: setKeyLoading,
        withLoading: withKeyLoading,
        progress: loadingStates.progress,
        message: loadingStates.loadingMessage,
    };
};

/**
 * Hook for managing multiple loading states
 */
export const useMultipleLoading = (keys: string[]) => {
    const loadingStates = useLoadingStates();

    const loadingStatus = keys.reduce((acc, key) => {
        acc[key] = loadingStates.isPartialLoading[key] || false;
        return acc;
    }, {} as Record<string, boolean>);

    const isAnyLoading = Object.values(loadingStatus).some(Boolean);
    const loadingKeys = keys.filter(key => loadingStatus[key]);
    const loadingCount = loadingKeys.length;

    const setMultipleLoading = useCallback((
        keyLoadingMap: Partial<Record<string, boolean>>,
        options?: LoadingOptions
    ) => {
        Object.entries(keyLoadingMap).forEach(([key, loading]) => {
            loadingStates.setPartialLoading(key, loading, options);
        });
    }, [loadingStates]);

    const clearMultipleLoading = useCallback((keysToClear?: string[]) => {
        const keysToUpdate = keysToClear || keys;
        keysToUpdate.forEach(key => {
            loadingStates.setPartialLoading(key, false);
        });
    }, [keys, loadingStates]);

    return {
        loadingStatus,
        isAnyLoading,
        loadingKeys,
        loadingCount,
        setMultipleLoading,
        clearMultipleLoading,
        progress: loadingStates.progress,
        message: loadingStates.loadingMessage,
    };
};

/**
 * Hook for debounced loading states
 */
export const useDebouncedLoading = (delay: number = 300) => {
    const loadingStates = useLoadingStates();
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const setDebouncedLoading = useCallback((
        loading: boolean,
        options?: LoadingOptions
    ) => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (loading) {
            // Show loading immediately
            loadingStates.setLoading(true, options);
        } else {
            // Debounce hiding loading
            debounceRef.current = setTimeout(() => {
                loadingStates.setLoading(false);
            }, delay);
        }
    }, [loadingStates, delay]);

    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    return {
        ...loadingStates,
        setLoading: setDebouncedLoading,
    };
};

export default useLoadingStates;