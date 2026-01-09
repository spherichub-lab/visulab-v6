/**
 * Application Error Classes
 * Custom error classes for different types of application errors
 */

export abstract class ApplicationError extends Error {
    abstract readonly code: string;
    abstract readonly statusCode: number;
    readonly timestamp: Date;
    readonly context?: any;

    constructor(message: string, code?: string, context?: any) {
        super(message);
        this.name = this.constructor.name;
        this.timestamp = new Date();

        if (code) {
            (this as any).code = code;
        }

        this.context = context;

        // Maintains proper stack trace for where our error was thrown
        if ((Error as any).captureStackTrace) {
            (Error as any).captureStackTrace(this, this.constructor);
        }
    }

    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            statusCode: this.statusCode,
            timestamp: this.timestamp,
            context: this.context,
            stack: this.stack
        };
    }
}

export class DatabaseError extends ApplicationError {
    readonly code = 'DATABASE_ERROR';
    readonly statusCode = 500;

    constructor(message: string, code?: string, context?: any) {
        super(message, code, context);
    }
}

export class ValidationError extends ApplicationError {
    readonly code = 'VALIDATION_ERROR';
    readonly statusCode = 400;

    constructor(message: string, code?: string, context?: any) {
        super(message, code, context);
    }
}

export class AuthenticationError extends ApplicationError {
    readonly code = 'AUTHENTICATION_ERROR';
    readonly statusCode = 401;

    constructor(message: string, code?: string, context?: any) {
        super(message, code, context);
    }
}

export class AuthorizationError extends ApplicationError {
    readonly code = 'AUTHORIZATION_ERROR';
    readonly statusCode = 403;

    constructor(message: string, code?: string, context?: any) {
        super(message, code, context);
    }
}

export class NotFoundError extends ApplicationError {
    readonly code = 'NOT_FOUND_ERROR';
    readonly statusCode = 404;

    constructor(message: string = 'Resource not found', code?: string, context?: any) {
        super(message, code, context);
    }
}

export class ConflictError extends ApplicationError {
    readonly code = 'CONFLICT_ERROR';
    readonly statusCode = 409;

    constructor(message: string, code?: string, context?: any) {
        super(message, code, context);
    }
}

export class NetworkError extends ApplicationError {
    readonly code = 'NETWORK_ERROR';
    readonly statusCode = 503;

    constructor(message: string, code?: string, context?: any) {
        super(message, code, context);
    }
}

export class CacheError extends ApplicationError {
    readonly code = 'CACHE_ERROR';
    readonly statusCode = 500;

    constructor(message: string, code?: string, context?: any) {
        super(message, code, context);
    }
}

export class ConfigurationError extends ApplicationError {
    readonly code = 'CONFIGURATION_ERROR';
    readonly statusCode = 500;

    constructor(message: string, code?: string, context?: any) {
        super(message, code, context);
    }
}

export class BusinessLogicError extends ApplicationError {
    readonly code = 'BUSINESS_LOGIC_ERROR';
    readonly statusCode = 422;

    constructor(message: string, code?: string, context?: any) {
        super(message, code, context);
    }
}

export class RateLimitError extends ApplicationError {
    readonly code = 'RATE_LIMIT_ERROR';
    readonly statusCode = 429;

    constructor(message: string = 'Rate limit exceeded', code?: string, context?: any) {
        super(message, code, context);
    }
}

export class ServiceUnavailableError extends ApplicationError {
    readonly code = 'SERVICE_UNAVAILABLE_ERROR';
    readonly statusCode = 503;

    constructor(message: string = 'Service temporarily unavailable', code?: string, context?: any) {
        super(message, code, context);
    }
}

/**
 * Error factory for creating appropriate error instances
 */
export class ErrorFactory {
    /**
     * Create error from error code and message
     */
    static createError(code: string, message: string, context?: any): ApplicationError {
        switch (code) {
            case 'DATABASE_ERROR':
                return new DatabaseError(message, code, context);
            case 'VALIDATION_ERROR':
                return new ValidationError(message, code, context);
            case 'AUTHENTICATION_ERROR':
                return new AuthenticationError(message, code, context);
            case 'AUTHORIZATION_ERROR':
                return new AuthorizationError(message, code, context);
            case 'NOT_FOUND_ERROR':
                return new NotFoundError(message, code, context);
            case 'CONFLICT_ERROR':
                return new ConflictError(message, code, context);
            case 'NETWORK_ERROR':
                return new NetworkError(message, code, context);
            case 'CACHE_ERROR':
                return new CacheError(message, code, context);
            case 'CONFIGURATION_ERROR':
                return new ConfigurationError(message, code, context);
            case 'BUSINESS_LOGIC_ERROR':
                return new BusinessLogicError(message, code, context);
            case 'RATE_LIMIT_ERROR':
                return new RateLimitError(message, code, context);
            case 'SERVICE_UNAVAILABLE_ERROR':
                return new ServiceUnavailableError(message, code, context);
            default:
                return new DatabaseError(message, code, context);
        }
    }

    /**
     * Create error from HTTP status code
     */
    static fromHttpStatusCode(statusCode: number, message: string, context?: any): ApplicationError {
        switch (statusCode) {
            case 400:
                return new ValidationError(message, 'VALIDATION_ERROR', context);
            case 401:
                return new AuthenticationError(message, 'AUTHENTICATION_ERROR', context);
            case 403:
                return new AuthorizationError(message, 'AUTHORIZATION_ERROR', context);
            case 404:
                return new NotFoundError(message, 'NOT_FOUND_ERROR', context);
            case 409:
                return new ConflictError(message, 'CONFLICT_ERROR', context);
            case 422:
                return new BusinessLogicError(message, 'BUSINESS_LOGIC_ERROR', context);
            case 429:
                return new RateLimitError(message, 'RATE_LIMIT_ERROR', context);
            case 500:
                return new DatabaseError(message, 'DATABASE_ERROR', context);
            case 503:
                return new ServiceUnavailableError(message, 'SERVICE_UNAVAILABLE_ERROR', context);
            default:
                return new DatabaseError(message, 'UNKNOWN_ERROR', context);
        }
    }

    /**
     * Check if error is an application error
     */
    static isApplicationError(error: any): error is ApplicationError {
        return error instanceof ApplicationError;
    }

    /**
     * Convert any error to application error
     */
    static toApplicationError(error: any): ApplicationError {
        if (this.isApplicationError(error)) {
            return error;
        }

        if (error instanceof Error) {
            return new DatabaseError(error.message, 'UNKNOWN_ERROR', {
                originalError: error.name,
                stack: error.stack
            });
        }

        return new DatabaseError(String(error), 'UNKNOWN_ERROR', {
            originalError: error
        });
    }
}