/**
 * VisuLab Backend Library Index
 * Central export point for all backend modules
 */

// Types
export * from './types';

// Integration Layer
export * from './integration/supabase';

// Data Access Layer
export * from './dal';

// Utilities
export { SimpleCacheManager, referenceCache } from './utils/cache';
export type { CacheEntry, CacheStats, CacheConfig } from './utils/cache';
export { REFERENCE_CACHE_KEYS } from './utils/cache';

export { Logger, LoggerFactory } from './utils/logger/logger';
export type { LogLevel, LogEntry, LoggerConfig } from './utils/logger/logger';

export { ApplicationError, DatabaseError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError, NetworkError, CacheError, ConfigurationError, BusinessLogicError, RateLimitError, ServiceUnavailableError, ErrorFactory } from './utils/errors/applicationErrors';

// Services Base
export { BaseService, ValidationRules } from '../services/base/baseService';
export type { ServiceConfig, ValidationRule } from '../services/base/baseService';