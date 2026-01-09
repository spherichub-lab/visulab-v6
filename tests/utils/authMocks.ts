/**
 * Auth Mocks and Test Utilities
 * Provides mock implementations for auth-related services and components
 * 
 * This file includes:
 * - Mock SupabaseAuthService
 * - Mock AuthContext
 * - Mock apiClient
 * - Test helpers for auth scenarios
 */

import { vi } from 'vitest';
import { AuthTokens, AuthUser, LoginCredentials } from '../../src/types/api/api.types';

// ============================================================================
// TYPES
// ============================================================================

export interface MockAuthSession {
    user: AuthUser;
    tokens: AuthTokens;
}

export interface MockAuthState {
    user: AuthUser | null;
    tokens: AuthTokens | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    lastActivity: number | null;
    sessionWarningShown: boolean;
}

// ============================================================================
// MOCK DATA
// ============================================================================

/**
 * Create a mock auth user
 */
export const createMockUser = (overrides: Partial<AuthUser> = {}): AuthUser => {
    return {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'Usuário',
        avatarUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
    };
};

/**
 * Create mock auth tokens
 */
export const createMockTokens = (overrides: Partial<AuthTokens> = {}): AuthTokens => {
    const now = Date.now();
    const expiresAt = now + 60 * 60 * 1000; // 1 hour from now

    return {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt,
        tokenType: 'bearer',
        ...overrides,
    };
};

/**
 * Create a mock auth session
 */
export const createMockSession = (overrides: Partial<MockAuthSession> = {}): MockAuthSession => {
    return {
        user: createMockUser(),
        tokens: createMockTokens(),
        ...overrides,
    };
};

/**
 * Create mock login credentials
 */
export const createMockCredentials = (overrides: Partial<LoginCredentials> = {}): LoginCredentials => {
    return {
        email: 'test@example.com',
        password: 'password123',
        ...overrides,
    };
};

// ============================================================================
// MOCK SUPABASE AUTH SERVICE
// ============================================================================

/**
 * Mock implementation of SupabaseAuthService
 */
export class MockSupabaseAuthService {
    private session: MockAuthSession | null = null;
    private currentUser: AuthUser | null = null;
    private shouldFailSignIn = false;
    private shouldFailRefresh = false;
    private signInCallback: ((credentials: LoginCredentials) => Promise<MockAuthSession>) | null = null;
    private refreshCallback: (() => Promise<MockAuthSession | null>) | null = null;

    // Mock methods
    signIn = vi.fn(async (credentials: LoginCredentials): Promise<MockAuthSession> => {
        if (this.shouldFailSignIn) {
            throw new Error('Invalid credentials');
        }

        if (this.signInCallback) {
            return this.signInCallback(credentials);
        }

        // Default success behavior
        const session = createMockSession({
            user: createMockUser({ email: credentials.email }),
        });
        this.setSession(session);
        return session;
    });

    signOut = vi.fn(async (): Promise<void> => {
        this.session = null;
        this.currentUser = null;
        localStorage.removeItem('visulab_session');
        localStorage.removeItem('visulab_user');
    });

    getCurrentSession = vi.fn(async (): Promise<MockAuthSession | null> => {
        return this.session;
    });

    getCurrentUser = vi.fn(async (): Promise<AuthUser | null> => {
        return this.currentUser || this.session?.user || null;
    });

    refreshSession = vi.fn(async (): Promise<MockAuthSession | null> => {
        if (this.shouldFailRefresh) {
            throw new Error('Token refresh failed');
        }

        if (this.refreshCallback) {
            return this.refreshCallback();
        }

        if (this.session) {
            // Update tokens with new expiry
            const newTokens = createMockTokens({
                accessToken: 'new-mock-access-token',
                refreshToken: 'new-mock-refresh-token',
            });
            this.session.tokens = newTokens;
            this.storeSession(this.session);
            return this.session;
        }

        return null;
    });

    onAuthStateChange = vi.fn((callback: (session: MockAuthSession | null) => void): (() => void) => {
        // Return unsubscribe function
        return () => { };
    });

    updateUser = vi.fn(async (data: Partial<AuthUser>): Promise<AuthUser> => {
        if (!this.currentUser) {
            throw new Error('User not authenticated');
        }

        this.currentUser = { ...this.currentUser, ...data };
        this.storeUser(this.currentUser);

        return this.currentUser;
    });

