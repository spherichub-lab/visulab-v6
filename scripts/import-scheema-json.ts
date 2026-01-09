/**
 * Import Script for scheema-sql.json
 * 
 * This script imports data from scheema-sql.json into the Supabase database.
 * It validates JSON structure, normalizes data, and imports records in the
 * correct order respecting foreign key dependencies.
 * 
 * Usage: npm run import:scheema
 *        tsx scripts/import-scheema-json.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import './load-env';

// Configuration
const SCHEEMA_JSON_PATH = join(process.cwd(), 'scheema-sql.json');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

// Use service key for import operations (bypasses RLS policies)
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

// Validation
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    console.error('   Optional: VITE_SUPABASE_SERVICE_KEY (for write access)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

if (supabaseServiceKey) {
    console.log('🔑 Using SERVICE_ROLE key for import operations (bypasses RLS policies)');
} else {
    console.log('⚠️  Using ANON key - RLS policies will be enforced');
    console.log('   Add VITE_SUPABASE_SERVICE_KEY to .env.local for full write access');
}
console.log();

// Type definitions
interface ScheemaData {
    export_all_public_tables: {
        tipos: Tipo[];
        indices: Indice[];
        tratamentos: Tratamento[];
        empresas: Empresa[];
        usuarios: Usuario[];
        compras: Compra[];
        faltas: Falta[];
    };
}

interface Tipo {
    id: string;
    nome: string;
    created_at: string;
}

interface Indice {
    id: string;
    nome: string;
    created_at: string;
}

interface Tratamento {
    id: string;
    nome: string;
    created_at: string;
}

interface Empresa {
    id: string;
    nome: string;
    tipo: string;
    status: string;
    contato_nome?: string | null;
    contato_email?: string | null;
    deleted_at?: string | null;
    created_at: string;
    updated_at: string;
}

interface Usuario {
    id: string;
    nome: string;
    email: string;
    role: string;
    status: string;
    empresa_id: string;
    last_active?: string;
    avatar_url?: string | null;
    initials?: string | null;
    deleted_at?: string | null;
    created_at: string;
    updated_at: string;
}

interface Compra {
    id: string;
    fornecedor: string;
    data_compra: string;
    valor_total: number;
    status: string;
    descricao?: string;
    created_at: string;
    updated_at: string;
}

interface Falta {
    id: string;
    cil: number;
    esf: number;
    tipo_id: string;
    indice_id: string;
    tratamento_id: string;
    empresa_id?: string | null;
    quantidade: number;
    usuario_id: string;
    created_at: string;
    updated_at: string;
}

// Import statistics
interface ImportStats {
    table: string;
    total: number;
    success: number;
    failed: number;
    errors: Array<{ id: string; error: string }>;
}

const stats: Record<string, ImportStats> = {};

// Helper functions
function logTable(tableName: string, message: string, type: 'info' | 'success' | 'error' = 'info') {
    const colors = {
        info: '\x1b[36m',    // Cyan
        success: '\x1b[32m', // Green
        error: '\x1b[31m'    // Red
    };
    const reset = '\x1b[0m';
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '📊';
    console.log(`${colors[type]}${icon} [${tableName}]${reset} ${message}`);
}

function initStats(tableName: string, total: number) {
    stats[tableName] = {
        table: tableName,
        total,
        success: 0,
        failed: 0,
        errors: []
    };
}

function updateStats(tableName: string, id: string, success: boolean, error?: string) {
    if (stats[tableName]) {
        if (success) {
            stats[tableName].success++;
        } else {
            stats[tableName].failed++;
            if (error) {
                stats[tableName].errors.push({ id, error });
            }
        }
    }
}

// Validation functions
function validateScheemaStructure(data: any): data is ScheemaData {
    if (!Array.isArray(data) || data.length === 0) {
        console.error('❌ Invalid JSON structure: Expected array with one element');
        return false;
    }

    const root = data[0];
    if (!root.export_all_public_tables) {
        console.error('❌ Invalid JSON structure: Missing export_all_public_tables');
        return false;
    }

    const tables = root.export_all_public_tables;
    const requiredTables = ['tipos', 'indices', 'tratamentos', 'empresas', 'usuarios', 'compras', 'faltas'];

    for (const table of requiredTables) {
        if (!Array.isArray(tables[table])) {
            console.error(`❌ Invalid JSON structure: Missing or invalid table '${table}'`);
            return false;
        }
    }

    return true;
}

// Normalization functions
function normalizeRole(role: string): string {
    const roleMapping: Record<string, string> = {
        'Administrador': 'admin',
        'Usuário': 'user',
        'Admin': 'admin',
        'User': 'user'
    };
    return roleMapping[role] || role.toLowerCase();
}

function normalizeStatus(status: string): string {
    const statusMapping: Record<string, string> = {
        'Active': 'Active',
        'Ativa': 'Ativa',
        'Inativa': 'Inativa',
        'Offline': 'Offline',
        'Pending': 'Pending',
        'Inactive': 'Inactive'
    };
    return statusMapping[status] || status;
}

// Import functions
async function importTable<T extends Record<string, any>>(
    tableName: string,
    data: T[],
    normalizeFn?: (item: T) => T
): Promise<void> {
    logTable(tableName, `Starting import of ${data.length} records...`);
    initStats(tableName, data.length);

    for (const item of data) {
        try {
            // Apply normalization if provided
            const normalizedItem = normalizeFn ? normalizeFn(item) : item;

            // Upsert record (insert or update if exists)
            const { error } = await supabase
                .from(tableName)
                .upsert(normalizedItem, { onConflict: 'id' });

            if (error) {
                throw error;
            }

            updateStats(tableName, item.id, true);
            logTable(tableName, `✓ Imported: ${item.id}`, 'success');
        } catch (error: any) {
            updateStats(tableName, item.id, false, error.message);
            logTable(tableName, `✗ Failed: ${item.id} - ${error.message}`, 'error');
        }
    }

    const { success, failed } = stats[tableName];
    logTable(
        tableName,
        `Completed: ${success} succeeded, ${failed} failed`,
        failed === 0 ? 'success' : 'error'
    );
}

// Specific import functions with normalization
async function importUsuarios(data: Usuario[]): Promise<void> {
    logTable('usuarios', `Starting import of ${data.length} records...`);
    initStats('usuarios', data.length);

    for (const usuario of data) {
        try {
            const normalized: Partial<Usuario> = {
                ...usuario,
                role: normalizeRole(usuario.role),
                status: normalizeStatus(usuario.status)
            };

            const { error } = await supabase
                .from('usuarios')
                .upsert(normalized, { onConflict: 'id' });

            if (error) throw error;

            updateStats('usuarios', usuario.id, true);
            logTable('usuarios', `✓ Imported: ${usuario.nome} (${usuario.email})`, 'success');
        } catch (error: any) {
            updateStats('usuarios', usuario.id, false, error.message);
            logTable('usuarios', `✗ Failed: ${usuario.id} - ${error.message}`, 'error');
        }
    }

    const { success, failed } = stats['usuarios'];
    logTable(
        'usuarios',
        `Completed: ${success} succeeded, ${failed} failed`,
        failed === 0 ? 'success' : 'error'
    );
}

async function importCompras(data: Compra[]): Promise<void> {
    logTable('compras', `Starting import of ${data.length} records...`);
    initStats('compras', data.length);

    for (const compra of data) {
        try {
            const normalized: Partial<Compra> = {
                ...compra,
                status: normalizeStatus(compra.status)
            };

            const { error } = await supabase
                .from('compras')
                .upsert(normalized, { onConflict: 'id' });

            if (error) throw error;

            updateStats('compras', compra.id, true);
            logTable('compras', `✓ Imported: ${compra.descricao || compra.fornecedor}`, 'success');
        } catch (error: any) {
            updateStats('compras', compra.id, false, error.message);
            logTable('compras', `✗ Failed: ${compra.id} - ${error.message}`, 'error');
        }
    }

    const { success, failed } = stats['compras'];
    logTable(
        'compras',
        `Completed: ${success} succeeded, ${failed} failed`,
        failed === 0 ? 'success' : 'error'
    );
}

// Generate final report
function generateReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📋 IMPORT REPORT');
    console.log('='.repeat(80) + '\n');

    let totalRecords = 0;
    let totalSuccess = 0;
    let totalFailed = 0;

    Object.values(stats).forEach(stat => {
        totalRecords += stat.total;
        totalSuccess += stat.success;
        totalFailed += stat.failed;

        console.log(`\n📊 ${stat.table.toUpperCase()}`);
        console.log(`   Total: ${stat.total}`);
        console.log(`   ✅ Success: ${stat.success}`);
        console.log(`   ❌ Failed: ${stat.failed}`);

        if (stat.errors.length > 0) {
            console.log(`   Errors:`);
            stat.errors.forEach(err => {
                console.log(`      - ${err.id}: ${err.error}`);
            });
        }
    });

    console.log('\n' + '='.repeat(80));
    console.log('📈 OVERALL STATISTICS');
    console.log('='.repeat(80));
    console.log(`Total Records: ${totalRecords}`);
    console.log(`✅ Successful: ${totalSuccess}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`Success Rate: ${((totalSuccess / totalRecords) * 100).toFixed(2)}%`);
    console.log('='.repeat(80) + '\n');

    if (totalFailed > 0) {
        console.log('⚠️  Some records failed to import. Please review the errors above.');
    } else {
        console.log('🎉 All records imported successfully!');
    }
}

// Main function
async function main() {
    console.log('🚀 Starting import from scheema-sql.json...\n');

    try {
        // Read and parse JSON file
        console.log('📖 Reading scheema-sql.json...');
        const jsonContent = readFileSync(SCHEEMA_JSON_PATH, 'utf-8');
        const jsonData = JSON.parse(jsonContent);

        // Validate structure
        console.log('🔍 Validating JSON structure...');
        if (!validateScheemaStructure(jsonData)) {
            console.error('❌ JSON validation failed');
            process.exit(1);
        }
        console.log('✅ JSON structure is valid\n');

        const data = jsonData[0].export_all_public_tables;

        // Import in correct order (respecting FK dependencies)
        console.log('📦 Starting data import...\n');

        // 1. Reference tables (no dependencies)
        await importTable('tipos', data.tipos);
        await importTable('indices', data.indices);
        await importTable('tratamentos', data.tratamentos);

        // 2. Empresas (no dependencies)
        await importTable('empresas', data.empresas);

        // 3. Usuarios (depends on empresas)
        await importUsuarios(data.usuarios);

        // 4. Compras (no dependencies)
        await importCompras(data.compras);

        // 5. Faltas (depends on all above)
        await importTable('faltas', data.faltas);

        // Generate report
        generateReport();

        console.log('\n✅ Import process completed!\n');

    } catch (error: any) {
        console.error('\n❌ Fatal error during import:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run script
main();
