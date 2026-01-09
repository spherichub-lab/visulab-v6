/**
 * Base Service
 * Common service functionality with error handling and logging
 */

import { Logger } from '../../lib/utils/logger/logger';
import { ApplicationError, ValidationError, BusinessLogicError } from '../../lib/utils/errors/applicationErrors';
import { ApiResponse } from '../../lib/types/api/api.types';

export interface ServiceConfig {
    name: string;
    enableLogging?: boolean;
    enableValidation?: boolean;
}

export abstract class BaseService {
    protected logger: Logger;
    protected config: ServiceConfig;

    constructor(config: ServiceConfig) {
        this.config = {
            enableLogging: true,
            enableValidation: true,
            ...config
        };
        this.logger = new Logger(config.name);
    }

    /**
     * Handle service errors consistently
     */
    protected handleError(error: any, context?: any): ApplicationError {
        if (error instanceof ApplicationError) {
            this.logger.error('Application error occurred', {
                error: error.toJSON(),
                context
            });
            return error;
        }

        // Handle validation errors
        if (error.name === 'ValidationError' || error.message?.includes('validation')) {
            const validationError = new ValidationError(error.message, 'VALIDATION_ERROR', context);
            this.logger.warn('Validation error occurred', {
                error: validationError.toJSON(),
                context
            });
            return validationError;
        }

        // Handle business logic errors
        if (error.name === 'BusinessLogicError' || error.message?.includes('business')) {
            const businessError = new BusinessLogicError(error.message, 'BUSINESS_LOGIC_ERROR', context);
            this.logger.warn('Business logic error occurred', {
                error: businessError.toJSON(),
                context
            });
            return businessError;
        }

        // Handle unknown errors
        const unknownError = new (class extends ApplicationError {
            readonly code = 'UNKNOWN_ERROR';
            readonly statusCode = 500;
            constructor(message: string, context?: any) {
                super(message, 'UNKNOWN_ERROR', context);
            }
        })('An unexpected error occurred', {
            originalError: error,
            context
        });
        this.logger.error('Unknown error occurred', {
            error: unknownError.toJSON(),
            context
        });
        return unknownError;
    }

    /**
     * Validate input data
     */
    protected validateInput(data: any, rules?: ValidationRule[]): void {
        if (!this.config.enableValidation) {
            return;
        }

        if (!rules) {
            return;
        }

        for (const rule of rules) {
            try {
                rule.validate(data);
            } catch (error) {
                throw new ValidationError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', {
                    field: rule.field,
                    value: data[rule.field],
                    rule: rule.name
                });
            }
        }
    }

    /**
     * Log service operation
     */
    protected logOperation(operation: string, data?: any): void {
        if (!this.config.enableLogging) {
            return;
        }

        this.logger.info(`Service operation: ${operation}`, {
            service: this.config.name,
            data: this.sanitizeLogData(data)
        });
    }

    /**
     * Log service result
     */
    protected logResult(operation: string, result: any): void {
        if (!this.config.enableLogging) {
            return;
        }

        this.logger.debug(`Service result: ${operation}`, {
            service: this.config.name,
            result: this.sanitizeLogData(result)
        });
    }

    /**
     * Create success response
     */
    protected createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
        return {
            success: true,
            data,
            message
        };
    }

    /**
     * Create error response
     */
    protected createErrorResponse(error: ApplicationError): ApiResponse<never> {
        return {
            success: false,
            error: {
                code: error.code,
                message: error.message,
                statusCode: error.statusCode,
                details: error.context
            }
        };
    }

    /**
     * Execute operation with error handling
     */
    protected async executeOperation<T>(
        operation: string,
        fn: () => Promise<T>,
        context?: any
    ): Promise<ApiResponse<T>> {
        this.logOperation(operation, context);

        try {
            const result = await fn();
            this.logResult(operation, result);
            return this.createSuccessResponse(result);
        } catch (error) {
            const appError = this.handleError(error, context);
            return this.createErrorResponse(appError);
        }
    }

    /**
     * Execute validation and operation
     */
    protected async executeWithValidation<T>(
        operation: string,
        data: any,
        validationRules: ValidationRule[],
        fn: () => Promise<T>,
        context?: any
    ): Promise<ApiResponse<T>> {
        this.logOperation(operation, context);

        try {
            this.validateInput(data, validationRules);
            const result = await fn();
            this.logResult(operation, result);
            return this.createSuccessResponse(result);
        } catch (error) {
            const appError = this.handleError(error, context);
            return this.createErrorResponse(appError);
        }
    }

    /**
     * Sanitize data for logging (remove sensitive fields)
     */
    protected sanitizeLogData(data: any): any {
        if (!data || typeof data !== 'object') {
            return data;
        }

        const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
        const sanitized = { ...data };

        const sanitizeObject = (obj: any): any => {
            if (!obj || typeof obj !== 'object') {
                return obj;
            }

            const result = Array.isArray(obj) ? [...obj] : { ...obj };

            for (const key in result) {
                if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
                    result[key] = '[REDACTED]';
                } else if (typeof result[key] === 'object' && result[key] !== null) {
                    result[key] = sanitizeObject(result[key]);
                }
            }

            return result;
        };

        return sanitizeObject(sanitized);
    }

    /**
     * Check if user has permission
     */
    protected hasPermission(userRole: string, requiredRole: string): boolean {
        const roleHierarchy = {
            'admin': 3,
            'manager': 2,
            'user': 1
        };

        const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
        const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

        return userLevel >= requiredLevel;
    }

    /**
     * Get service configuration
     */
    public getConfig(): ServiceConfig {
        return { ...this.config };
    }

    /**
     * Update service configuration
     */
    public updateConfig(config: Partial<ServiceConfig>): void {
        this.config = { ...this.config, ...config };
    }
}