    // Storage methods
    static getStoredSession = vi.fn((): MockAuthSession | null => {
        try {
            const stored = localStorage.getItem('visulab_session');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    static storeSession = vi.fn((session: MockAuthSession): void => {
        localStorage.setItem('visulab_session', JSON.stringify(session));
    });

    static clearSession = vi.fn((): void => {
        localStorage.removeItem('visulab_session');
    });

    static getStoredUser = vi.fn((): AuthUser | null => {
        try {
            const stored = localStorage.getItem('visulab_user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    static storeUser = vi.fn((user: AuthUser): void => {
        localStorage.setItem('visulab_user', JSON.stringify(user));
    });

    static clearUser = vi.fn((): void => {
        localStorage.removeItem('visulab_user');
    });

    // Instance storage methods
    setSession(session: MockAuthSession | null): void {
        this.session = session;
        this.currentUser = session?.user || null;

        if (session) {
            this.storeSession(session);
            this.storeUser(session.user);
        } else {
            this.clearSession();
            this.clearUser();
        }
    }

    private storeSession(session: MockAuthSession): void {
        localStorage.setItem('visulab_session', JSON.stringify(session));
    }

    private storeUser(user: AuthUser): void {
        localStorage.setItem('visulab_user', JSON.stringify(user));
    }

    private clearSession(): void {
        localStorage.removeItem('visulab_session');
    }

    private clearUser(): void {
        localStorage.removeItem('visulab_user');
    }

    // Test control methods
    setShouldFailSignIn(shouldFail: boolean): void {
        this.shouldFailSignIn = shouldFail;
    }

    setShouldFailRefresh(shouldFail: boolean): void {
        this.shouldFailRefresh = shouldFail;
    }

    setSignInCallback(callback: (credentials: LoginCredentials) => Promise<MockAuthSession>): void {
        this.signInCallback = callback;
    }

    setRefreshCallback(callback: () => Promise<MockAuthSession | null>): void {
        this.refreshCallback = callback;
    }

    reset(): void {
        this.session = null;
        this.currentUser = null;
        this.shouldFailSignIn = false;
        this.shouldFailRefresh = false;
        this.signInCallback = null;
        this.refreshCallback = null;
        localStorage.removeItem('visulab_session');
        localStorage.removeItem('visulab_user');
        this.signIn.mockClear();
        this.signOut.mockClear();
        this.getCurrentSession.mockClear();
        this.getCurrentUser.mockClear();
        this.refreshSession.mockClear();
        this.onAuthStateChange.mockClear();
        this.updateUser.mockClear();
    }
}

// ============================================================================
// MOCK AUTH CONTEXT
// ============================================================================

/**
 * Mock AuthContext value
 */
export const createMockAuthContext = (overrides: Partial<MockAuthState> = {}): MockAuthState => {
    return {
        user: createMockUser(),
        tokens: createMockTokens(),
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        lastActivity: Date.now(),
        sessionWarningShown: false,
        ...overrides,
    };
};

/**
 * Mock AuthContext provider for testing
 */
export const mockAuthContextValue = {
    ...createMockAuthContext(),
    login: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
    refreshToken: vi.fn(),
    validateSession: vi.fn(),
    extendSession: vi.fn(),
    hasRole: vi.fn((role: string) => true),
    hasPermission: vi.fn((permission: string) => true),
};

// ============================================================================
// MOCK BROADCAST CHANNEL
// ============================================================================

/**
 * Mock BroadcastChannel for testing multi-tab sync
 */
export class MockBroadcastChannel {
    private name: string;
    private listeners: Array<(event: MessageEvent) => void> = [];
    private channels: Map<string, MockBroadcastChannel> = new Map();

    constructor(name: string) {
        this.name = name;
        // Store reference for cross-channel communication
        if (!MockBroadcastChannel.globalChannels.has(name)) {
            MockBroadcastChannel.globalChannels.set(name, this);
        }
    }

    postMessage(message: any): void {
        // Simulate message delivery to all listeners
        const event = new MessageEvent('message', { data: message });
        this.listeners.forEach(listener => listener(event));

        // Also deliver to other channels with same name
        MockBroadcastChannel.globalChannels.forEach((channel, channelName) => {
            if (channelName === this.name && channel !== this) {
                channel.listeners.forEach(listener => listener(event));
            }
        });
    }

    addEventListener(type: string, listener: (event: MessageEvent) => void): void {
        if (type === 'message') {
            this.listeners.push(listener);
        }
    }

    removeEventListener(type: string, listener: (event: MessageEvent) => void): void {
        if (type === 'message') {
            this.listeners = this.listeners.filter(l => l !== listener);
        }
    }

    close(): void {
        this.listeners = [];
        MockBroadcastChannel.globalChannels.delete(this.name);
    }

    static globalChannels: Map<string, MockBroadcastChannel> = new Map();

    static reset(): void {
        MockBroadcastChannel.globalChannels.clear();
    }
}

// ============================================================================
// MOCK LOCAL STORAGE
// ============================================================================

/**
 * Mock localStorage for testing
 */
export class MockLocalStorage {
    private store: Map<string, string> = new Map();

    get length(): number {
        return this.store.size;
    }

    clear(): void {
        this.store.clear();
    }

    getItem(key: string): string | null {
        return this.store.get(key) || null;
    }

    setItem(key: string, value: string): void {
        this.store.set(key, value);
    }

    removeItem(key: string): void {
        this.store.delete(key);
    }

    key(index: number): string | null {
        const keys = Array.from(this.store.keys());
        return keys[index] || null;
    }

    reset(): void {
        this.store.clear();
    }
}

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Wait for a specified time (useful for async operations)
 */
export const waitFor = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Wait for condition to be true
 */
export const waitForCondition = async (
    condition: () => boolean,
    timeout = 5000,
    interval = 100
): Promise<void> => {
    const start = Date.now();

    while (Date.now() - start < timeout) {
        if (condition()) {
            return;
        }
        await waitFor(interval);
    }

    throw new Error(`Condition not met within ${timeout}ms`);
};

/**
 * Create a mock 401 error
 */
export const createMock401Error = (message = 'Unauthorized') => {
    const error = new Error(message) as any;
    error.response = {
        status: 401,
        data: { message },
    };
    error.code = 'AUTHENTICATION_ERROR';
    error.statusCode = 401;
    return error;
};

/**
 * Create a mock 403 error
 */
export const createMock403Error = (message = 'Forbidden') => {
    const error = new Error(message) as any;
    error.response = {
        status: 403,
        data: { message },
    };
    error.code = 'AUTHORIZATION_ERROR';
    error.statusCode = 403;
    return error;
};

/**
 * Create a mock network error
 */
export const createMockNetworkError = (message = 'Network error') => {
    const error = new Error(message) as any;
    error.code = 'NETWORK_ERROR';
    error.statusCode = 0;
    return error;
};

/**
 * Create a mock validation error
 */
export const createMockValidationError = (message = 'Validation failed') => {
    const error = new Error(message) as any;
    error.response = {
        status: 400,
        data: { message, details: { field: 'email' } },
    };
    error.code = 'VALIDATION_ERROR';
    error.statusCode = 400;
    return error;
};

/**
 * Setup auth test environment
 */
export const setupAuthTestEnvironment = () => {
    // Clear localStorage
    localStorage.clear();

    // Reset BroadcastChannel mocks
    MockBroadcastChannel.reset();

    // Return cleanup function
    return () => {
        localStorage.clear();
        MockBroadcastChannel.reset();
    };
};

/**
 * Create a mock authenticated user with specific role
 */
export const createMockUserWithRole = (role: string): AuthUser => {
    return createMockUser({ role });
};

/**
 * Create a mock admin user
 */
export const createMockAdminUser = (): AuthUser => {
    return createMockUserWithRole('Administrador');
};

/**
 * Create a mock regular user
 */
export const createMockRegularUser = (): AuthUser => {
    return createMockUserWithRole('Usuário');
};

// ============================================================================
// EXPORTS
// ============================================================================

export const mockSupabaseAuthService = new MockSupabaseAuthService();

// Export singletons for convenience
export default {
    mockSupabaseAuthService,
    createMockUser,
    createMockTokens,
    createMockSession,
    createMockCredentials,
    createMockAuthContext,
    createMockUserWithRole,
    createMockAdminUser,
    createMockRegularUser,
    createMock401Error,
    createMock403Error,
    createMockNetworkError,
    createMockValidationError,
    MockSupabaseAuthService,
    MockBroadcastChannel,
    MockLocalStorage,
    waitFor,
    waitForCondition,
    setupAuthTestEnvironment,
    mockAuthContextValue,
};
