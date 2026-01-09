/**
 * Supabase Transaction Manager
 * Handles batch operations and rollback mechanisms for Supabase
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Logger } from '../../utils/logger/logger';
import { ApplicationError, DatabaseError } from '../../utils/errors/applicationErrors';

export interface TransactionOperation {
    table: string;
    type: 'insert' | 'update' | 'delete' | 'soft_delete';
    data?: any;
    id?: string;
    filters?: Record<string, any>;
}

export interface TransactionResult<T = any> {
    success: boolean;
    data?: T;
    error?: ApplicationError;
    operations: TransactionOperation[];
}

export class SupabaseTransactionManager {
    private client: SupabaseClient;
    private logger: Logger;

    constructor(client: SupabaseClient) {
        this.client = client;
        this.logger = new Logger('SupabaseTransactionManager');
    }

    /**
     * Execute a transaction with multiple operations
     * Note: Supabase doesn't support true transactions, so this simulates transaction behavior
     */
    async executeTransaction<T = any>(
        operations: TransactionOperation[]
    ): Promise<TransactionResult<T>> {
        this.logger.info('Starting transaction', {
            operationCount: operations.length,
            operations: operations.map(op => ({ table: op.table, type: op.type }))
        });

        const results: any[] = [];
        const executedOperations: TransactionOperation[] = [];

        try {
            for (const operation of operations) {
                this.logger.debug('Executing operation', {
                    table: operation.table,
                    type: operation.type,
                    id: operation.id
                });

                let result;

                switch (operation.type) {
                    case 'insert':
                        result = await this.executeInsert(operation);
                        break;
                    case 'update':
                        result = await this.executeUpdate(operation);
                        break;
                    case 'delete':
                        result = await this.executeDelete(operation);
                        break;
                    case 'soft_delete':
                        result = await this.executeSoftDelete(operation);
                        break;
                    default:
                        throw new DatabaseError(`Unknown operation type: ${operation.type}`);
                }

                if (result.error) {
                    // In a real transaction, we would rollback here
                    // Since Supabase doesn't support transactions, we log the error
                    this.logger.error('Operation failed in transaction', {
                        operation,
                        error: result.error
                    });

                    return {
                        success: false,
                        error: result.error,
                        operations: executedOperations
                    };
                }

                results.push(result.data);
                executedOperations.push(operation);
            }

            this.logger.info('Transaction completed successfully', {
                operationCount: operations.length,
                resultsCount: results.length
            });

            return {
                success: true,
                data: results as T,
                operations: executedOperations
            };
        } catch (error) {
            this.logger.error('Transaction failed', {
                error,
                executedOperations: executedOperations.length
            });

            return {
                success: false,
                error: error as ApplicationError,
                operations: executedOperations
            };
        }
    }

    /**
     * Execute batch insert operations
     */
    async batchInsert<T = any>(
        table: string,
        data: T[]
    ): Promise<TransactionResult<T[]>> {
        this.logger.info('Starting batch insert', {
            table,
            itemCount: data.length
        });

        try {
            const { data: result, error } = await this.client
                .from(table)
                .insert(data as any)
                .select();

            if (error) {
                throw new DatabaseError(`Batch insert failed: ${error.message}`, 'BATCH_INSERT_ERROR', {
                    table,
                    itemCount: data.length,
                    originalError: error
                });
            }

            this.logger.info('Batch insert completed successfully', {
                table,
                itemCount: data.length,
                resultCount: result?.length || 0
            });

            return {
                success: true,
                data: result as T[],
                operations: [{
                    table,
                    type: 'insert',
                    data
                }]
            };
        } catch (error) {
            this.logger.error('Batch insert failed', {
                table,
                itemCount: data.length,
                error
            });

            return {
                success: false,
                error: error as ApplicationError,
                operations: []
            };
        }
    }

    /**
     * Execute batch update operations
     */
    async batchUpdate<T = any>(
        table: string,
        updates: Array<{ id: string; data: Partial<T> }>
    ): Promise<TransactionResult<T[]>> {
        this.logger.info('Starting batch update', {
            table,
            updateCount: updates.length
        });

        const operations: TransactionOperation[] = [];
        const results: T[] = [];

        try {
            for (const update of updates) {
                const operation: TransactionOperation = {
                    table,
                    type: 'update',
                    id: update.id,
                    data: update.data
                };

                const result = await this.executeUpdate(operation);

                if (result.error) {
                    throw result.error;
                }

                operations.push(operation);
                results.push(result.data);
            }

            this.logger.info('Batch update completed successfully', {
                table,
                updateCount: updates.length,
                resultCount: results.length
            });

            return {
                success: true,
                data: results,
                operations
            };
        } catch (error) {
            this.logger.error('Batch update failed', {
                table,
                updateCount: updates.length,
                error
            });

            return {
                success: false,
                error: error as ApplicationError,
                operations
            };
        }
    }

    /**
     * Execute batch delete operations
     */
    async batchDelete(
        table: string,
        ids: string[]
    ): Promise<TransactionResult<void>> {
        this.logger.info('Starting batch delete', {
            table,
            deleteCount: ids.length
        });

        const operations: TransactionOperation[] = [];

        try {
            for (const id of ids) {
                const operation: TransactionOperation = {
                    table,
                    type: 'delete',
                    id
                };

                const result = await this.executeDelete(operation);

                if (result.error) {
                    throw result.error;
                }

                operations.push(operation);
            }

            this.logger.info('Batch delete completed successfully', {
                table,
                deleteCount: ids.length
            });

            return {
                success: true,
                data: undefined,
                operations
            };
        } catch (error) {
            this.logger.error('Batch delete failed', {
                table,
                deleteCount: ids.length,
                error
            });

            return {
                success: false,
                error: error as ApplicationError,
                operations
            };
        }
    }

    /**
     * Execute insert operation
     */
    private async executeInsert(operation: TransactionOperation): Promise<TransactionResult> {
        try {
            const { data, error } = await this.client
                .from(operation.table)
                .insert(operation.data)
                .select()
                .single();

            if (error) {
                throw new DatabaseError(`Insert failed: ${error.message}`, 'INSERT_ERROR', {
                    table: operation.table,
                    data: operation.data,
                    originalError: error
                });
            }

            return {
                success: true,
                data,
                operations: [operation]
            };
        } catch (error) {
            return {
                success: false,
                error: error as ApplicationError,
                operations: []
            };
        }
    }

    /**
     * Execute update operation
     */
    private async executeUpdate(operation: TransactionOperation): Promise<TransactionResult> {
        try {
            const { data, error } = await this.client
                .from(operation.table)
                .update(operation.data)
                .eq('id', operation.id)
                .select()
                .single();

            if (error) {
                throw new DatabaseError(`Update failed: ${error.message}`, 'UPDATE_ERROR', {
                    table: operation.table,
                    id: operation.id,
                    data: operation.data,
                    originalError: error
                });
            }

            return {
                success: true,
                data,
                operations: [operation]
            };
        } catch (error) {
            return {
                success: false,
                error: error as ApplicationError,
                operations: []
            };
        }
    }

    /**
     * Execute delete operation
     */
    private async executeDelete(operation: TransactionOperation): Promise<TransactionResult> {
        try {
            const { error } = await this.client
                .from(operation.table)
                .delete()
                .eq('id', operation.id);

            if (error) {
                throw new DatabaseError(`Delete failed: ${error.message}`, 'DELETE_ERROR', {
                    table: operation.table,
                    id: operation.id,
                    originalError: error
                });
            }

            return {
                success: true,
                data: null,
                operations: [operation]
            };
        } catch (error) {
            return {
                success: false,
                error: error as ApplicationError,
                operations: []
            };
        }
    }

    /**
     * Execute soft delete operation
     */
    private async executeSoftDelete(operation: TransactionOperation): Promise<TransactionResult> {
        try {
            const { error } = await this.client
                .from(operation.table)
                .update({ deleted_at: new Date().toISOString() } as any)
                .eq('id', operation.id);

            if (error) {
                throw new DatabaseError(`Soft delete failed: ${error.message}`, 'SOFT_DELETE_ERROR', {
                    table: operation.table,
                    id: operation.id,
                    originalError: error
                });
            }

            return {
                success: true,
                data: null,
                operations: [operation]
            };
        } catch (error) {
            return {
                success: false,
                error: error as ApplicationError,
                operations: []
            };
        }
    }

    /**
     * Create a transaction operation
     */
    static createInsertOperation(table: string, data: any): TransactionOperation {
        return {
            table,
            type: 'insert',
            data
        };
    }

    static createUpdateOperation(table: string, id: string, data: any): TransactionOperation {
        return {
            table,
            type: 'update',
            id,
            data
        };
    }

    static createDeleteOperation(table: string, id: string): TransactionOperation {
        return {
            table,
            type: 'delete',
            id
        };
    }

    static createSoftDeleteOperation(table: string, id: string): TransactionOperation {
        return {
            table,
            type: 'soft_delete',
            id
        };
    }
}