/**
 * Validation rule interface
 */
export interface ValidationRule {
    name: string;
    field: string;
    validate: (data: any) => void;
}

/**
 * Common validation rules
 */
export class ValidationRules {
    static required(field: string, message?: string): ValidationRule {
        return {
            name: 'required',
            field,
            validate: (data: any) => {
                if (!data[field] || data[field] === '' || data[field] === null) {
                    throw new Error(message || `${field} is required`);
                }
            }
        };
    }

    static email(field: string, message?: string): ValidationRule {
        return {
            name: 'email',
            field,
            validate: (data: any) => {
                const email = data[field];
                if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    throw new Error(message || `${field} must be a valid email`);
                }
            }
        };
    }

    static minLength(field: string, minLength: number, message?: string): ValidationRule {
        return {
            name: 'minLength',
            field,
            validate: (data: any) => {
                const value = data[field];
                if (value && value.length < minLength) {
                    throw new Error(message || `${field} must be at least ${minLength} characters`);
                }
            }
        };
    }

    static maxLength(field: string, maxLength: number, message?: string): ValidationRule {
        return {
            name: 'maxLength',
            field,
            validate: (data: any) => {
                const value = data[field];
                if (value && value.length > maxLength) {
                    throw new Error(message || `${field} must be no more than ${maxLength} characters`);
                }
            }
        };
    }

    static numeric(field: string, message?: string): ValidationRule {
        return {
            name: 'numeric',
            field,
            validate: (data: any) => {
                const value = data[field];
                if (value !== undefined && value !== null && isNaN(Number(value))) {
                    throw new Error(message || `${field} must be a number`);
                }
            }
        };
    }

    static positive(field: string, message?: string): ValidationRule {
        return {
            name: 'positive',
            field,
            validate: (data: any) => {
                const value = Number(data[field]);
                if (value !== undefined && value !== null && value <= 0) {
                    throw new Error(message || `${field} must be positive`);
                }
            }
        };
    }

    static enum(field: string, validValues: string[], message?: string): ValidationRule {
        return {
            name: 'enum',
            field,
            validate: (data: any) => {
                const value = data[field];
                if (value && !validValues.includes(value)) {
                    throw new Error(message || `${field} must be one of: ${validValues.join(', ')}`);
                }
            }
        };
    }
}