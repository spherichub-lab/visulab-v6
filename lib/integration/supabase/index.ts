/**
 * Supabase Integration Layer Index
 * Central export point for all Supabase integration components
 *
 * FIX: Removed SupabaseClientManager - using single client from lib/supabase.ts
 */

export { SupabaseQueryBuilder } from './supabaseQueryBuilder';
export { SupabaseErrorHandler } from './supabaseErrorHandler';
export { SupabaseTransactionManager } from './supabaseTransactionManager';

export type { SupabaseQueryResult } from './supabaseQueryBuilder';
export type { TransactionOperation, TransactionResult } from './supabaseTransactionManager';