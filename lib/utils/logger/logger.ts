/**
 * Logger utility for VisuLab application
 * Provides structured logging with different levels and contexts
 */

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    FATAL = 4
}

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    context: string;
    message: string;
    data?: any;
    error?: Error;
}

export interface LoggerConfig {
    level: LogLevel;
    enableConsole: boolean;
    enableFile: boolean;
    filePath?: string;
    format: 'json' | 'text';
}

export class Logger {
    private context: string;
    private config: LoggerConfig;

    constructor(context: string, config?: Partial<LoggerConfig>) {
        this.context = context;
        this.config = {
            level: LogLevel.INFO,
            enableConsole: true,
            enableFile: false,
            format: 'text',
            ...config
        };
    }

    /**
     * Log debug message
     */
    public debug(message: string, data?: any): void {
        this.log(LogLevel.DEBUG, message, data);
    }

    /**
     * Log info message
     */
    public info(message: string, data?: any): void {
        this.log(LogLevel.INFO, message, data);
    }

    /**
     * Log warning message
     */
    public warn(message: string, data?: any): void {
        this.log(LogLevel.WARN, message, data);
    }

    /**
     * Log error message
     */
    public error(message: string, error?: Error | any): void {
        this.log(LogLevel.ERROR, message, undefined, error);
    }

    /**
     * Log fatal error message
     */
    public fatal(message: string, error?: Error | any): void {
        this.log(LogLevel.FATAL, message, undefined, error);
    }

    /**
     * Core logging method
     */
    private log(level: LogLevel, message: string, data?: any, error?: Error): void {
        if (level < this.config.level) {
            return;
        }

        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            context: this.context,
            message,
            data,
            error
        };

        if (this.config.enableConsole) {
            this.logToConsole(logEntry);
        }

        if (this.config.enableFile && this.config.filePath) {
            this.logToFile(logEntry);
        }
    }

    /**
     * Log to console
     */
    private logToConsole(entry: LogEntry): void {
        const levelName = LogLevel[entry.level];
        const timestamp = entry.timestamp;
        const context = entry.context;

        let logMessage = `[${timestamp}] ${levelName} [${context}]: ${entry.message}`;

        if (entry.data) {
            logMessage += ` | Data: ${JSON.stringify(entry.data)}`;
        }

        if (entry.error) {
            logMessage += ` | Error: ${entry.error.message}`;
            if (entry.error.stack) {
                logMessage += `\nStack: ${entry.error.stack}`;
            }
        }

        switch (entry.level) {
            case LogLevel.DEBUG:
                console.debug(logMessage);
                break;
            case LogLevel.INFO:
                console.info(logMessage);
                break;
            case LogLevel.WARN:
                console.warn(logMessage);
                break;
            case LogLevel.ERROR:
            case LogLevel.FATAL:
                console.error(logMessage);
                break;
        }
    }

    /**
     * Log to file (simplified implementation)
     */
    private logToFile(entry: LogEntry): void {
        // In a real implementation, this would write to a file
        // For now, we'll just log to console with a file indicator
        console.log(`[FILE] ${this.formatLogEntry(entry)}`);
    }

    /**
     * Format log entry
     */
    private formatLogEntry(entry: LogEntry): string {
        if (this.config.format === 'json') {
            return JSON.stringify(entry);
        } else {
            const levelName = LogLevel[entry.level];
            let message = `[${entry.timestamp}] ${levelName} [${entry.context}]: ${entry.message}`;

            if (entry.data) {
                message += ` | Data: ${JSON.stringify(entry.data)}`;
            }

            if (entry.error) {
                message += ` | Error: ${entry.error.message}`;
            }

            return message;
        }
    }

    /**
     * Create child logger with additional context
     */
    public child(childContext: string): Logger {
        return new Logger(`${this.context}:${childContext}`, this.config);
    }

    /**
     * Update logger configuration
     */
    public updateConfig(config: Partial<LoggerConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    public getConfig(): LoggerConfig {
        return { ...this.config };
    }
}

/**
 * Default logger factory
 */
export class LoggerFactory {
    private static defaultConfig: LoggerConfig = {
        level: LogLevel.INFO,
        enableConsole: true,
        enableFile: false,
        format: 'text'
    };

    /**
     * Create logger with context
     */
    public static create(context: string, config?: Partial<LoggerConfig>): Logger {
        return new Logger(context, { ...this.defaultConfig, ...config });
    }

    /**
     * Set default configuration for all loggers
     */
    public static setDefaultConfig(config: Partial<LoggerConfig>): void {
        this.defaultConfig = { ...this.defaultConfig, ...config };
    }

    /**
     * Get default configuration
     */
    public static getDefaultConfig(): LoggerConfig {
        return { ...this.defaultConfig };
    }
}

/**
 * Global logger instance
 */
export const logger = LoggerFactory.create('VisuLab');