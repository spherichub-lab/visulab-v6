/**
 * Main entry point for frontend architecture
 * Exports all core modules and utilities
 */

// Core library exports
export { queryClient, createQueryClient, queryKeys, cacheUtils } from './lib/queryClient';

// Contexts
export { AuthProvider, useAuth, requireAuth, requireRole } from './contexts/AuthContext';
export type { AuthState, AuthContextType } from './contexts/AuthContext';

// Error handling
export {
    configureErrorHandler,
    setNotificationCallback,
    handleApiError,
    handleError,
    handleBoundaryError,
    showNotification,
    showSuccess,
    showWarning,
    showInfo,
    createAppError,
    isRecoverableError,
    getUserFriendlyMessage,
} from './utils/errorHandler';

export type {
    Notification,
    NotificationType,
    ErrorHandlerConfig,
    AppError,
} from './utils/errorHandler';

// Types
export * from './types/api/api.types';
export * from './types/domain/domain.types';

// Re-export for convenience
export type {
    ApiResponse,
    ApiError,
    QueryOptions,
    PaginatedResponse,
    RequestConfig,
    LoginCredentials,
    AuthTokens,
    AuthUser,
} from './types/api/api.types';

export type {
    Empresa,
    Usuario,
    Falta,
    Compra,
    Indice,
    Tipo,
    Tratamento,
    EmpresaWithStats,
    UsuarioWithStats,
    FaltaWithUI,
    CompraWithUI,
    EmpresaFormData,
    UsuarioFormData,
    FaltaFormData,
    CompraFormData,
    EmpresaFilters,
    UsuarioFilters,
    FaltaFilters,
    CompraFilters,
    DashboardStats,
    DashboardData,
    UIState,
    Notification as UINotification,
    ModalState,
    TableState,
    FormState,
    SearchState,
    Permission,
    Role,
    ValidationRule,
    ValidationSchema,
    BaseComponentProps,
    ButtonProps,
    InputProps,
} from './types/domain/domain.types';